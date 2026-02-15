#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BINARY="$(find "$SCRIPT_DIR" -maxdepth 1 -name 'openglue-*' -print -quit 2>/dev/null)"
BINARY_ARGS=()

if [[ -z "$BINARY" || ! -f "$BINARY" ]]; then
	if command -v bun &>/dev/null && [[ -f "$SCRIPT_DIR/index.ts" ]]; then
		echo ":: no binary found, falling back to bun index.ts"
		BINARY="$(command -v bun)"
		BINARY_ARGS=("$SCRIPT_DIR/index.ts")
	else
		echo "error: no openglue-* binary found in $SCRIPT_DIR" >&2
		exit 1
	fi
fi

echo ":: binary: $BINARY"
echo ":: binary args: ${BINARY_ARGS[*]}"
echo ":: script args: $*"

# ── Container detection ──────────────────────────────────────────────
# Skip isolation if we're already inside a container/sandbox.

is_containerized() {
	[[ -n "${container:-}" ]] && return 0
	[[ -f "/.dockerenv" ]] && return 0
	[[ -f "/run/.containerenv" ]] && return 0

	if [[ -f "/proc/sys/kernel/osrelease" ]]; then
		grep -qiE "microsoft|wsl" /proc/sys/kernel/osrelease 2>/dev/null && return 0
	fi

	if [[ -f "/proc/1/cgroup" ]]; then
		grep -qE "docker|kubepods|containerd|lxc" /proc/1/cgroup 2>/dev/null && return 0
	fi

	if [[ -f "/proc/self/mountinfo" ]]; then
		grep -qE "/docker/containers/|/libpod-" /proc/self/mountinfo 2>/dev/null && return 0
	fi

	return 1
}

# ── Isolation backend detection ──────────────────────────────────────
# Priority: bubblewrap > podman/docker > none

find_backend() {
	if command -v bwrap &>/dev/null; then
		echo "bubblewrap"
		return
	fi

	if command -v podman &>/dev/null; then
		echo "podman"
		return
	fi

	if command -v docker &>/dev/null && docker info &>/dev/null; then
		echo "docker"
		return
	fi

	echo "none"
}

# ── Command builders ─────────────────────────────────────────────────

run_bubblewrap() {
	local host_home="$HOME"
	local host_uid
	host_uid="$(id -u)"
	local runtime_dir="${XDG_RUNTIME_DIR:-/run/user/$host_uid}"

	local args=(
		bwrap
		--unshare-pid
		--unshare-ipc
		--unshare-uts
		--die-with-parent
	)

	# System mounts — handle symlinks for merged-usr distros (Arch, Fedora)
	for dir in /usr /lib /lib64 /bin /sbin /etc /opt; do
		if [[ -L "$dir" ]]; then
			args+=(--symlink "$(readlink "$dir")" "$dir")
		elif [[ -d "$dir" ]]; then
			args+=(--ro-bind "$dir" "$dir")
		fi
	done

	# Proc & dev — do NOT --dev-bind /dev/pts or /dev/ptmx, breaks PTY allocation
	args+=(--proc /proc --dev /dev)

	# Writable ephemeral layers
	args+=(--tmpfs "$host_home")
	args+=(--tmpfs /tmp)
	args+=(--tmpfs /var/tmp)
	args+=(--tmpfs "$runtime_dir")

	# Project directory: read-write
	args+=(--bind "$SCRIPT_DIR" "$SCRIPT_DIR")
	args+=(--chdir "$SCRIPT_DIR")

	# DNS
	for f in /etc/resolv.conf /etc/hosts /etc/nsswitch.conf; do
		[[ -f "$f" ]] && args+=(--ro-bind "$f" "$f")
	done

	# SSL/TLS certificates
	for p in /etc/ssl /etc/ca-certificates /etc/pki /etc/crypto-policies /usr/share/ca-certificates; do
		[[ -d "$p" ]] && args+=(--ro-bind "$p" "$p")
	done

	# Persist toolchain state inside the project dir so mise doesn't reinstall each run
	args+=(--setenv RUSTUP_HOME "$SCRIPT_DIR/data/rustup")
	args+=(--setenv CARGO_HOME "$SCRIPT_DIR/data/cargo")
	args+=(--setenv GOPATH "$SCRIPT_DIR/data/go")
	args+=(--setenv RUSTUP_INIT_SKIP_PATH_CHECK yes)

	# Environment
	args+=(
		--setenv HOME "$host_home"
		--setenv USER "$(id -un)"
		--setenv TERM "${TERM:-xterm-256color}"
		--setenv COLORTERM "${COLORTERM:-truecolor}"
		--setenv LANG "${LANG:-en_US.UTF-8}"
		--setenv SHELL "/bin/sh"
		--setenv XDG_RUNTIME_DIR "$runtime_dir"
	)

	args+=(-- "$BINARY" "${BINARY_ARGS[@]}" "$@")
	exec "${args[@]}"
}

run_container() {
	local cli="$1"
	shift

	local selinux=""
	[[ "$cli" == "podman" ]] && selinux=":Z"

	exec "$cli" run --rm --interactive --tty \
		--env OPENGLUE_ISOLATION \
		--env TERM="${TERM:-xterm-256color}" \
		--env COLORTERM="${COLORTERM:-truecolor}" \
		--env LANG="C.UTF-8" \
		--env SHELL="/bin/sh" \
		--volume "$SCRIPT_DIR:$SCRIPT_DIR$selinux" \
		--workdir "$SCRIPT_DIR" \
		docker.io/library/ubuntu:latest \
		"$BINARY" "${BINARY_ARGS[@]}" "$@"
}

run_none() {
	echo ":: exec: $BINARY ${BINARY_ARGS[*]} $*"
	exec "$BINARY" "${BINARY_ARGS[@]}" "$@"
}

# ── Main ─────────────────────────────────────────────────────────────

run_backend() {
	local backend="$1"
	shift

	export OPENGLUE_ISOLATION="$backend"
	echo ":: isolation backend: $backend"

	case "$backend" in
	bubblewrap) run_bubblewrap "$@" ;;
	podman) run_container podman "$@" ;;
	docker) run_container docker "$@" ;;
	none) run_none "$@" ;;
	*)
		echo "error: unknown backend '$backend'" >&2
		echo "usage: $0 [bubblewrap|podman|docker|none] [args...]" >&2
		exit 1
		;;
	esac
}

main() {
	# If first argument is a known backend, use it
	case "${1:-}" in
	bubblewrap | podman | docker | none)
		run_backend "$@"
		;;
	*)
		if is_containerized; then
			echo ":: already containerized, running directly"
			run_none "$@"
		fi

		local backend
		backend="$(find_backend)"

		if [[ "$backend" == "none" ]]; then
			echo ":: no isolation backend found (bubblewrap, podman, docker)"
			echo ":: running without isolation is not recommended"
			echo ""
			echo "   to proceed anyway, run:"
			echo "     ./run.sh none"
			echo ""
			echo "   to install bubblewrap (recommended):"
			echo "     sudo apt install bubblewrap    # Debian/Ubuntu"
			echo "     sudo pacman -S bubblewrap      # Arch"
			echo "     sudo dnf install bubblewrap    # Fedora"
			echo ""
			echo "   or install podman:"
			echo "     sudo apt install podman         # Debian/Ubuntu"
			echo "     sudo pacman -S podman           # Arch"
			echo "     sudo dnf install podman         # Fedora"
			echo ""
			echo "   or install docker:"
			echo "     https://docs.docker.com/engine/install/"
			exit 1
		fi

		run_backend "$backend" "$@"
		;;
	esac
}

main "$@"

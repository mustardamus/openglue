# openglue

openglue is a self-contained, portable development environment bootstrapper written in TypeScript. It downloads, installs, and configures a full suite of dev tools -- all scoped locally to the project directory. No global installs. No `sudo`. No "works on my machine". Just run one command and get a fully wired-up terminal session with everything you need.

Think of it as the glue that holds a bunch of fantastic open-source tools together so you don't have to mass-copy dotfiles from a blog post written in 2014.

## What It Actually Does

When you run the binary (or `bun run index.ts`), the following cascade of events unfolds:

1. Bootstraps embedded config files (mise.toml, zellij, fish, starship, opencode, etc.) to the working directory if they don't already exist
2. Downloads [mise](https://github.com/jdx/mise) (a polyglot runtime manager) if it's not already sitting in `./bin/`
3. Uses mise to install a curated set of tools (see below), installing Node.js first so npm is available for npm-based packages
4. Installs a Chromium browser via Playwright (for Chrome DevTools MCP -- yes, your AI can browse the web now, be afraid)
5. Clones and installs the [Zellij MCP Server](https://github.com/mustardamus/zellij-mcp-server) (so your AI can manage terminal panes too -- no one is safe)
6. Wires up all the environment paths so tools can actually find each other
7. Launches a [Zellij](https://zellij.dev/) terminal multiplexer session with [Fish](https://fishshell.com/) shell, Tokyo Night theme, and a preconfigured layout

You end up in a beautiful, fully isolated terminal workspace. Everything lives inside the project directory. Delete the folder and it's like it never happened. Like a responsible one-night stand with your operating system.

The Zellij session name is derived from the basename of the current working directory, so running from `/home/user/myproject` gives you a session named `myproject`.

## The Tool Belt

| Tool                                                                     | What It Does           | Why It's Here                                                 |
| ------------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------------- |
| [Bun](https://bun.com)                                                   | JS/TS runtime          | Fast. Like, unreasonably fast.                                |
| [Node.js](https://nodejs.org)                                            | JS runtime             | Because npm packages still exist                              |
| [Playwright](https://playwright.dev)                                     | Browser automation     | Installs Chromium for Chrome DevTools MCP                     |
| [Chrome DevTools MCP](https://www.npmjs.com/package/chrome-devtools-mcp) | MCP server             | Lets AI coding assistants inspect browsers                    |
| [Zellij MCP Server](https://github.com/mustardamus/zellij-mcp-server)    | MCP server             | Lets AI coding assistants control Zellij sessions             |
| [Fish](https://fishshell.com)                                            | Shell                  | Autocompletions that actually work                            |
| [opencode](https://opencode.ai)                                          | AI coding assistant    | Your new pair programmer (TUI)                                |
| [Zellij](https://zellij.dev)                                             | Terminal multiplexer   | tmux but you don't need a PhD to configure it                 |
| [Starship](https://starship.rs)                                          | Shell prompt           | Minimal, fast, cross-shell prompt                             |
| [lazygit](https://github.com/jesseduffield/lazygit)                      | Git TUI                | For when `git log --oneline --graph` isn't cutting it         |
| [Python](https://python.org)                                             | Language runtime       | The lingua franca of scripts, ML, and "it works on my laptop" |
| [uv](https://github.com/astral-sh/uv)                                    | Python package manager | pip but mass-produced in Rust                                 |
| [Rust](https://rust-lang.org)                                            | Language toolchain     | For when you want speed and the compiler to yell at you       |
| [Go](https://go.dev)                                                     | Language toolchain     | Concurrency, simplicity, and `if err != nil`                  |

## Formatting

Code formatting is handled by the `/format` command in opencode. It automatically detects changed files, maps them to the appropriate formatter, and installs any missing formatters via mise on-the-fly.

| Formatter | Mise package         | File types                                                               |
| --------- | -------------------- | ------------------------------------------------------------------------ |
| Biome     | `npm:@biomejs/biome` | `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.json`, `.jsonc`, `.css`, `.scss` |
| Prettier  | `npm:prettier`       | `.md`, `.html`, `.yaml`, `.yml`                                          |
| Taplo     | `npm:@taplo/cli`     | `.toml`                                                                  |
| rustfmt   | (bundled with rust)  | `.rs`                                                                    |
| gofmt     | (bundled with go)    | `.go`                                                                    |
| kdlfmt    | `cargo:kdlfmt`       | `.kdl`                                                                   |
| shfmt     | `aqua:mvdan/sh`      | `.sh`                                                                    |

For file types not listed above, the format command will research the standard formatter, propose it, and install it on confirmation. All formatters are managed through mise and run via `mise exec --`.

## Linters

Code linting is handled by the `/lint` command in opencode. Like `/format`, it automatically detects changed files, maps them to the appropriate linter, and installs any missing linters via mise on-the-fly.

| Linter       | Mise package               | File types                                                               |
| ------------ | -------------------------- | ------------------------------------------------------------------------ |
| Biome        | `npm:@biomejs/biome`       | `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.json`, `.jsonc`, `.css`, `.scss` |
| Taplo        | `npm:@taplo/cli`           | `.toml`                                                                  |
| markdownlint | `npm:markdownlint-cli`     | `.md`                                                                    |
| yamllint     | `pipx:yamllint`            | `.yaml`, `.yml`                                                          |
| kdlfmt       | `cargo:kdlfmt`             | `.kdl`                                                                   |
| shellcheck   | `aqua:koalaman/shellcheck` | `.sh`                                                                    |

For file types not listed above, the lint command will research the standard linter, propose it, and install it on confirmation. All linters are managed through mise and run via `mise exec --`.

## Getting Started

### Prerequisites

- Linux or macOS (x64 or ARM)
- An internet connection (at least for the first run)
- [git](https://git-scm.com/) (the Zellij MCP server is currently cloned from source; TODO: release on npm and install via mise)

### Using the Compiled Binary

Download the binary for your platform from releases and run it from any directory:

```bash
mkdir myproject && cd myproject
./openglue-linux-x64
```

On first run, the binary bootstraps all config files -- including `run.sh` -- then exits with a message telling you to use `run.sh` instead. From that point on:

```bash
./run.sh
```

That's it. Go make coffee. When you come back, you'll have a fully configured Zellij session staring at you.

### From Source

Requires [Bun](https://bun.com) v1.3.9+.

```bash
# Clone the repo
git clone <this-repo-url> && cd openglue

# Install the one TypeScript dependency we have
bun install

# Launch directly
bun run index.ts

# Or build the binaries
bun run build
```

The build produces binaries for all supported platforms in `./dist/`.

#### Build Dependencies

Linux targets are compiled inside the official `oven/bun` Docker image to ensure ICU is statically linked (avoiding `libicu` version mismatches across distros). This requires [Podman](https://podman.io/) on the build machine:

```bash
# Debian/Ubuntu
sudo apt install podman

# Arch
sudo pacman -S podman

# Fedora
sudo dnf install podman
```

Darwin targets are compiled natively and don't require Podman.

### Environment Variables

The `.env` file controls where everything lives. By default, all paths are relative to the project root:

| Variable                     | Default                     | What It Controls                                  |
| ---------------------------- | --------------------------- | ------------------------------------------------- |
| `MISE_DATA_DIR`              | `./mise`                    | Where mise stores its data                        |
| `MISE_CACHE_DIR`             | `./mise/cache`              | Where mise caches downloads                       |
| `XDG_CONFIG_HOME`            | `./config`                  | Tool configurations (Fish, Zellij, lazygit, etc.) |
| `XDG_DATA_HOME`              | `./data`                    | Application data                                  |
| `XDG_STATE_HOME`             | `./state`                   | Application state                                 |
| `XDG_CACHE_HOME`             | `./cache`                   | Caches (including Playwright browsers)            |
| `BROWSER`                    | `zen-browser`               | Default browser                                   |
| `ZELLIJ_MCP_SERVER_DUMP_DIR` | `./cache/zellij-mcp-server` | Zellij MCP Server dump directory                  |

## Project Structure

```text
openglue/
├── index.ts              # The orchestrator. Runs the whole show.
├── run.sh                # Isolation wrapper (embedded, bootstrapped on first run)
├── src/
│   ├── bootstrap.ts      # Embeds and writes config files on first run
│   ├── github.ts         # GitHub API client for downloading releases
│   ├── mise.ts           # mise binary management and command runner
│   └── playwright.ts     # Chromium installation and path discovery
├── tasks/
│   └── build.ts          # Cross-platform binary compilation script
├── config/               # All tool configs live here (XDG_CONFIG_HOME)
│   ├── fish/             # Fish shell config
│   ├── starship.toml     # Starship prompt config
│   ├── zellij/           # Zellij config + layouts (Tokyo Night theme)
│   └── lazygit/          # lazygit config
├── bin/                  # Downloaded binaries (mise lives here)
├── mise/                 # mise internal data (tools installed here)
├── data/                 # XDG_DATA_HOME (also rustup, cargo, go toolchains)
├── state/                # XDG_STATE_HOME
├── cache/                # XDG_CACHE_HOME (Playwright browsers live here)
├── .env.example          # Environment template
├── mise.toml             # Tool definitions for mise
├── opencode.json         # opencode AI assistant config
├── package.json          # Project manifest
└── tsconfig.json         # TypeScript config (strict, as God intended)
```

## Sandbox Isolation

openglue refuses to run unless it's launched through `run.sh`. The binary checks for the `OPENGLUE_ISOLATION` environment variable (set by `run.sh`) and exits immediately if it's missing. This ensures every run goes through the isolation layer.

### How It Works

`run.sh` is embedded inside the compiled binary and bootstrapped to disk on first run alongside all other config files. It's a plain bash script that:

1. **Detects if already containerized** -- checks for `/.dockerenv`, `/run/.containerenv`, the `$container` env var, cgroup contents, and WSL kernel signatures. If already inside a container, it runs the binary directly.
2. **Finds the best available isolation backend** in priority order:
   - **[Bubblewrap](https://github.com/containers/bubblewrap)** (recommended) -- lightweight namespace sandbox, no daemon, no root
   - **[Podman](https://podman.io/)** -- daemonless, rootless container runtime
   - **[Docker](https://www.docker.com/)** -- container runtime (requires running daemon)
3. **Wraps the binary** in the chosen isolation backend and execs it.

If no backend is found, `run.sh` prints install instructions and exits. It won't silently run without isolation.

### What the Podman/Docker Backend Does

The container backend runs the binary inside an `ubuntu:latest` container with:

- **Project directory mounted read-write** -- the project directory is volume-mounted into the container (with `:Z` SELinux relabeling for Podman)
- **Network access preserved** -- needed for downloading tools via mise on first run
- **Terminal environment forwarded** -- `TERM`, `COLORTERM`, and `LANG` are passed through so Zellij and Fish render correctly
- **Ephemeral container** -- `--rm` ensures the container is removed after the session ends; all persistent state lives in the project directory

### Usage

```bash
# Auto-detect the best isolation backend
./run.sh

# Force a specific backend
./run.sh bubblewrap
./run.sh podman
./run.sh docker
# Explicitly skip isolation (you've been warned)
./run.sh none
```

### What the Bubblewrap Sandbox Does

The bubblewrap backend creates a sandboxed environment with:

- **PID, IPC, and UTS namespace isolation** -- processes inside the sandbox can't see or signal host processes
- **Read-only system mounts** -- `/usr`, `/lib`, `/bin`, `/sbin`, `/etc`, `/opt` are mounted read-only (with symlink handling for merged-usr distros like Arch and Fedora)
- **Ephemeral writable layers** -- `$HOME`, `/tmp`, `/var/tmp`, and `$XDG_RUNTIME_DIR` are tmpfs mounts that vanish when the sandbox exits
- **Project directory read-write** -- only the project directory is writable and persistent
- **Network access preserved** -- needed for downloading tools and API calls
- **PTY support** -- `--dev /dev` creates a minimal devtmpfs so Zellij can allocate pseudo-terminals for its panes
- **DNS and SSL/TLS** -- `/etc/resolv.conf`, `/etc/hosts`, and certificate directories are bind-mounted read-only
- **Toolchain persistence** -- `RUSTUP_HOME`, `CARGO_HOME`, and `GOPATH` are pointed into the project's `data/` directory so mise doesn't reinstall them on every run

### Installing Bubblewrap

```bash
# Debian/Ubuntu
sudo apt install bubblewrap

# Arch
sudo pacman -S bubblewrap

# Fedora
sudo dnf install bubblewrap
```

### The Bootstrap Sequence

1. You run `./openglue-linux-x64` for the first time
2. The binary writes all embedded config files to disk, including `run.sh`
3. The binary detects `OPENGLUE_ISOLATION` is not set, prints a message pointing you to `run.sh`, and exits
4. You run `./run.sh`
5. `run.sh` detects the best isolation backend, sets `OPENGLUE_ISOLATION`, and execs the binary inside the sandbox
6. The binary sees `OPENGLUE_ISOLATION` is set and proceeds with the full setup (mise, tools, Zellij, etc.)

On subsequent runs, `run.sh` already exists, so you just run `./run.sh` directly.

## How It Works (The Nerdy Bits)

The secret sauce is **XDG Base Directory overrides**. Instead of tools spraying config files all over your `$HOME` like a cat marking territory, openglue redirects everything into local subdirectories:

- `XDG_CONFIG_HOME` -> `./config`
- `XDG_DATA_HOME` -> `./data`
- `XDG_STATE_HOME` -> `./state`
- `XDG_CACHE_HOME` -> `./cache`

mise itself gets the same treatment with `MISE_DATA_DIR`, `MISE_CACHE_DIR`, etc.

The result: **zero side effects on your system**. `rm -rf openglue/` and it's gone. No orphaned configs. No mystery binaries in `~/.local/bin`. Nothing.

## The Philosophy

- **One command to rule them all.** Run `./run.sh` and get a working dev environment.
- **Everything local.** No global installs (except Bun itself). No system pollution.
- **Idempotent.** Run it again and it skips what's already installed. Re-entrant like a good function should be.
- **Opinionated but open.** Tokyo Night theme, Fish shell, Zellij -- because defaults should be good defaults. But it's all just config files you can change.

## Tech Stack

- **Runtime:** [Bun](https://bun.com) (TypeScript)
- **Zero runtime npm dependencies.** Just Bun built-in APIs (`Bun.file`, `Bun.write`, `Bun.spawn`, `fetch`). The `node_modules` folder exists solely because TypeScript types need to live somewhere.

## Status

Early development. 10 commits in. The foundation is solid, the vibes are immaculate, and the test suite is... aspirational.

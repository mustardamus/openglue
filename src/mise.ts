import { exists } from "node:fs/promises";
import { dirname, join } from "node:path";
import { downloadLatestReleaseAsset } from "./github.ts";

function getMiseAssetSuffix(): string {
	const platform = process.platform;
	const arch = process.arch;

	let os: string;
	switch (platform) {
		case "linux":
			os = "linux";
			break;
		case "darwin":
			os = "macos";
			break;
		default:
			throw new Error(`Unsupported platform: ${platform}`);
	}

	let cpu: string;
	switch (arch) {
		case "x64":
			cpu = "x64";
			break;
		case "arm64":
			cpu = "arm64";
			break;
		case "arm":
			cpu = "armv7";
			break;
		default:
			throw new Error(`Unsupported architecture: ${arch}`);
	}

	return `${os}-${cpu}`;
}

export async function getLatestMise(dest: string): Promise<string> {
	const suffix = getMiseAssetSuffix();

	const { dest: result } = await downloadLatestReleaseAsset({
		repo: "jdx/mise",
		dest,
		executable: true,
		assetFilter: (asset, release) =>
			asset.name === `mise-${release.tag_name}-${suffix}`,
	});

	return result;
}

export async function ensureMise(misePath: string): Promise<void> {
	if (!(await exists(misePath))) {
		await getLatestMise(misePath);
	}
}

export async function runMise(
	misePath: string,
	args: string[],
	env: Record<string, string>,
	cwd?: string,
): Promise<void> {
	if (!(await exists(misePath))) {
		throw new Error("mise binary not found. Run ensureMise() first.");
	}

	const miseDir = dirname(misePath);
	const extraPath = env["PATH"] ?? "";
	const systemPath = process.env["PATH"] ?? "";
	const proc = Bun.spawn([misePath, ...args], {
		cwd: cwd ?? miseDir,
		env: {
			...process.env,
			...env,
			PATH: [miseDir, extraPath, systemPath].filter(Boolean).join(":"),
		},
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
	});

	const exitCode = await proc.exited;

	if (exitCode !== 0) {
		throw new Error(`mise ${args.join(" ")} failed (exit ${exitCode})`);
	}
}

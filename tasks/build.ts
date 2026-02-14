import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const targets = [
	{ target: "bun-linux-x64", suffix: "linux-x64", container: true },
	{ target: "bun-linux-arm64", suffix: "linux-arm64", container: true },
	{ target: "bun-darwin-x64", suffix: "darwin-x64", container: false },
	{ target: "bun-darwin-arm64", suffix: "darwin-arm64", container: false },
] as const;

const rootDir = join(import.meta.dir, "..");
const outDir = join(rootDir, "dist");
await mkdir(outDir, { recursive: true });

console.log(`Building openglue for ${targets.length} targets...\n`);

for (const { target, suffix, container } of targets) {
	const outFile = `openglue-${suffix}`;
	const outPath = join(outDir, outFile);
	console.log(`  ${target} -> ${outPath}`);

	let result: ReturnType<typeof Bun.spawnSync>;

	if (container) {
		const env = { ...process.env };
		delete env.XDG_DATA_HOME;
		delete env.XDG_CACHE_HOME;
		delete env.XDG_CONFIG_HOME;
		delete env.XDG_STATE_HOME;

		result = Bun.spawnSync(
			[
				"podman",
				"run",
				"--rm",
				"--volume",
				`${rootDir}:/app:Z`,
				"--workdir",
				"/app",
				"docker.io/oven/bun:latest",
				"bun",
				"build",
				"--compile",
				"--target",
				target,
				"index.ts",
				"--outfile",
				`/app/dist/${outFile}`,
			],
			{ env },
		);
	} else {
		result = Bun.spawnSync([
			"bun",
			"build",
			"--compile",
			"--target",
			target,
			"index.ts",
			"--outfile",
			outPath,
		]);
	}

	if (result.exitCode !== 0) {
		console.error(`  FAILED (exit ${result.exitCode})`);
		console.error(result.stderr?.toString());
		process.exit(1);
	}
}

console.log("\nDone. Binaries are in ./dist/");

import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const targets = [
	{ target: "bun-linux-x64", suffix: "linux-x64" },
	{ target: "bun-linux-arm64", suffix: "linux-arm64" },
	{ target: "bun-darwin-x64", suffix: "darwin-x64" },
	{ target: "bun-darwin-arm64", suffix: "darwin-arm64" },
] as const;

const outDir = join(import.meta.dir, "..", "dist");
await mkdir(outDir, { recursive: true });

console.log(`Building openglue for ${targets.length} targets...\n`);

for (const { target, suffix } of targets) {
	const outPath = join(outDir, `openglue-${suffix}`);
	console.log(`  ${target} -> ${outPath}`);

	const result = Bun.spawnSync([
		"bun",
		"build",
		"--compile",
		"--target",
		target,
		"index.ts",
		"--outfile",
		outPath,
	]);

	if (result.exitCode !== 0) {
		console.error(`  FAILED (exit ${result.exitCode})`);
		console.error(result.stderr.toString());
		process.exit(1);
	}
}

console.log("\nDone. Binaries are in ./dist/");

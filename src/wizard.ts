import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { runMise } from "./mise.ts";

export async function runWizard() {
	const ROOT_DIR = process.cwd();
	const wizardDir = join(ROOT_DIR, "wizard");
	const misePath = join(ROOT_DIR, "bin", "mise");

	const defaults: Record<string, string> = {
		MISE_DATA_DIR: "./mise",
		MISE_CACHE_DIR: "./mise/cache",
		MISE_CONFIG_DIR: ".",
		MISE_STATE_DIR: "./mise/state",
		XDG_CONFIG_HOME: "./config",
		XDG_CONFIG_DIRS: "./config",
		XDG_DATA_HOME: "./data",
		XDG_DATA_DIRS: "./data",
		XDG_STATE_HOME: "./state",
		XDG_CACHE_HOME: "./cache",
	};

	const env: Record<string, string> = {};
	for (const [key, value] of Object.entries(defaults)) {
		env[key] =
			value.startsWith("./") || value.startsWith("/")
				? resolve(ROOT_DIR, value)
				: value;
	}

	const files = await readdir(wizardDir);
	const wizardFiles = files.filter((f) => f.endsWith(".ts")).sort();

	console.error(
		`:: wizard: found ${wizardFiles.length} step(s) in ${wizardDir}`,
	);

	for (const file of wizardFiles) {
		const modulePath = join(wizardDir, file);
		console.error(`:: wizard: running ${file} ${modulePath}`);
		await runMise(
			misePath,
			["exec", "--", "bun", "run", modulePath],
			env,
			ROOT_DIR,
		);
	}
}

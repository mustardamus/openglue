import { readdir } from "node:fs/promises";
import { join } from "node:path";

const ROOT_DIR = process.cwd();
const wizardDir = join(ROOT_DIR, "wizard");

const files = await readdir(wizardDir);

const wizardFiles = files.filter((f) => f.endsWith(".ts")).sort();

for (const file of wizardFiles) {
	const modulePath = join(wizardDir, file);
	const mod = await import(modulePath);

	if (typeof mod.default === "function") {
		await mod.default();
	}
}

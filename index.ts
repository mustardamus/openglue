import { exists } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { ensureMise, runMise } from "./src/mise.ts";
import {
	getChromiumExecutable,
	getPlaywrightBinDirs,
} from "./src/playwright.ts";
import { bootstrapConfigs } from "./src/bootstrap.ts";

const ROOT_DIR = process.cwd();

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
	BROWSER: "zen-browser",
	ZELLIJ_CONFIG: "./config/zellij/config.kdl",
	ZELLIJ_LAYOUT: "./config/zellij/layouts/default.kdl",
	ZELLIJ_MCP_SERVER_DUMP_DIR: "./cache/zellij-mcp-server",
};

function resolveValue(value: string): string {
	return value.startsWith("./") || value.startsWith("/")
		? resolve(ROOT_DIR, value)
		: value;
}

async function loadEnv(): Promise<Record<string, string>> {
	const env: Record<string, string> = {};

	const envFile = join(ROOT_DIR, ".env");
	if (await exists(envFile)) {
		const content = await Bun.file(envFile).text();

		for (const line of content.split("\n")) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith("#")) continue;

			const idx = trimmed.indexOf("=");
			if (idx === -1) continue;

			const key = trimmed.slice(0, idx);
			const value = trimmed.slice(idx + 1);
			env[key] = resolveValue(value);
		}
	}

	for (const [key, value] of Object.entries(defaults)) {
		if (!(key in env)) {
			env[key] = resolveValue(value);
		}
	}

	return env;
}

async function main() {
	await bootstrapConfigs(ROOT_DIR);

	const isCompiledBinary = import.meta.path.startsWith("/$bunfs/");

	if (isCompiledBinary && !process.env.OPENGLUE_ISOLATION) {
		console.error(`:: bootstrapped config files to ${ROOT_DIR}`);
		console.error(
			":: not launched via run.sh — refusing to run without isolation",
		);
		console.error("");
		console.error("   start with:");
		console.error("     ./run.sh              # auto-detect isolation");
		console.error("     ./run.sh none         # explicitly skip isolation");
		process.exit(1);
	}

	const env = await loadEnv();
	const misePath = join(ROOT_DIR, "bin", "mise");
	const zellijConfig = join(env.XDG_CONFIG_HOME ?? "", "zellij", "config.kdl");
	const zellijLayout = join(
		env.XDG_CONFIG_HOME ?? "",
		"zellij",
		"layouts",
		"default.kdl",
	);

	await ensureMise(misePath);
	await runMise(misePath, ["trust"], env, ROOT_DIR);
	await runMise(misePath, ["install", "node"], env, ROOT_DIR);
	await runMise(misePath, ["install"], env, ROOT_DIR);

	const browsersDir = join(env.XDG_CACHE_HOME ?? "", "ms-playwright");
	if (!(await exists(browsersDir))) {
		await runMise(
			misePath,
			["exec", "--", "playwright", "install", "chromium"],
			env,
			ROOT_DIR,
		);
	}

	const zellijMcpDir = join(env.XDG_CACHE_HOME ?? "", "zellij-mcp-server");
	if (!(await exists(zellijMcpDir))) {
		const cloneProc = Bun.spawn(
			[
				"git",
				"clone",
				"https://github.com/mustardamus/zellij-mcp-server.git",
				zellijMcpDir,
			],
			{ stdout: "inherit", stderr: "inherit", env: { ...process.env, ...env } },
		);
		await cloneProc.exited;

		const installProc = Bun.spawn(["bun", "install"], {
			stdout: "inherit",
			stderr: "inherit",
			cwd: zellijMcpDir,
			env: { ...process.env, ...env },
		});
		await installProc.exited;
	}

	const playwrightBinDirs = await getPlaywrightBinDirs(browsersDir);
	if (playwrightBinDirs.length > 0) {
		env.PATH = `${playwrightBinDirs.join(":")}:${env.PATH ?? ""}`;
	}

	const chromiumPath = await getChromiumExecutable(browsersDir);
	if (chromiumPath) {
		env.CHROMIUM_BIN = chromiumPath;
	}

	await runMise(
		misePath,
		[
			"exec",
			"--",
			"zellij",
			"--config",
			zellijConfig,
			"--layout",
			zellijLayout,
			"attach",
			basename(ROOT_DIR),
			"--create",
		],
		env,
		ROOT_DIR,
	);
}

main();

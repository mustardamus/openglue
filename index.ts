import { exists } from "node:fs/promises";
import { join, resolve } from "node:path";
import { ensureMise, runMise } from "./src/mise.ts";
import { getChromiumExecutable, getPlaywrightBinDirs } from "./src/playwright.ts";

const ROOT_DIR = import.meta.dir;

async function loadEnv(): Promise<Record<string, string>> {
  const content = await Bun.file(join(ROOT_DIR, ".env")).text();
  const env: Record<string, string> = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx);
    const value = trimmed.slice(idx + 1);
    env[key] = value.startsWith("./") || value.startsWith("/")
      ? resolve(ROOT_DIR, value)
      : value;
  }

  return env;
}

async function main() {
  const env = await loadEnv();
  const misePath = join(ROOT_DIR, "bin", "mise");
  const zellijConfig = join(env["XDG_CONFIG_HOME"]!, "zellij", "config.kdl");
  const zellijLayout = join(env["XDG_CONFIG_HOME"]!, "zellij", "layouts", "default.kdl");

  await ensureMise(misePath);
  await runMise(misePath, ["trust"], env, ROOT_DIR);
  await runMise(misePath, ["install"], env, ROOT_DIR);

  const browsersDir = join(env["XDG_CACHE_HOME"]!, "ms-playwright");
  if (!(await exists(browsersDir))) {
    await runMise(
      misePath,
      ["exec", "--", "playwright", "install", "chromium"],
      env,
      ROOT_DIR,
    );
  }

  const zellijMcpDir = join(env["XDG_CACHE_HOME"]!, "zellij-mcp-server");
  if (!(await exists(zellijMcpDir))) {
    const cloneProc = Bun.spawn(
      ["git", "clone", "https://github.com/mustardamus/zellij-mcp-server.git", zellijMcpDir],
      { stdout: "inherit", stderr: "inherit", env: { ...process.env, ...env } },
    );
    await cloneProc.exited;

    const installProc = Bun.spawn(
      ["bun", "install"],
      { stdout: "inherit", stderr: "inherit", cwd: zellijMcpDir, env: { ...process.env, ...env } },
    );
    await installProc.exited;
  }

  const playwrightBinDirs = await getPlaywrightBinDirs(browsersDir);
  if (playwrightBinDirs.length > 0) {
    env["PATH"] = playwrightBinDirs.join(":") + ":" + (env["PATH"] ?? "");
  }

  const chromiumPath = await getChromiumExecutable(browsersDir);
  if (chromiumPath) {
    env["CHROMIUM_BIN"] = chromiumPath;
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
      env["SESSION_NAME"]!,
      "--create",
    ],
    env,
    ROOT_DIR,
  );
}

main();

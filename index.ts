import { join, resolve } from "node:path";
import { ensureMise, runMise } from "./src/mise.ts";

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
  const misePath = join(env["MISE_DATA_DIR"]!, "mise");
  const zellijConfig = join(env["XDG_CONFIG_HOME"]!, "zellij", "config.kdl");
  const zellijLayout = join(env["XDG_CONFIG_HOME"]!, "zellij", "layouts", "default.kdl");

  await ensureMise(misePath);
  await runMise(misePath, ["trust"], env);
  await runMise(misePath, ["install"], env);
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
  );
}

main();

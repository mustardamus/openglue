import { join, basename } from "node:path";
import { ensureMise, runMise } from "./src/mise.ts";

const ROOT_DIR = import.meta.dir;
const SESSION_NAME = basename(ROOT_DIR);
const ZELLIJ_CONFIG = join(ROOT_DIR, "config", "zellij", "config.kdl");
const ZELLIJ_LAYOUT = join(ROOT_DIR, "config", "zellij", "layouts", "default.kdl");

async function main() {
  await ensureMise();
  await runMise(["install"]);
  await runMise([
    "exec",
    "--",
    "zellij",
    "--config",
    ZELLIJ_CONFIG,
    "--layout",
    ZELLIJ_LAYOUT,
    "attach",
    SESSION_NAME,
    "--create",
  ]);
}

main();

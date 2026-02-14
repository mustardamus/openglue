import { chmod, exists, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { downloadLatestReleaseAsset } from "./github.ts";

const ROOT_DIR = join(import.meta.dir, "..");
const BIN_DIR = join(ROOT_DIR, "bin");
const MISE_DIR = join(ROOT_DIR, "mise");
const MISE_PATH = join(MISE_DIR, "mise");
const MISE_WRAPPER = join(BIN_DIR, "mise");

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

export async function getLatestMise(): Promise<string> {
  const suffix = getMiseAssetSuffix();

  const { dest } = await downloadLatestReleaseAsset({
    repo: "jdx/mise",
    dest: MISE_PATH,
    executable: true,
    assetFilter: (asset, release) =>
      asset.name === `mise-${release.tag_name}-${suffix}`,
  });

  return dest;
}

export async function runMise(args: string[]): Promise<void> {
  if (!(await exists(MISE_WRAPPER))) {
    throw new Error("mise wrapper not found. Run ensureMise() first.");
  }

  const proc = Bun.spawn([MISE_WRAPPER, ...args], {
    cwd: ROOT_DIR,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`mise ${args.join(" ")} failed (exit ${exitCode})`);
  }
}

export async function createMiseWrapper(): Promise<void> {
  if (await exists(MISE_WRAPPER)) {
    return;
  }

  await mkdir(BIN_DIR, { recursive: true });

  const script = `#!/usr/bin/env bash
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")/.." && pwd)"

export MISE_DATA_DIR="\${SCRIPT_DIR}/mise"
export MISE_CACHE_DIR="\${SCRIPT_DIR}/mise/cache"
export MISE_CONFIG_DIR="\${SCRIPT_DIR}"
export MISE_STATE_DIR="\${SCRIPT_DIR}/mise/state"

exec "\${SCRIPT_DIR}/mise/mise" "$@"
`;

  await Bun.write(MISE_WRAPPER, script);
  await chmod(MISE_WRAPPER, 0o755);

  console.log(`mise wrapper created at ${MISE_WRAPPER}`);
}


export async function ensureMise(): Promise<void> {
  if (!(await exists(MISE_PATH))) {
    await getLatestMise();
  }

  await createMiseWrapper();
}

import { exists, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

export async function getPlaywrightBinDirs(
  browsersDir: string,
): Promise<string[]> {
  const entries = await readdir(browsersDir);
  const binDirs: string[] = [];

  for (const entry of entries) {
    const entryPath = join(browsersDir, entry);
    if (!(await stat(entryPath)).isDirectory()) continue;

    const subEntries = await readdir(entryPath);
    for (const sub of subEntries) {
      const subPath = join(entryPath, sub);
      if ((await stat(subPath)).isDirectory()) {
        binDirs.push(subPath);
      }
    }
  }

  return binDirs;
}

export async function getChromiumExecutable(
  browsersDir: string,
): Promise<string | null> {
  const entries = await readdir(browsersDir);
  const chromiumDir = entries.find((e) => e.startsWith("chromium-"));

  if (!chromiumDir) return null;

  const chromePath = join(browsersDir, chromiumDir, "chrome-linux64", "chrome");

  if (!(await exists(chromePath))) return null;

  return chromePath;
}

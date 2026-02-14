import { mkdir, exists, chmod } from "node:fs/promises";
import { dirname } from "node:path";

export interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
}

export interface GitHubRelease {
  tag_name: string;
  assets: GitHubReleaseAsset[];
}

export async function getLatestRelease(repo: string): Promise<GitHubRelease> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/releases/latest`,
    { headers: { Accept: "application/vnd.github+json" } }
  );

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as GitHubRelease;
}

export interface DownloadReleaseAssetOptions {
  repo: string;
  assetFilter: (asset: GitHubReleaseAsset, release: GitHubRelease) => boolean;
  dest: string;
  executable?: boolean;
}

export async function downloadLatestReleaseAsset(
  options: DownloadReleaseAssetOptions
): Promise<{ dest: string; release: GitHubRelease }> {
  const { repo, assetFilter, dest, executable = false } = options;

  if (await exists(dest)) {
    return { dest, release: { tag_name: "", assets: [] } };
  }

  const release = await getLatestRelease(repo);
  const asset = release.assets.find((a) => assetFilter(a, release));

  if (!asset) {
    throw new Error(
      `No matching asset found in ${repo} release ${release.tag_name}`
    );
  }

  await mkdir(dirname(dest), { recursive: true });

  console.log(`Downloading ${asset.name}...`);

  const download = await fetch(asset.browser_download_url, {
    redirect: "follow",
  });

  if (!download.ok) {
    throw new Error(
      `Download failed: ${download.status} ${download.statusText}`
    );
  }

  const buffer = await download.arrayBuffer();
  await Bun.write(dest, buffer);

  if (executable) {
    await chmod(dest, 0o755);
  }

  console.log(`${asset.name} (${release.tag_name}) downloaded to ${dest}`);
  return { dest, release };
}

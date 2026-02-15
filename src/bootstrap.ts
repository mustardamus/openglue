import { chmod, exists, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import miseToml from "../mise.toml" with { type: "text" };
import opencodeJson from "../opencode.json" with { type: "text" };
import zellijConfig from "../config/zellij/config.kdl" with { type: "text" };
import zellijLayout from "../config/zellij/layouts/default.kdl" with {
	type: "text",
};
import fishConfig from "../config/fish/config.fish" with { type: "text" };
import starshipConfig from "../config/starship.toml" with { type: "text" };
import markdownlintJson from "../.markdownlint.json" with { type: "text" };
import packageJson from "../package.json" with { type: "text" };
import gitignore from "../.gitignore" with { type: "text" };
import runSh from "../run.sh" with { type: "text" };
import containerfile from "../Containerfile" with { type: "text" };
import wizard001 from "../wizard/001-opencode-auth.ts" with { type: "text" };
import wizard999 from "../wizard/999-start-opencode.ts" with { type: "text" };

interface EmbeddedFile {
	path: string;
	content: string;
	executable?: boolean;
}

function getEmbeddedFiles(rootDir: string): EmbeddedFile[] {
	return [
		{ path: join(rootDir, ".gitignore"), content: gitignore },
		{ path: join(rootDir, "mise.toml"), content: miseToml },
		{ path: join(rootDir, "opencode.json"), content: opencodeJson },
		{ path: join(rootDir, ".markdownlint.json"), content: markdownlintJson },
		{
			path: join(rootDir, "config", "zellij", "config.kdl"),
			content: zellijConfig,
		},
		{
			path: join(rootDir, "config", "zellij", "layouts", "default.kdl"),
			content: zellijLayout,
		},
		{
			path: join(rootDir, "config", "fish", "config.fish"),
			content: fishConfig,
		},
		{ path: join(rootDir, "config", "fish", "fish_variables"), content: "" },
		{ path: join(rootDir, "config", "lazygit", "config.yml"), content: "" },
		{ path: join(rootDir, "config", "starship.toml"), content: starshipConfig },
		{ path: join(rootDir, "package.json"), content: packageJson },
		{ path: join(rootDir, "run.sh"), content: runSh, executable: true },
		{ path: join(rootDir, "Containerfile"), content: containerfile },
		{
			path: join(rootDir, "wizard", "001-opencode-auth.ts"),
			content: wizard001,
		},
		{
			path: join(rootDir, "wizard", "999-start-opencode.ts"),
			content: wizard999,
		},
	];
}

export async function bootstrapConfigs(rootDir: string): Promise<void> {
	const files = getEmbeddedFiles(rootDir);

	for (const file of files) {
		if (!(await exists(file.path))) {
			await mkdir(dirname(file.path), { recursive: true });
			await writeFile(file.path, file.content);
			if (file.executable) await chmod(file.path, 0o755);
		}
	}
}

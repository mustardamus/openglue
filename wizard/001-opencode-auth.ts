import { exists } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
	createCliRenderer,
	Box,
	Text,
	Select,
	SelectRenderableEvents,
} from "@opentui/core";

const ROOT_DIR = process.cwd();
const dataHome = process.env.XDG_DATA_HOME
	? resolve(ROOT_DIR, process.env.XDG_DATA_HOME)
	: resolve(ROOT_DIR, "data");

async function isOpencodeAuthed(): Promise<boolean> {
	const authFile = join(dataHome, "opencode", "auth.json");

	if (!(await exists(authFile))) {
		return false;
	}

	try {
		const content = await Bun.file(authFile).json();
		return Object.keys(content).length > 0;
	} catch {
		return false;
	}
}

async function openAuthPane(): Promise<void> {
	const proc = Bun.spawn(
		[
			"zellij",
			"run",
			"--floating",
			"--close-on-exit",
			"--name",
			"opencode-auth",
			"--",
			"opencode",
			"auth",
			"login",
		],
		{ stdin: "inherit", stdout: "inherit", stderr: "inherit" },
	);
	await proc.exited;
}

export default async function (): Promise<void> {
	const renderer = await createCliRenderer({
		exitOnCtrlC: true,
	});

	const authed = await isOpencodeAuthed();

	if (authed) {
		renderer.destroy();
		return;
	}

	return new Promise<void>((resolvePromise) => {
		const select = Select({
			options: [
				{ name: "Yes", description: "Open opencode auth login in a new pane" },
				{ name: "No", description: "Skip authentication for now" },
			],
			selectedIndex: 0,
			wrapSelection: true,
			showDescription: true,
			selectedBackgroundColor: "#1a1b26",
			selectedTextColor: "#bb9af7",
			selectedDescriptionColor: "#7aa2f7",
			focusedBackgroundColor: "#1a1b26",
			width: "100%",
			height: 6,
		});

		select.on(
			SelectRenderableEvents.ITEM_SELECTED,
			async (_index: number, option: { name: string }) => {
				renderer.destroy();

				if (option.name === "Yes") {
					await openAuthPane();
				}

				resolvePromise();
			},
		);

		select.focus();

		renderer.root.add(
			Box(
				{
					borderStyle: "rounded",
					padding: 1,
					flexDirection: "column",
					gap: 1,
					width: "100%",
				},
				Text({ content: "OpenGlue Wizard", fg: "#bb9af7" }),
				Text({
					content: "opencode is not authenticated with any provider.",
					fg: "#f7768e",
				}),
				Text({ content: "Would you like to log in now?", fg: "#c0caf5" }),
				select,
			),
		);
	});
}

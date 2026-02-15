export default async function (): Promise<void> {
	const proc = Bun.spawn(["opencode"], {
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
	});
	await proc.exited;
}

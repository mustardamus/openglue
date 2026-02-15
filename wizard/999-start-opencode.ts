async function main(): Promise<void> {
	const proc = Bun.spawn(["opencode"], {
		stdin: "inherit",
		stdout: "inherit",
		stderr: "inherit",
	});
	await proc.exited;
}

if (import.meta.main) {
	await main();
}

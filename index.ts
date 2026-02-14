import { ensureMise, runMise } from "./src/mise.ts";

async function main() {
  await ensureMise();
  await runMise(["install"]);
}

main();

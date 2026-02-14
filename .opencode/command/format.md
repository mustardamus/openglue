---
description: Format changed files using mise-managed formatters
---

Format all changed or unstaged files using the appropriate formatter for each file
type. Follow these steps precisely:

## Step 1: Get changed files

Run `git diff --name-only` and `git diff --name-only --cached` and
`git ls-files --others --exclude-standard` to collect all modified, staged, and
untracked files. Deduplicate the list. Skip files that no longer exist on disk.

## Step 2: Map file extensions to formatters

Use this mapping to determine which formatter and mise package to use:

| Extensions                           | Formatter | Mise package         | Format command                |
| ------------------------------------ | --------- | -------------------- | ----------------------------- |
| `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs` | Biome     | `npm:@biomejs/biome` | `biome format --write <file>` |
| `.json`, `.jsonc`                    | Biome     | `npm:@biomejs/biome` | `biome format --write <file>` |
| `.css`, `.scss`                      | Biome     | `npm:@biomejs/biome` | `biome format --write <file>` |
| `.py`                                | Ruff      | `pipx:ruff`          | `ruff format <file>`          |
| `.rs`                                | rustfmt   | (bundled with rust)  | `rustfmt <file>`              |
| `.go`                                | gofmt     | (bundled with go)    | `gofmt -w <file>`             |
| `.md`                                | Prettier  | `npm:prettier`       | `prettier --write <file>`     |
| `.html`                              | Prettier  | `npm:prettier`       | `prettier --write <file>`     |
| `.yaml`, `.yml`                      | Prettier  | `npm:prettier`       | `prettier --write <file>`     |
| `.toml`                              | Taplo     | `npm:@taplo/cli`     | `taplo format <file>`         |

If a file extension is **not** in this table, do NOT skip it. Instead:

1. Research what the standard/most popular formatter is for that file type (use
   your training knowledge — e.g. `shfmt` for `.sh`, `stylua` for `.lua`,
   `xmllint` for `.xml`, `sql-formatter` for `.sql`, etc.)
2. Determine the correct mise package identifier for it (e.g. `aqua:mvdan/sh`
   for shfmt, `npm:sql-formatter` for sql-formatter, etc.)
3. Present your findings to the user: "No known formatter for `.<ext>` in the
   mapping. The standard formatter for this file type is `<name>`
   (`<mise-package>`). Install it?" — wait for confirmation.
4. On confirmation, proceed with installation and formatting as with any other
   formatter. After installing, add the new formatter to both the mapping table
   in this file (`format.md`) and the Formatting table in `README.md`, following
   the existing column format. On decline, skip those files.

## Step 3: Check formatter availability and install if needed

For each required formatter, check if its binary is available by running
`mise which <binary>` (e.g. `mise which biome`, `mise which ruff`). Run all
checks using `mise exec --` prefix so the mise-managed PATH is active.

- If the formatter is listed as "bundled with rust" or "bundled with go", check
  that the parent tool (`rust` or `go`) is in `mise.toml`. If it is, the
  formatter is available.
- If the check fails (command not found / non-zero exit), **ask the user**:
  "Formatter `<name>` is not installed. Install it via
  `mise use <mise-package>`?" — wait for confirmation before proceeding.
- On confirmation, run `mise use <mise-package>` then `mise install` to install
  the formatter and add it to `mise.toml`.
- After installing a new formatter, also add it to the Formatting table in
  `README.md`. Insert a new row into the table in the "## Formatting" section,
  following the same column format as existing rows (Extensions, Formatter, Mise
  package, Format command). Place the new row in a logical position — group it
  near similar formatters or append it at the end of the table.
- If the user declines, skip all files that need that formatter.

## Step 4: Format files

Group files by formatter to minimize repeated invocations. For each formatter,
run the format command using `mise exec -- <format command>` for each file.
Report each file as it is formatted.

## Step 5: Summary

After all files are processed, output a summary:

- Number of files formatted, grouped by formatter
- Files skipped (unknown extension or declined formatter)

If no changed files were found in Step 1, output "No changed files to format."

When everything is done, display \`Dunso.\`

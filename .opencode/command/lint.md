---
description: Lint changed files using mise-managed linters
---

Lint all changed or unstaged files using the appropriate linter for each file
type. Follow these steps precisely:

## Step 1: Get changed files

Run `git diff --name-only` and `git diff --name-only --cached` and
`git ls-files --others --exclude-standard` to collect all modified, staged, and
untracked files. Deduplicate the list. Skip files that no longer exist on disk.

## Step 2: Map file extensions to linters

Use this mapping to determine which linter and mise package to use:

| Extensions                           | Linter        | Mise package                  | Lint command                     |
| ------------------------------------ | ------------- | ----------------------------- | -------------------------------- |
| `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs` | Biome         | `npm:@biomejs/biome`          | `biome lint <file>`              |
| `.json`, `.jsonc`                    | Biome         | `npm:@biomejs/biome`          | `biome lint <file>`              |
| `.css`, `.scss`                      | Biome         | `npm:@biomejs/biome`          | `biome lint <file>`              |
| `.py`                                | Ruff          | `pipx:ruff`                   | `ruff check <file>`              |
| `.rs`                                | Clippy        | (bundled with rust)           | `cargo clippy -- -W clippy::all` |
| `.go`                                | golangci-lint | `aqua:golangci/golangci-lint` | `golangci-lint run <file>`       |
| `.md`                                | markdownlint  | `npm:markdownlint-cli`        | `markdownlint <file>`            |
| `.html`                              | HTMLHint      | `npm:htmlhint`                | `htmlhint <file>`                |
| `.yaml`, `.yml`                      | yamllint      | `pipx:yamllint`               | `yamllint <file>`                |
| `.toml`                              | Taplo         | `npm:@taplo/cli`              | `taplo check <file>`             |
| `.kdl`                               | kdlfmt        | `cargo:kdlfmt`                | `kdlfmt check <file>`            |
| `.sh`                                | shellcheck    | `aqua:koalaman/shellcheck`    | `shellcheck <file>`              |

If a file extension is **not** in this table, do NOT skip it. Instead:

1. Research what the standard/most popular linter is for that file type (use
   your training knowledge — e.g. `shellcheck` for `.sh`, `selene` for `.lua`,
   `xmllint` for `.xml`, `sqlfluff` for `.sql`, etc.)
2. Determine the correct mise package identifier for it (e.g.
   `aqua:koalaman/shellcheck` for shellcheck, `pipx:sqlfluff` for sqlfluff,
   etc.)
3. Present your findings to the user: "No known linter for `.<ext>` in the
   mapping. The standard linter for this file type is `<name>`
   (`<mise-package>`). Install it?" — wait for confirmation.
4. On confirmation, proceed with installation and linting as with any other
   linter. After installing, add the new linter to both the mapping table in
   this file (`lint.md`) and the Linters table in `README.md`, following the
   existing column format. On decline, skip those files.

## Step 3: Check linter availability and install if needed

For each required linter, check if its binary is available by running
`mise which <binary>` (e.g. `mise which biome`, `mise which ruff`). Run all
checks using `mise exec --` prefix so the mise-managed PATH is active.

- If the linter is listed as "bundled with rust" or "bundled with go", check
  that the parent tool (`rust` or `go`) is in `mise.toml`. If it is, the
  linter is available.
- If the check fails (command not found / non-zero exit), **ask the user**:
  "Linter `<name>` is not installed. Install it via
  `mise use <mise-package>`?" — wait for confirmation before proceeding.
- On confirmation, run `mise use <mise-package>` then `mise install` to install
  the linter and add it to `mise.toml`.
- After installing a new linter, also add it to the Linters table in
  `README.md`. Insert a new row into the table in the "## Linters" section,
  following the same column format as existing rows (Linter, Mise package, File
  types). Place the new row in a logical position — group it near similar
  linters or append it at the end of the table.
- If the user declines, skip all files that need that linter.

## Step 4: Lint files

Group files by linter to minimize repeated invocations. For each linter, run
the lint command using `mise exec -- <lint command>` for each file. Report each
file as it is linted, including any warnings or errors found.

Note: For Clippy (`cargo clippy`), linting is project-wide rather than
per-file. Run it once if any `.rs` files are in the changed set.

## Step 5: Fix errors and warnings

If any linter reported warnings or errors, fix them:

1. For each file with lint issues, read the file, understand the errors, and
   apply fixes directly using your editing tools. Use the linter's output to
   determine what needs to change.
2. Some linters support auto-fix flags. Prefer using them when available:
   - Biome: `biome lint --fix <file>`
   - Ruff: `ruff check --fix <file>`
   - Clippy: `cargo clippy --fix --allow-dirty`
   - markdownlint: `markdownlint --fix <file>`
     For linters without an auto-fix flag (yamllint, HTMLHint, Taplo, golangci-lint),
     read the reported errors and fix them manually.
3. After fixing, re-run the linter on the affected files to verify the fixes.
4. **Repeat** this fix-then-lint cycle until the linter passes with zero
   warnings and zero errors for all files. There is no maximum number of
   iterations — keep going until clean.
5. If a specific warning or error cannot be fixed without changing the intended
   meaning or functionality of the code, **ask the user** whether to suppress
   it (e.g. via an inline disable comment) or leave it. Do not silently ignore
   persistent issues.

## Step 6: Summary

After all files pass linting cleanly, output a summary:

- Number of files linted, grouped by linter
- Number of fix iterations required per linter
- Total issues fixed, grouped by linter
- Files skipped (unknown extension or declined linter)

If no changed files were found in Step 1, output "No changed files to lint."

After the linting is successful, output "Dunso." formatted in backticks.

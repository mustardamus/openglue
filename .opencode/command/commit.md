---
description: Commit changed files
---

First, follow the instructions in `.opencode/command/lint.md` to lint all changed files before formatting.
Second, follow the instructions in `.opencode/command/format.md` to format all changed files before committing.

Then, commit the code changes following these rules:

- Use imperative mood ("Add feature" not "Added feature")
- Be extremely concise while remaining informative
- Focus on what changed and why, not how
- Group related changes into single bullet points when logical
- Prioritize the most significant changes first
- Format as multiple bullet points only if needed - if you can sum up changes in
  one line, do it:
  - First line: Concise summary of the overall theme (50 characters or less)
  - Blank line
  - Bullet points: Specific changes, each starting with a dash and space
- Never use emojis or special characters
- Avoid redundant or obvious statements
- Don't include implementation details unless critical
- CRITICAL: Describe the actual content changes, NOT formatting/linting fixes
  - GOOD: "Add user authentication feature"
  - GOOD: "Add new project setup guide"
  - BAD: "Fix markdown heading structure and line length"
  - BAD: "Format xxx.ts" or "Fix linting errors in xxx.ts"
  - Formatting and linting are automatic side-effects, focus on what was actually added/changed/removed

Run `git add . && git commit -m "commit message"` in one command.

After the commit is successful, output "Dunso." formatted in backticks.

# openglue

openglue is a self-contained, portable development environment bootstrapper written in TypeScript. It downloads, installs, and configures a full suite of dev tools -- all scoped locally to the project directory. No global installs. No `sudo`. No "works on my machine". Just run one command and get a fully wired-up terminal session with everything you need.

Think of it as the glue that holds a bunch of fantastic open-source tools together so you don't have to mass-copy dotfiles from a blog post written in 2014.

## What It Actually Does

When you run `bun run index.ts`, the following cascade of events unfolds:

1. Downloads [mise](https://github.com/jdx/mise) (a polyglot runtime manager) if it's not already sitting in `./bin/`
2. Uses mise to install a curated set of tools (see below)
3. Installs a Chromium browser via Playwright (for Chrome DevTools MCP -- yes, your AI can browse the web now, be afraid)
4. Clones and installs the [Zellij MCP Server](https://github.com/mustardamus/zellij-mcp-server) (so your AI can manage terminal panes too -- no one is safe)
5. Wires up all the environment paths so tools can actually find each other
6. Launches a [Zellij](https://zellij.dev/) terminal multiplexer session with [Fish](https://fishshell.com/) shell, Tokyo Night theme, and a preconfigured layout

You end up in a beautiful, fully isolated terminal workspace. Everything lives inside the project directory. Delete the folder and it's like it never happened. Like a responsible one-night stand with your operating system.

## The Tool Belt

| Tool                                                                     | What It Does           | Why It's Here                                                 |
| ------------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------------- |
| [Bun](https://bun.com)                                                   | JS/TS runtime          | Fast. Like, unreasonably fast.                                |
| [Node.js](https://nodejs.org)                                            | JS runtime             | Because npm packages still exist                              |
| [Playwright](https://playwright.dev)                                     | Browser automation     | Installs Chromium for Chrome DevTools MCP                     |
| [Chrome DevTools MCP](https://www.npmjs.com/package/chrome-devtools-mcp) | MCP server             | Lets AI coding assistants inspect browsers                    |
| [Zellij MCP Server](https://github.com/mustardamus/zellij-mcp-server)    | MCP server             | Lets AI coding assistants control Zellij sessions             |
| [Fish](https://fishshell.com)                                            | Shell                  | Autocompletions that actually work                            |
| [opencode](https://opencode.ai)                                          | AI coding assistant    | Your new pair programmer (TUI)                                |
| [Zellij](https://zellij.dev)                                             | Terminal multiplexer   | tmux but you don't need a PhD to configure it                 |
| [Starship](https://starship.rs)                                          | Shell prompt           | Minimal, fast, cross-shell prompt                             |
| [lazygit](https://github.com/jesseduffield/lazygit)                      | Git TUI                | For when `git log --oneline --graph` isn't cutting it         |
| [Python](https://python.org)                                             | Language runtime       | The lingua franca of scripts, ML, and "it works on my laptop" |
| [uv](https://github.com/astral-sh/uv)                                    | Python package manager | pip but mass-produced in Rust                                 |
| [Rust](https://rust-lang.org)                                            | Language toolchain     | For when you want speed and the compiler to yell at you       |
| [Go](https://go.dev)                                                     | Language toolchain     | Concurrency, simplicity, and `if err != nil`                  |

## Getting Started

### Prerequisites

- [Bun](https://bun.com) v1.3.9+ installed on your system (the one global install we couldn't avoid, sorry)
- Linux or macOS (x64 or ARM)
- An internet connection (at least for the first run)

### Installation

```bash
# Clone the repo
git clone <this-repo-url> && cd openglue

# Install the one TypeScript dependency we have
bun install

# Copy the env template
cp .env.example .env

# Launch the whole thing
bun run index.ts
```

That's it. Go make coffee. When you come back, you'll have a fully configured Zellij session staring at you.

### Environment Variables

The `.env` file controls where everything lives. By default, all paths are relative to the project root:

| Variable                     | Default                     | What It Controls                                  |
| ---------------------------- | --------------------------- | ------------------------------------------------- |
| `MISE_DATA_DIR`              | `./mise`                    | Where mise stores its data                        |
| `MISE_CACHE_DIR`             | `./mise/cache`              | Where mise caches downloads                       |
| `XDG_CONFIG_HOME`            | `./config`                  | Tool configurations (Fish, Zellij, lazygit, etc.) |
| `XDG_DATA_HOME`              | `./data`                    | Application data                                  |
| `XDG_STATE_HOME`             | `./state`                   | Application state                                 |
| `XDG_CACHE_HOME`             | `./cache`                   | Caches (including Playwright browsers)            |
| `SESSION_NAME`               | `openglue`                  | Zellij session name                               |
| `BROWSER`                    | `zen-browser`               | Default browser                                   |
| `ZELLIJ_MCP_SERVER_DUMP_DIR` | `./cache/zellij-mcp-server` | Zellij MCP Server dump directory                  |

## Project Structure

```
openglue/
├── index.ts              # The orchestrator. Runs the whole show.
├── src/
│   ├── github.ts         # GitHub API client for downloading releases
│   ├── mise.ts           # mise binary management and command runner
│   └── playwright.ts     # Chromium installation and path discovery
├── config/               # All tool configs live here (XDG_CONFIG_HOME)
│   ├── fish/             # Fish shell config
│   ├── starship.toml     # Starship prompt config
│   ├── zellij/           # Zellij config + layouts (Tokyo Night theme)
│   └── lazygit/          # lazygit config
├── bin/                  # Downloaded binaries (mise lives here)
├── mise/                 # mise internal data (tools installed here)
├── data/                 # XDG_DATA_HOME
├── state/                # XDG_STATE_HOME
├── cache/                # XDG_CACHE_HOME (Playwright browsers live here)
├── .env.example          # Environment template
├── mise.toml             # Tool definitions for mise
├── opencode.json         # opencode AI assistant config
├── package.json          # Project manifest
└── tsconfig.json         # TypeScript config (strict, as God intended)
```

## How It Works (The Nerdy Bits)

The secret sauce is **XDG Base Directory overrides**. Instead of tools spraying config files all over your `$HOME` like a cat marking territory, openglue redirects everything into local subdirectories:

- `XDG_CONFIG_HOME` -> `./config`
- `XDG_DATA_HOME` -> `./data`
- `XDG_STATE_HOME` -> `./state`
- `XDG_CACHE_HOME` -> `./cache`

mise itself gets the same treatment with `MISE_DATA_DIR`, `MISE_CACHE_DIR`, etc.

The result: **zero side effects on your system**. `rm -rf openglue/` and it's gone. No orphaned configs. No mystery binaries in `~/.local/bin`. Nothing.

## The Philosophy

- **One command to rule them all.** Run `bun run index.ts` and get a working dev environment.
- **Everything local.** No global installs (except Bun itself). No system pollution.
- **Idempotent.** Run it again and it skips what's already installed. Re-entrant like a good function should be.
- **Opinionated but open.** Tokyo Night theme, Fish shell, Zellij -- because defaults should be good defaults. But it's all just config files you can change.

## Tech Stack

- **Runtime:** [Bun](https://bun.com) (TypeScript)
- **Zero runtime npm dependencies.** Just Bun built-in APIs (`Bun.file`, `Bun.write`, `Bun.spawn`, `fetch`). The `node_modules` folder exists solely because TypeScript types need to live somewhere.

## Status

Early development. 10 commits in. The foundation is solid, the vibes are immaculate, and the test suite is... aspirational.

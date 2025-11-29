# rcade

The RCade CLI for creating and managing arcade games.

## Installation

```bash
npm install -g rcade
```

Or use directly without installing:

```bash
npm create rcade@latest
```

## What It Does

The `rcade` CLI scaffolds new game projects with everything you need:

- Game templates (JavaScript, TypeScript, or Rust)
- Pre-configured build tooling (Vite or Trunk)
- Auto-generated GitHub Actions workflow for deployment
- `rcade.manifest.json` for game metadata
- Git repository initialization

## Usage

Run the create command and follow the interactive prompts:

```bash
npm create rcade@latest
```

You'll be asked for:

| Prompt | Description |
|--------|-------------|
| **Game identifier** | URL-safe name (e.g., `space-blaster`) |
| **Display name** | Human-readable name (e.g., `Space Blaster`) |
| **Description** | Short description of your game |
| **Visibility** | `public`, `internal`, or `private` |
| **Versioning** | `automatic` (recommended) or `manual` |
| **Template** | JavaScript, TypeScript, or Rust |
| **Package manager** | npm, pnpm, or bun |

## Templates

### Vanilla JavaScript
Basic Vite setup with vanilla JavaScript. Best for quick prototypes.

### Vanilla TypeScript
Vite setup with TypeScript. Best for larger projects that benefit from type safety.

### p5.js
Vite setup with [p5.js](https://p5js.org/) for creative coding. Great for visual games and animations with an easy-to-use drawing API.

### p5.js + TypeScript
p5.js with TypeScript support. Combines creative coding with type safety.

### Vanilla Rust
Trunk setup compiling Rust to WebAssembly. Best for performance-critical games.

## Generated Files

```
my-game/
├── .github/
│   └── workflows/
│       └── deploy.yaml      # Auto-deployment to RCade
├── src/
│   └── main.js              # Your game code
├── index.html               # Entry point
├── package.json             # Dependencies
└── rcade.manifest.json      # Game metadata
```

## Development

### Prerequisites

- [Bun](https://bun.sh) runtime

### Setup

```bash
bun install
```

### Build

```bash
bun run build
```

This outputs the CLI to `dist/index.js`.

### Local Testing

```bash
bun run src/index.ts
```

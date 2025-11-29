# {{display_name}}

{{description}}

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

This launches Vite on port 5173 and connects to the RCade cabinet emulator.

## Building

```bash
npm run build
```

Output goes to `dist/` and is ready for deployment.

## Project Structure

```
├── src/
│   ├── main.ts       # Game entry point
│   └── style.css     # Styles
├── index.html        # HTML entry
├── tsconfig.json     # TypeScript config
└── package.json
```

## Arcade Controls

This template uses `@rcade/plugin-input-classic` for arcade input:

```ts
import { PLAYER_1, SYSTEM } from '@rcade/plugin-input-classic'

// D-pad
if (PLAYER_1.DPAD.up) { /* ... */ }
if (PLAYER_1.DPAD.down) { /* ... */ }
if (PLAYER_1.DPAD.left) { /* ... */ }
if (PLAYER_1.DPAD.right) { /* ... */ }

// Buttons
if (PLAYER_1.A) { /* ... */ }
if (PLAYER_1.B) { /* ... */ }

// System
if (SYSTEM.ONE_PLAYER) { /* Start game */ }
```

## Deployment

Push to GitHub and the included workflow will automatically deploy to RCade.

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
│   ├── sketch.js     # p5.js sketch (game code)
│   └── style.css     # Styles
├── index.html        # HTML entry
└── package.json
```

## p5.js Basics

The template uses p5.js in [instance mode](https://github.com/processing/p5.js/wiki/Global-and-instance-mode):

```js
import p5 from "p5";

const sketch = (p) => {
    p.setup = () => {
        p.createCanvas(336, 262);  // RCade dimensions
    };

    p.draw = () => {
        p.background(26, 26, 46);
        p.fill(255);
        p.ellipse(p.width / 2, p.height / 2, 50, 50);
    };
};

new p5(sketch, document.getElementById("sketch"));
```

## Arcade Controls

This template uses `@rcade/plugin-input-classic` for arcade input:

```js
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

## RCade Screen Size

The RCade cabinet uses a 336x262 pixel display. The template is pre-configured with these dimensions.

## Deployment

Push to GitHub and the included workflow will automatically deploy to RCade.

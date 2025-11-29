# {{display_name}}

{{description}}

## Prerequisites

- [Rust](https://rustup.rs/)
- [Trunk](https://trunkrs.dev/) - `cargo install trunk`
- wasm32 target - `rustup target add wasm32-unknown-unknown`

## Getting Started

Start the development server:

```bash
trunk serve
```

This compiles the Rust code to WebAssembly and serves it with hot reloading.

## Building

```bash
trunk build --release
```

Output goes to `dist/` and is ready for deployment.

## Project Structure

```
├── src/
│   └── lib.rs        # Game entry point
├── index.html        # HTML entry
└── Cargo.toml        # Rust dependencies
```

## WebAssembly Bindings

This template uses `wasm-bindgen` and `web-sys` for DOM interaction:

```rust
use wasm_bindgen::prelude::*;
use web_sys::window;

#[wasm_bindgen(start)]
pub fn main() {
    let document = window().unwrap().document().unwrap();
    let body = document.body().unwrap();
    body.set_inner_html("<h1>Hello!</h1>");
}
```

## Deployment

Push to GitHub and the included workflow will automatically deploy to RCade.

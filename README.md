# Sanctum Chess

### Cathedral Edition

A browser-based 3D chess game set in a moonlit Gothic cathedral. Command sculpted stone pieces, challenge a local AI opponent, and watch captures unfold through animated melee combat and shattering stone.

Built with React, TypeScript, Three.js, and Vite. Gameplay and AI run in the browser; no game server or AI API key is required.

## Features

- **Atmospheric 3D environment.** A cathedral altar, sculpted chess pieces, candlelight, soft shadows, and cinematic tone mapping.
- **Animated captures.** Piece-specific melee sequences with procedural stone debris and impact effects.
- **Single-player chess.** Play as White or Black against a client-side heuristic opponent, or request the next AI move from the toolbar.
- **Move ledger.** Follow algebraic move notation and copy the recorded game as PGN.
- **Captured-piece tracking.** View captures for both armies and their material advantage.
- **Flexible cameras.** Switch between player, overhead, side, and cathedral views, or explore with keyboard flight controls.
- **Procedural audio.** Synthesized movement, impact, check, and checkmate sounds using the Web Audio API, with a shared mute control.
- **Gothic interface.** Army selection, a Relic Codex, collapsible panels, responsive controls, and reduced-motion styling for interface animations.

## Getting started

### Requirements

- **Node.js 22.12 or newer** is recommended. The installed Vite version also supports Node.js 20.19 or newer within the 20.x release line.
- **npm**, included with Node.js.
- A modern browser with **WebGL 2** support and hardware acceleration enabled.

### Run locally

From the project directory:

```sh
npm ci
npm run dev
```

Open [http://localhost:3000/](http://localhost:3000/). If that port is occupied, use the address printed by Vite.

The default development server listens on all network interfaces. To restrict it to your computer:

```sh
npm run dev -- --host 127.0.0.1
```

Choose an army, then select **Enter the Sanctum**. Select a piece and then its destination to make a move. Browser audio becomes available after user interaction.

## Controls

| Action | Mouse and keyboard | Touch |
| --- | --- | --- |
| Select a piece or destination | Left click | Tap |
| Orbit the board | Left drag | One-finger drag |
| Pan the camera | Right drag | Two-finger drag |
| Zoom | Scroll wheel | Pinch |
| Move the free-flight camera | `W`, `A`, `S`, `D` | Camera presets |
| Raise or lower the camera | `R` / `F` | Camera presets |
| Hide or restore the HUD | `H` | Hide UI / Show UI |
| Close interface panels | `Escape` | Close button or backdrop |

Use the arena toolbar to change sides, request an AI move, start a new game, toggle sound, open the move ledger, or choose a camera preset. On smaller screens, these actions are available through **Controls**.

## Development

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server on port 3000 |
| `npm test` | Run gameplay regressions, HUD checks, and model-integrity tests |
| `npm run lint` | Run the TypeScript compiler without emitting files |
| `npm run build` | Generate the production site in `dist/` |
| `npm run preview` | Serve the existing production build locally |

Run the project checks before submitting changes:

```sh
npm test
npm run lint
npm run build
```

The automated suite checks HUD identifiers, all seven compressed glTF model headers, and engine regressions for en passant, promotion, undo, reset, camera selection, and highlight cleanup. Engine tests execute production function bodies with real Three.js math and stubbed rendering. They do not replace browser testing of React integration, visual animations, audio, accessibility, or mobile interaction.

Manual pawn promotion currently defaults to a queen. Scripted moves and the engine API also support promotion to a rook, bishop, or knight.

GitHub Actions runs the tests, type check, and production build for pushes and pull requests targeting `main` or `master`.

## Architecture

| Layer | Implementation |
| --- | --- |
| Interface | React 19 and TypeScript |
| Rendering | Three.js with WebGL, soft shadows, and ACES Filmic tone mapping |
| Chess and AI | Client-side JavaScript engine with material, position, and threat heuristics |
| Audio | Native Web Audio API |
| Assets | Seven base64-encoded, gzip-compressed binary glTF models |
| Build tooling | Vite with separate Three.js, React, and analytics vendor chunks |
| Telemetry | Vercel Web Analytics and Speed Insights |

```text
src/
├── App.tsx                  # Game interface, state, and engine event integration
├── main.tsx                 # React entry point, analytics, and stylesheet imports
├── wizardChessEngine.js     # Scene, chess logic, AI, input, and animation loop
├── analytics.ts             # Analytics initialization and event helpers
├── styles.css               # Base arena styles
├── landing.css              # Title screen, codex, ledger, and graveyard styles
├── ui.css                   # Final visual overrides and responsive refinements
├── audio/
│   └── sanctumAudio.ts      # Procedural sound synthesis
└── components/
    ├── LandingPage.tsx      # Army selection, camera controls, and Relic Codex
    ├── MoveLedger.tsx       # Move history and PGN export
    └── Graveyard.tsx        # Captures and material advantage

public/                      # Models, favicon, social image, and search metadata
test/applet.test.mjs          # HUD and asset-integrity tests
test/engine.test.mjs          # Gameplay and engine lifecycle regressions
.github/workflows/ci.yml      # Continuous integration
vite.config.ts               # Development and build configuration
vercel.json                  # Deployment routing, headers, and caching
```

### Implementation conventions

- Keep `#canvas-container` mounted across landing-page and arena transitions to avoid recreating the WebGL context.
- Preserve engine-bound HUD IDs. The automated HUD test documents the required controls.
- Maintain the stylesheet import order in `src/main.tsx`: `styles.css`, `landing.css`, then `ui.css`.
- Keep the dark-fantasy visual language consistent across interface changes.

## Deployment

The production output is a static site; no application backend is required.

### Vercel

1. Import the repository into Vercel.
2. Select **Vite** as the framework, with `npm run build` as the build command and `dist` as the output directory.
3. Use a supported Node.js version.
4. Review the production domain and telemetry settings before deploying.

The included `vercel.json` configures SPA fallback routing, security headers, and asset caching. `.vercelignore` excludes development-only files from deployment uploads.

### Other static hosts

```sh
npm run build
```

Publish the contents of `dist/`. Configure an `index.html` fallback if your host needs one for client-side URLs. Vercel-specific headers and analytics endpoints are not automatically provided by other hosts.

### Release checklist

- Update canonical, social, structured-data, sitemap, and robots references to match the deployed domain.
- Verify that structured-data claims, including ratings, are supported by real published information.
- Review the long-lived immutable cache policy before replacing model files at existing URLs; version their filenames or revise the policy when necessary.
- Verify asset loading, sound activation, camera controls, and gameplay on the browsers and devices you intend to support.

## Analytics and external resources

The application initializes Vercel Web Analytics and Speed Insights and includes custom events for gameplay and interface actions. Review `src/analytics.ts` and its callers when configuring telemetry for a deployment.

Sound is generated locally. Typography is loaded from Google Fonts, so fonts and telemetry may make network requests independently of the local game engine.

## Development credits

Developed by [nodeanurag](https://github.com/nodeanurag) with engineering assistance from Factory Droid.

Droid-assisted commits include the following co-author trailer so the contribution remains visible in Git history and on GitHub:

```text
Co-authored-by: factory-droid[bot] <138933559+factory-droid[bot]@users.noreply.github.com>
```

## License and asset rights

`package.json` currently declares an MIT license, but this repository does not include a `LICENSE` file. Confirm the intended license and add its full text before distributing the project.

Review the source and redistribution rights of the bundled 3D models and other assets separately; do not assume the package license covers third-party content.

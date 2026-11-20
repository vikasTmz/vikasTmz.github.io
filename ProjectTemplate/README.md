# Project website template

A portable research-project website with native DeckWerk slides. Start with this folder for a new project; leave your existing project untouched.

**Agent instructions:** [AGENTS.md](AGENTS.md). **Detailed authoring guide:** [TEMPLATE_GUIDE.md](TEMPLATE_GUIDE.md).

## Preview immediately

The folder includes an editable three-slide example deck and its public HTML exports. Node.js 20+ is needed; this website has no npm dependencies to install.

```sh
npm run serve
```

Open the printed URL, normally `http://127.0.0.1:8765/`. Do not open `index.html` with `file://`. Stop with Ctrl+C. Use `PORT=8766 npm run serve` if the port is occupied.

## Make it your project

1. Copy this folder to the new project's directory.
2. Replace the placeholder title, authors, affiliations, links, venue and BibTeX in `index.html`. Replace the placeholder assets in `logos/`; the favicon is a generic faceted cube.
3. Open `Presentation/` in DeckWerk and replace the example slides, or point the `deck` field in `slide-sections.json` at another native project folder.
4. Edit `slide-sections.json` to choose sections, summaries, notes and slide durations.
5. Export your slides and preview:

```sh
npm run sync -- --deckwerk /absolute/path/to/deckwerk
npm run serve
```

The external DeckWerk source checkout needs its own installed dependencies. The packaged GUI alone does not provide the export CLI. Alternatively, set `DECKWERK_SOURCE`; the fallback is `~/Downloads/deckwerk`.

For continuous exporting after DeckWerk saves:

```sh
npm run watch -- --deckwerk /absolute/path/to/deckwerk
```

Wait for `Updated slides/`, then refresh the browser. This is a file watcher, not browser hot reload.

## Build

```sh
npm test
npm run build
```

`npm run build` packages the **existing exports** into `dist/`. It does not re-export the deck. To export and build together:

```sh
DECKWERK_SOURCE=/absolute/path/to/deckwerk sh build.sh
```

Preview the finished public files with `SITE_ROOT=dist npm run serve`. Publish the **contents of `dist/`** at your chosen URL. Assets use relative URLs, so a project subdirectory works too. No publication or hosting configuration is included.

The build excludes the native deck, agent instructions, tests and authoring scripts. See the guide before embedding the source folder in an existing Jekyll repository.

An optional browser smoke test uses the Electron binary already installed with DeckWerk. With the preview running, run that binary with `tests/browser-smoke.cjs` as its argument (unset `ELECTRON_RUN_AS_NODE`). Set `TEMPLATE_URL` for a different preview URL. No browser dependency is installed by this template. This test targets the bundled example configuration; adapt its selectors when replacing the examples.

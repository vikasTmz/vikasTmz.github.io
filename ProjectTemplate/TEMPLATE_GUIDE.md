# How this template works

The website is a static HTML/CSS/JavaScript shell around DeckWerk's official HTML renderer. Slide content remains editable in DeckWerk; it is not recreated in website markup. The bundled examples demonstrate an automatic reveal, editable LaTeX, a single-slide section and a two-slide sequence.

## File map

| File or directory | Purpose | Edit directly? |
| --- | --- | --- |
| `index.html` outside generated markers | Title, authors, affiliations, resource links, venue, BibTeX and footer | Yes |
| `slide-sections.json` | Section order, content and slide selections | Yes |
| `Presentation/` | Example native DeckWerk project | In DeckWerk or through supported agent tools |
| `Presentation/drafts/example.html` | Initial HTML authoring example | Use a fresh `inspect --html` before later native edits |
| `css/main.css` | Page appearance, summaries, notes and toolbar | Yes |
| `css/section-navigation.css` | Margin rail and responsive navigation | Yes |
| `js/section-content.js` | Shared section renderer, escaping and validation | Only for behavior changes |
| `js/slides.js` | Browser JSON refresh and component lifecycle | Only for behavior changes |
| `js/section-navigation.js` | Fragment navigation and scroll progress | Only for behavior changes |
| `js/section-player.js` | Per-section player state and controls | Only for behavior changes |
| `js/section-visibility.js` | Chooses which player is allowed to run | Only for behavior changes |
| `web/slides/{clock,embed}.js` | Source adapters for native slide playback | Yes; then re-export |
| `scripts/render-sections.mjs` | Writes JSON sections into marked HTML blocks | Usually no |
| `scripts/sync-slides.mjs` | Official DeckWerk export and public asset selection | Usually no |
| `scripts/build.mjs` | Packages public files only | Usually no |
| `scripts/serve.mjs` | Local HTTP preview with video byte-range support | Usually no |
| `slides/` and `dist/` | Generated exports and public build | No |

The public `slides/export.json` records source name, rail numbers, resolved native IDs, canvas dimensions and export time. Presenter notes are stripped from exported slides. Website explanatory notes come from JSON, not from private DeckWerk speaker notes.

## Section configuration

```json
{
  "deck": "Presentation",
  "sections": [
    {
      "key": "overview",
      "title": "",
      "slide": 1,
      "navLabel": "Overview",
      "summary": "1. Overview: the main idea",
      "notes": "First paragraph.\n\nSecond paragraph."
    },
    {
      "key": "method",
      "title": "",
      "slides": [
        { "slide": 2, "duration": 12 },
        { "slide": 3, "duration": 18 }
      ],
      "navLabel": "Method",
      "summary": "2. Method: how it works",
      "notes": "Explain the method here."
    }
  ]
}
```

- `deck` is a native project folder relative to this template. An absolute path also works. `--source /path/to/project` or `DECKWERK_PROJECT` overrides it. The DeckWerk **tool checkout** is a different path, selected with `--deckwerk` or `DECKWERK_SOURCE`.
- `sections` is the single ordered list for both the article and navigation. Keep `title` present as a string; use `""` when the summary supplies the heading-like introduction.
- Use either `slide` or `slides`, never both. Numbers refer to the current 1-based DeckWerk rail positions, including positions occupied by hidden slides. The selected slides themselves must be visible.
- A single `slide` has no website time limit or new toolbar. A `slides` array can contain one or more entries, each with a positive duration in seconds. Repeated slide numbers are allowed.
- `key` supplies the stable section fragment, such as `#method`. Keep it when reordering sections or renaming their labels. Optional `id` overrides it. IDs must be unique, even if slides are repeated.
- `navLabel` is the short navigation label. Fallbacks are `title`, then `summary`, then `Slide N`. Concise labels keep the desktop rail compact; long labels or many sections intentionally switch to a wrapping row.
- `summary` is normal-weight burgundy text above the slide. `notes` starts expanded and can be collapsed. Empty notes show only the summary. Empty summary and notes omit that explanation.
- Use `\n` for an explicit line break and `\n\n` between paragraphs. Notes are escaped plain text; Markdown/HTML is not interpreted. Source HTML indentation is collapsed rather than displayed.
- `hidden: true` or `disabled: true` omits a whole website section from both the article and navigation.

JSON-only changes appear after a browser refresh. Run `npm run render` as well to update static HTML, including its no-JavaScript fallback. Do not edit the generated `section-navigation` or `slide-sections` blocks in `index.html`; they will be replaced.

## Native slides and export

Create/import the presentation in DeckWerk, or open the included example. Keep videos, math, layouts and automatic reveals native. Change canvas height inside the deck and fix slide layouts there. Export generates `slides/canvas.css`, which makes website frames match that canvas without cropping.

For agent edits, read the native project's `AGENTS.md` first. A typical supported workflow is:

```sh
/path/to/deckwerk/bin/slide-agent inspect Presentation --slide 1,2 --html > /tmp/selected-slides.html
# Edit the scoped HTML, preserving IDs and unmodified sections.
/path/to/deckwerk/bin/slide-agent apply Presentation --html /tmp/selected-slides.html --label "Describe the change"
/path/to/deckwerk/bin/slide-agent validate Presentation --slide 1,2
/path/to/deckwerk/bin/slide-agent render Presentation --slide 1,2 --built --output /tmp/slide-preview
```

A scoped authoring export controls all slide IDs in its scope; deleting a section can delete that slide. Check apply's `changes` output. Do not use stale drafts to overwrite newer GUI edits. Use native transactions for narrow property edits when appropriate. Speaker notes should explain the concepts, not record the editing process.

The sync script resolves requested rail positions through `slide-agent inspect`, invokes the official export, and extracts the selected native slide objects unchanged into separate HTML files. It copies referenced assets, the native player and theme, and the iframe adapters. It stages the result before replacing `slides/`; a failed export preserves the working exports.

Re-export after any native edit, new selected slide, changed canvas or adapter change. A change to summary, notes, navigation labels or duration needs only a render/refresh. Reordering native slides requires checking the JSON numbers again. The example deck is a starting point, not a template for the scientific content of every project.

## Playback and navigation

A sequence's segmented bar selects whole slides and restarts the selected slide. It cannot seek inside a native timeline. Pause/resume freezes the section timer, native delays, CSS/Web Animations and media. Restart begins the section again; finishing the last slide leaves it paused.

Only the most prominent visible player runs. Others resume where they stopped when revisited, unless manually paused or completed. Hidden browser tabs pause playback. Manual pauses persist across scrolling. A small selection tolerance avoids flicker; the centered player wins when several slides fit fully onscreen.

The adapters are activated by `?controlled=1`. Direct slide URLs without that parameter retain standalone native playback. The iframe and parent must stay same-origin. The message channel must match in `js/section-player.js` and `web/slides/embed.js`. Native click-only builds should be converted to automatic triggers for website use. Keep videos muted for browser autoplay compatibility.

At desktop widths of at least 1100px, suitable pointer/height conditions show the left dot rail. Hover or keyboard focus reveals labels. Smaller, touch-oriented or cramped viewports get text links above the article. Links use real fragments; the current section and track fill follow document scrolling. Existing BibTeX is included as a destination.

## Appearance

- Summary font size/color: `.explanation-summary` in `css/main.css`.
- Note font size: add `font-size` to `.explanation-notes`; its spacing and line height are there too. It inherits `.slide-explanation` by default.
- Preserve `white-space: normal` for notes; the renderer converts only JSON newlines to `<br>`.
- Page maximum width and spacing: `.project-page` plus its override in `css/section-navigation.css`.
- Website colors: `css/main.css`; navigation maps colors through `--pnav-*` variables.
- Deck typography and footer styles belong to its native `theme.css`, not the website stylesheet.
- Replace both `favicon.svg` and `favicon.ico` when changing the icon. Favicons can be cached longer than normal page assets.

## Preview, build and publication

Node 20+ suffices for the website; there are no runtime package dependencies. DeckWerk's separate checkout has its own npm installation. The included exports let `npm run serve` and `npm run build` work before you configure that checkout.

`npm run build` regenerates static sections and copies an explicit public file list to `dist/`. It does **not** sync the deck first. `sh build.sh` performs sync followed by build. `SITE_ROOT=dist npm run serve` previews the final files. Assets are relative, so deploying under `/MyProject/` does not require hardcoded path changes.

Publish only `dist/` contents, not the entire authoring folder. In an existing Jekyll repository, either integrate those public files into its normal source tree, or add explicit parent-level exclusions for the native deck, authoring scripts, tests, docs and nested `dist/`. A child `_config.yml` does not control its parent's Jekyll build. Do not assume `.gitignore` prevents a static-site generator from publishing a file. Never include `Presentation/deck.json`, its speaker notes or private drafts in a public artifact.

## Troubleshooting

- **Slide URL is missing:** verify its rail number and visibility, then run sync and wait for completion. Check `slides/export.json`. Use HTTP, not `file://`.
- **Export CLI is missing:** `--deckwerk` must identify the source checkout with `bin/slide-agent` and `scripts/export-deck.mts`, not the native project or GUI application bundle.
- **Selected slide did not change:** confirm `deck`/`--source`, save in DeckWerk, re-export, then refresh. Confirm the watcher printed completion rather than an error.
- **No animation advances:** check that the native timeline is automatic and the section is visible, unpaused and not completed. The website uses slide duration only for changing slides, not timing individual builds.
- **Text appears oddly indented:** keep JSON as the source of notes and the normal whitespace rule; regenerate sections after modifying renderer behavior.
- **Rail becomes text links:** inspect width, height, pointer capabilities, number of entries and label length; this can be the intended responsive fallback.
- **After a DeckWerk upgrade:** verify startup, video playback, delayed reveals, pause/resume and restart together. The iframe clock wraps browser timing APIs and needs to stay compatible with the exported renderer.

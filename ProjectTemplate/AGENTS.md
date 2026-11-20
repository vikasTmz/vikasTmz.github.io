# Research project website + DeckWerk template

Read `README.md` for commands and `TEMPLATE_GUIDE.md` for the architecture and authoring contract. This folder is a portable local starter derived from the BRepFacetGen website. Work in a copy for a new project. Do not modify the original BRepFacetGen project. Do not publish unless the user asks.

## Sources of truth

- `index.html`: project title, metadata, author names/links, affiliations, paper/code links, venue, BibTeX, affiliation logos and footer. Keep its generated section markers intact.
- `slide-sections.json`: the native deck folder (`deck`), website section order, stable keys, navigation labels, headings, summaries, notes, slide selections and durations.
- `Presentation/` (or the configured deck folder): native editable DeckWerk slide content, canvas dimensions, animations, images, videos and speaker notes.
- `css/main.css` and `css/section-navigation.css`: website typography and layout.
- `js/`: reusable section rendering, navigation and playback behavior.
- `web/slides/clock.js` and `web/slides/embed.js`: source for the iframe adapters, copied on export.
- `slides/`: generated public DeckWerk exports. Regenerate these rather than editing them.
- `dist/`: generated public website. Never make source changes here.

## Adapt this template

1. Inspect the requested project's materials. Replace example title, people, institutions, venue and citation with verified project facts. Do not carry over names or scientific claims from the reference project. Leave unavailable paper/code URLs disabled rather than inventing them. Replace placeholder logos and the generic favicon as needed.
2. Open the included example deck in DeckWerk, replace it with a copy of the user's native project, or create/import a new deck in DeckWerk. Set `deck` in `slide-sections.json` to its path relative to this folder. Keep the original user deck intact unless in-place edits were requested.
3. Read the native deck's own `AGENTS.md`. Prefer its supported `slide-agent inspect`, `apply`, `transaction`, `validate`, and `render` interfaces. Do not directly read or edit a source `deck.json` when those instructions prohibit it. Reading the data in an official HTML export is allowed. Do not rebuild slide content in website HTML, rasterize it, crop it in CSS, or scale individual elements to make it fit.
4. Check actual rail positions before choosing slides. Reordering or deleting native slides can change their numbers; stable website section keys do not pin native slide IDs. Selected slides must be non-hidden.
5. Author all slide sections in the existing JSON list. Do not maintain a second navigation list. Run `npm run render` after JSON changes so the static HTML matches the browser rendering.
6. Run `npm run sync -- --deckwerk /path/to/deckwerk` after changing slides, canvas height or imported media. The external checkout needs its npm dependencies installed. This invokes the official exporter; it never rewrites the source deck. Both the renderer and the public assets must come from the same export.
7. Run the relevant tests, preview over HTTP, then run `npm run build`. Deliver the local changes and identify any remaining limitation. Publish only when requested, using the contents of `dist/`.

## Preserve the interaction contract

- Summaries and notes appear above the slides. Notes start expanded and remain collapsible with the native `details` control. Summary text is normal weight.
- Notes are plain text. Escape HTML before turning explicit JSON newlines into `<br>` elements. Keep `.explanation-notes { white-space: normal; }` so formatting `index.html` cannot inject visual indentation or line breaks.
- A `slide` section has one untimed native slide and no toolbar. A `slides` section has a minimal segmented toolbar, per-slide durations, pause/resume and restart. The two forms are mutually exclusive.
- All website frames use the controlled clock, including single slides. Only the most prominent visible player runs. Preserve elapsed time when scrolling; preserve manual pause and completed-section state. Hidden tabs pause all players. On mobile, multiple fully visible slides are ranked by proximity to the viewport center.
- Native timeline delays, animations, videos and website slide timers must pause together. The toolbar selects whole slides; it does not seek inside a native timeline. Single-slide Space toggles playback when the iframe has focus.
- Use automatic native reveals for embedded slides. Website controls do not advance click-only DeckWerk builds.
- Keep the 900px centered content width, desktop margin rail, mobile text navigation, real fragment links, keyboard focus, reduced-motion behavior, and print handling. The player UI and explanatory notes belong to the website; scientific content belongs to the deck.
- Keep affiliation logos after BibTeX. Preserve upstream attribution and bundled third-party notices.

## Verification

Run `npm test` and `npm run build`. Check the configured slides and assets exist in `dist/`, and confirm the native deck and private notes are not copied there. Preview with `npm run serve`, or `SITE_ROOT=dist npm run serve`.

At desktop and mobile widths, check overflow, expanded/collapsed notes, JSON paragraph breaks, navigation, favicon, pause/resume, section switching, replay and automatic advancement. Check scrolling away/back pauses and resumes the same frame and timer, that only one section plays, and that manual pauses remain paused. Test hidden-tab behavior when the browser environment supports actual visibility events; label simulated checks honestly. Test imported video and LaTeX when the project uses them. After a DeckWerk renderer upgrade, rerun these playback checks because the adapter wraps its timing APIs.

# Excalidraw

Drawings in [fulgurite](https://github.com/fulgurite-plugin) notes with [Excalidraw](https://github.com/excalidraw/excalidraw)
itself, like Obsidian's Excalidraw plugin: shapes, arrows, lines, freehand and text, hand-drawn.

- **Insert drawing** (⌘P) puts a drawing on the line and opens it full size. **Done** writes it into the note.
- A drawing shows in place while the cursor is elsewhere; click (or tap) it to edit it. With the cursor on it you see
  what the note stores: a ```` ```excalidraw ```` block with the scene as JSON, one shape per line.
- Text in drawings is part of the note, so search finds it.

Left out to keep the plugin small (2 MB): images in drawings (they would sit in the note as data), Mermaid to
Excalidraw, the UI in other languages than English. Chinese and Japanese handwriting come from Excalidraw's CDN the
first time a drawing needs them.

Bundles Excalidraw and React (MIT) and Excalidraw's fonts (SIL Open Font License, except Comic Shanns: MIT).

## Development

`npm run build` bundles `src/page.tsx` (Excalidraw, React and the fonts in one HTML page, which the app shows in its web
view) into `main.js` (`src/main.ts`, which registers that page for ```` ```excalidraw ```` blocks). See
[api](https://github.com/fulgurite-plugin/fulgurite-api).

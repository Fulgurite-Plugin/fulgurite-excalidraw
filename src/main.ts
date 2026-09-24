// Excalidraw drawings in notes, like Obsidian's Excalidraw plugin: a ```excalidraw block holds the scene as JSON, which
// the app draws in place with Excalidraw itself (src/page.tsx, one HTML page) and opens full size on a click.
import type { Plugin } from "fulgurite"

/** The page, put in by build.mjs. */
declare const PAGE: string

const plugin: Plugin = {
  onLoad(ctx) {
    ctx.editor.registerCodeBlock("excalidraw", PAGE)
    ctx.commands.add({
      id: "insert",
      name: "Insert drawing",
      editorCallback(view) {
        // On a blank line, or the next one. The cursor goes past the block so it shows as a drawing afterwards.
        const lineStart = view.text.lastIndexOf("\n", view.cursor - 1) + 1
        const lineEnd = view.text.indexOf("\n", view.cursor) < 0 ? view.text.length : view.text.indexOf("\n", view.cursor)
        const onBlankLine = !view.text.slice(lineStart, lineEnd).trim()
        const at = onBlankLine ? lineStart : lineEnd
        const text = (onBlankLine ? "" : "\n") + "```excalidraw\n```\n"
        view.replace(at, onBlankLine ? lineEnd : at, text)
        ctx.commands.execute("block.open", String(at + text.length - 1))
      },
    })
  },
}

export default plugin

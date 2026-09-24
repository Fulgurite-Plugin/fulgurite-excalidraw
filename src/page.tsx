// The page the app shows for an ```excalidraw block (main.ts registers it): Excalidraw itself, in the app's web view.
// "view" draws the scene as an SVG at the note's width; "edit" is the whole editor, saving the scene as the block's text.
import { Excalidraw, MainMenu, exportToCanvas, getCommonBounds, restore, serializeAsJSON } from "@excalidraw/excalidraw"
import "@excalidraw/excalidraw/index.css"
import type { ExcalidrawProps } from "@excalidraw/excalidraw/types"
import type { CodeBlockHost } from "fulgurite"
import { createRoot } from "react-dom/client"

type OnChange = NonNullable<ExcalidrawProps["onChange"]>

const host = (window as unknown as { fulgurite: CodeBlockHost }).fulgurite
const root = document.getElementById("root")!
const scene = (() => {
  try {
    return restore(JSON.parse(host.source), null, null)
  } catch {
    return restore(null, null, null) // a new block, or not a scene: start blank
  }
})()

/** One shape per line, so the note's diffs and sync's line merges see which shapes changed. */
function serialize(...[elements, appState, files]: Parameters<OnChange>): string {
  const data = JSON.parse(serializeAsJSON(elements, appState, files, "local"))
  const shapes = (data.elements as unknown[]).map((e) => JSON.stringify(e)).join(",\n")
  return `{"type":"excalidraw","version":2,"elements":[\n${shapes}\n],\n"appState":${JSON.stringify(data.appState)},\n"files":${JSON.stringify(data.files)}}\n`
}

if (host.mode === "edit") {
  document.documentElement.style.height = document.body.style.height = root.style.height = "100%"
  document.body.style.margin = "0"
  let last = serialize(scene.elements, scene.appState as Parameters<OnChange>[1], scene.files)
  let timer: ReturnType<typeof setTimeout> | undefined
  // ponytail: saves 200 ms after the last change; Done within that of a stroke loses the stroke. Flush on close if it bites.
  const onChange: OnChange = (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      const text = serialize(...args)
      if (text !== last) host.save((last = text))
    }, 200)
  }
  const theme = host.dark ? "dark" : "light"
  // At 100%, or smaller when that's too big to see whole (a phone): Excalidraw centers the drawing at this zoom.
  const [minX, minY, maxX, maxY] = getCommonBounds(scene.elements)
  const fit = Math.min(1, 0.8 * Math.min(innerWidth / (maxX - minX || 1), (innerHeight - 160) / (maxY - minY || 1)))
  const zoom = { value: fit } as Parameters<OnChange>[1]["zoom"]
  createRoot(root).render(
    <Excalidraw
      initialData={{ elements: scene.elements, appState: { ...scene.appState, theme, zoom }, files: scene.files, scrollToContent: true }}
      theme={theme}
      UIOptions={{ tools: { image: false } }} // images would sit in the note as data URLs
      onChange={onChange}
    >
      <MainMenu>
        <MainMenu.DefaultItems.ClearCanvas />
        <MainMenu.DefaultItems.Help />
      </MainMenu>
    </Excalidraw>,
  )
} else {
  document.body.style.margin = "0"
  document.body.style.overflow = "hidden"
  new ResizeObserver(() => host.resize(Math.ceil(root.getBoundingClientRect().height))).observe(root)
  const elements = scene.elements.filter((e) => !e.isDeleted)
  if (elements.length === 0) {
    root.textContent = "Empty drawing"
    root.style.cssText = "font: 13px -apple-system, sans-serif; padding: 6px 0; opacity: 0.5; color: " + (host.dark ? "#fff" : "#000")
  } else {
    // A canvas at the screen's scale, not an SVG: that would embed its fonts through the subsetter this build leaves out.
    // Dark is Excalidraw's own filter, on the element: WebKit's canvas ignores it.
    const scale = window.devicePixelRatio
    const appState = { ...scene.appState, exportBackground: false }
    exportToCanvas({ elements, appState, files: scene.files, getDimensions: (width: number, height: number) => ({ width: width * scale, height: height * scale, scale }) })
      .then((canvas: HTMLCanvasElement) => {
        const dark = host.dark ? "filter: invert(93%) hue-rotate(180deg);" : ""
        canvas.style.cssText = `display: block; width: 100%; max-width: ${canvas.width / scale}px; height: auto; ${dark}`
        root.append(canvas)
      })
  }
}

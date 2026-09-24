// Two bundles: the page (src/page.tsx: Excalidraw, React and the fonts in one HTML document, for the app's web view)
// and main.js (src/main.ts, run by the app's plugin host), which carries the page as a string.
import * as esbuild from "esbuild"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"

// Excalidraw fetches its fonts from files next to its bundle, and uses a data URL as is: inline them all but Xiaolai
// (Chinese and Japanese, 12 MB), which comes from Excalidraw's CDN when a drawing has such text.
const inlineFonts = {
  name: "inline-fonts",
  setup(build) {
    build.onLoad({ filter: /@excalidraw[\\/]excalidraw[\\/]dist[\\/]prod[\\/].*\.js$/ }, (args) => ({
      loader: "js",
      contents: readFileSync(args.path, "utf8").replace(/"\.\/fonts\/((?!Xiaolai)[^"]+\.woff2)"/g, (_, file) =>
        JSON.stringify("data:font/woff2;base64," + readFileSync(join(dirname(args.path), "fonts", file)).toString("base64"))),
    }))
  },
}

// Left out, 7 MB together: Mermaid to Excalidraw (Mermaid itself), the UI in other languages than English, and the
// font subsetter (HarfBuzz as wasm) that embeds fonts in exported SVGs.
const leaveOut = {
  name: "leave-out",
  setup(build) {
    const left = /^@excalidraw\/mermaid-to-excalidraw$|\/locales\/(?!en-)[^/]+\.js$|\/subset-(worker|shared)\.chunk\.js$/
    build.onResolve({ filter: /mermaid-to-excalidraw|locales|subset-/ }, (args) => (left.test(args.path) ? { path: args.path, namespace: "left-out" } : undefined))
    build.onLoad({ filter: /.*/, namespace: "left-out" }, () => ({ contents: "throw new Error('not in this build')", loader: "js" }))
  },
}

const page = await esbuild.build({
  entryPoints: ["src/page.tsx"],
  bundle: true,
  format: "iife",
  minify: true,
  write: false,
  outdir: "page",
  target: "safari18",
  conditions: ["production"],
  define: { "process.env.NODE_ENV": '"production"' },
  loader: { ".woff2": "dataurl" },
  plugins: [inlineFonts, leaveOut],
  logLevel: "warning",
})
const output = (ext) => page.outputFiles.find((f) => f.path.endsWith(ext))?.text ?? ""
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${output(".css")}</style></head><body><div id="root"></div><script>${output(".js")}</script></body></html>`

await esbuild.build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  format: "iife",
  globalName: "__plugin",
  target: "es2022",
  outfile: "main.js",
  define: { PAGE: JSON.stringify(html) },
  logLevel: "warning",
})
console.log(`main.js: page ${(html.length / 1e6).toFixed(1)} MB`)

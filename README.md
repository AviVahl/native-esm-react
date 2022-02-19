# native-esm-react

Native esm React example.

## What's shown?

- An example [React](https://github.com/facebook/react) application rendering two svg logos.
- An http server that:
  - serves the above application, providing both the SSR (`http://localhost:3000/`) and client-only (`http://localhost:3000/index.html`) approaches.
  - uses a worker thread to separate app evaluation/rendering from http server.
  - supports live reloading of the SSR renderer and connected clients.
  - is not production-ready, as there's no caching, compression, etc.
- Both application and server are compiled into a **single** ESM output that works natively in Node.js 16+ _AND_ browsers that [support import maps](https://caniuse.com/import-maps).
- Source maps work in Node and browsers. Nicer debugging experience compared to CommonJS, as imported symbol names are kept the same.
- Asset references using `new URL('./asset.svg, import.meta.url)` are shown and work for SSR as well. Assets must live outside the `src` tree so relative references from `dist` work.
- A _really_ cool `"start"` script that triggers server reloading while giving a `tsc -w` like experience.
- Tiny amount of dev/runtime dependencies. `npm i` and look at `node_modules`.
- React itself is _not_ published as native ESM, so the files in the `static/esm-bridge` folder allow browser ESM imports to use the UMD versions of `react`/`react-dom`, which are loaded by `index.html`.
- Written using strict TypeScript.

## Getting Started

- Clone repository.
- `npm i`
- `npm start`
- Open `http://localhost:3000/` in a browser [compatible with import maps](https://caniuse.com/import-maps).

## License

MIT

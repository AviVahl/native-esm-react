# native-esm-react

Native esm React example.

## What's shown?

- An example [React](https://github.com/facebook/react) application rendering two svg logos.
- Written using strict TypeScript.
- Served as both client-only (`http://localhost:3000/index.html`) or SSR (`http://localhost:3000/`).
- Serves a super-lightweight and naive SSR. Showcase-only. Server is not production-ready (no caching, compression, etc).
- Compiled into a **single** ESM output that works natively in both Node.js 16+ _AND_ browsers that [support import maps](https://caniuse.com/import-maps).
- Source maps work in Node and browsers. Nicer debugging experience compared to CommonJS, as imported symbol names are kept the same.
- Asset references using `new URL('./asset.svg, import.meta.url)` are shown and work for SSR as well. Assets must live outside the `src` tree so relative references from `dist` work.
- A _really_ cool `"watch"` script that auto-reloads the server as well while giving a `tsc -w` like experience.
- Tiny amount of deps. I dare you to `npm i` and look at `node_modules`. Sensible, right?

## Getting Started

- Clone repository.
- `npm i`
- `npm run watch`
- Open `http://localhost:3000/` in a browser [compatible with import maps](https://caniuse.com/import-maps).

## License

MIT

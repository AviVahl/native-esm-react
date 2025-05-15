import React from "react";

const reactLogo = new URL("../../static/react-logo.svg", import.meta.url);
const html5Logo = new URL("../../static/html5-logo.svg", import.meta.url);

export const App: React.FC = () => {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="native esm react example" />
        <title>My App</title>
        <style>{defaultStyle}</style>
        <script type="importmap">{JSON.stringify(importMap)}</script>
      </head>
      <body>
        <header style={{ paddingTop: "2em" }}>
          <img width={120} height={120} src={reactLogo.href} alt="react"></img>
          <img width={120} height={120} src={html5Logo.href} alt="html5"></img>
        </header>
        <main>
          <h1>Native ESM React Example</h1>
          <section>Showcase an approach to load a native ESM React application in the browser and Node.js.</section>
        </main>
        <script type="module" src="dist/client/main.js"></script>
      </body>
    </html>
  );
};

const importMap = {
  imports: {
    react: `https://esm.sh/react@${React.version}`,
    "react/jsx-runtime": `https://esm.sh/react@${React.version}/jsx-runtime`,
    "react/jsx-dev-runtime": `https://esm.sh/react@${React.version}/jsx-dev-runtime`,
    "react-dom": `https://esm.sh/react-dom@${React.version}`,
    "react-dom/client": `https://esm.sh/react-dom@${React.version}/client`,
  },
};

const defaultStyle = `
:root {
  color-scheme: dark;
  font-family: sans-serif;
}

body {
  text-align: center;
}
`;

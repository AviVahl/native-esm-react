import React from "react";

const reactLogo = new URL("../../static/react-logo.svg", import.meta.url);
const html5Logo = new URL("../../static/html5-logo.svg", import.meta.url);

export interface AppProps {
  renderType: string;
}

export const App: React.FC<AppProps> = ({ renderType }) => {
  return (
    <>
      <header style={{ paddingTop: "2em" }}>
        <img width={120} height={120} src={reactLogo.href} alt="react"></img>
        <img width={120} height={120} src={html5Logo.href} alt="html5"></img>
      </header>
      <main>
        <h1>Native ESM React Example</h1>
        <section>
          Showcase an approach to load a native ESM React application in the
          browser and Node.js.
        </section>
        <section style={{ marginTop: "1em" }}>
          Current rendering: {renderType}
        </section>
      </main>
    </>
  );
};

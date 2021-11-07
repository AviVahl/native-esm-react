import React from "react";

const reactLogo = new URL("../../static/react-logo.svg", import.meta.url);
const html5Logo = new URL("../../static/html5-logo.svg", import.meta.url);

export function App() {
  return (
    <div style={{ textAlign: "center", paddingTop: "5em" }}>
      <img width={120} height={120} src={reactLogo.href}></img>
      <img width={120} height={120} src={html5Logo.href}></img>
    </div>
  );
}

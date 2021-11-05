import React from "react";
import ReactDOM from "react-dom";
import { HelloWorld } from "./hello-world.js";

const container = document.body.appendChild(document.createElement("div"));
ReactDOM.render(<HelloWorld />, container);

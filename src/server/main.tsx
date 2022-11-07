import { createAppServer } from "./app-server.js";

const port = 3000;
const cliArgs = process.argv.slice(2);
const live = cliArgs.includes("--live");
const production = cliArgs.includes("--production");

const appServer = await createAppServer({ production, live, port });
printAddress();
process.on("message", onIPCMessage);

function printAddress() {
  console.log(`Listening on: ${appServer.localAddress}`);
}

function onIPCMessage(data: unknown) {
  if (data === "reload") {
    appServer.reload();
  } else if (data === "print-address") {
    printAddress();
  }
}

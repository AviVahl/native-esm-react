// @ts-check

import { spawn } from "node:child_process";
import { URL, fileURLToPath } from "node:url";
import ts from "typescript";
const {
  // @ts-expect-error internal helper function
  createWatchStatusReporter,
  sys,
  createWatchCompilerHost,
  createWatchProgram,
} = ts;

/**
 * @arg {string} tsconfigPath path to tsconfig to watch
 * @arg {string} command command to spawn
 * @arg {string[]} commandArgs arguments to pass to spawned command
 */
function watchAndSpawn(tsconfigPath, command, commandArgs) {
  /** @type import('child_process').ChildProcess | undefined */
  let cliProcess = undefined;

  function restartCliProcess() {
    if (cliProcess && !cliProcess.killed) {
      cliProcess.kill();
    }
    console.log([command, ...commandArgs].join(" "));
    cliProcess = spawn(command, commandArgs, { shell: true, stdio: "inherit" });
  }

  /** @type import('typescript').WatchStatusReporter */
  const originalStatusReporter = createWatchStatusReporter(
    sys,
    /*pretty*/ true
  );

  /** @type import('typescript').WatchStatusReporter */
  const statusReporter = (diagnostic, newLine, options, errorCount) => {
    originalStatusReporter(diagnostic, newLine, options, errorCount);
    if (errorCount === 0) {
      restartCliProcess();
    }
  };

  const watchCompilerHost = createWatchCompilerHost(
    tsconfigPath,
    undefined,
    sys,
    undefined,
    undefined,
    statusReporter
  );

  return createWatchProgram(watchCompilerHost);
}

const tsconfigPath = fileURLToPath(
  new URL("../tsconfig.json", import.meta.url)
);
const [cmd, ...args] = process.argv.slice(2);
if (typeof cmd !== "string") {
  throw new Error(`"watch" must be given a command to execute`);
}

watchAndSpawn(tsconfigPath, cmd, args);

#!/usr/bin/env node
import path from "node:path";
import { Command } from "commander";
import pc from "picocolors";
import { startServer } from "./server/server.js";

export interface CliOptions {
  port: number;
  host: string;
  open: boolean;
  root: string;
  config?: string;
  scan?: string[];
  ignore?: string[];
}

export function parseArgs(argv: string[]): CliOptions {
  const program = new Command()
    .name("peeper-sv")
    .description("Zero-config Svelte 5 component gallery")
    .option("--port <n>", "port to listen on", (v) => parseInt(v, 10), 4321)
    .option("--host <h>", "host to bind to", "localhost")
    .option("--no-open", "do not open browser on start")
    .option("--root <path>", "user project root", process.cwd())
    .option("--config <path>", "path to peeper.config.{js,ts}")
    .option(
      "--scan <glob>",
      "scan glob (repeatable)",
      (v: string, prev: string[] | undefined) => [...(prev ?? []), v],
    )
    .option(
      "--ignore <glob>",
      "ignore glob (repeatable)",
      (v: string, prev: string[] | undefined) => [...(prev ?? []), v],
    )
    .allowExcessArguments(false);

  program.exitOverride();
  program.parse(argv, { from: "node" });

  const o = program.opts<CliOptions & { open?: boolean }>();
  return {
    port: Number(o.port) || 4321,
    host: o.host,
    open: o.open !== false,
    root: path.resolve(o.root),
    ...(o.config ? { config: path.resolve(o.config) } : {}),
    ...(o.scan ? { scan: o.scan } : {}),
    ...(o.ignore ? { ignore: o.ignore } : {}),
  };
}

export async function main(argv: string[]): Promise<void> {
  let opts: CliOptions;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    if ((err as { code?: string }).code === "commander.helpDisplayed" ||
        (err as { code?: string }).code === "commander.version") {
      return;
    }
    console.error(pc.red("Failed to parse arguments:"), err);
    process.exit(1);
  }

  try {
    await startServer({
      root: opts.root,
      port: opts.port,
      host: opts.host,
      open: opts.open,
      ...(opts.config ? { configPath: opts.config } : {}),
      ...(opts.scan ? { scanOverride: opts.scan } : {}),
      ...(opts.ignore ? { ignoreExtra: opts.ignore } : {}),
    });
  } catch (err) {
    console.error(pc.red("\npeeper-sv failed to start:"));
    console.error(err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main(process.argv);
}

#!/usr/bin/env node
// unified Atomist CLI

import { LoggingConfig } from "./internal/util/logger";
LoggingConfig.format = "cli";
process.env.SUPPRESS_NO_CONFIG_WARNING = "true";

import * as yargs from "yargs";
import {
    config,
    extractArgs,
    gitInfo,
    readVersion,
    run,
    start,
} from "./cli/commands";
import { CommandInvocation } from "./internal/invoker/Payload";

const Package = "atomist";

// tslint:disable-next-line:no-unused-expression
yargs.completion("completion")
    .command(["execute <name>", "exec <name>", "cmd <name>"], "Run a command", ya => {
        return (ya as any) // positional is not yet supported in @types/yargs
            .positional("name", {
                describe: "Name of command to run, command parameters NAME=VALUE can follow",
                required: true,
            })
            .option("change-dir", {
                alias: "C",
                default: process.cwd(),
                describe: "Path to automation client project",
                type: "string",
            })
            .option("compile", {
                default: true,
                describe: "Run 'npm run compile' before running",
                type: "boolean",
            })
            .option("install", {
                default: true,
                describe: "Run 'npm install' before running/compiling",
                type: "boolean",
            });
    }, argv => {
        const args = extractArgs(argv._);
        const ci: CommandInvocation = {
            name: argv.name,
            args,
        };
        try {
            const status = run(argv["change-dir"], ci, argv.install, argv.compile);
            process.exit(status);
        } catch (e) {
            console.error(`${Package}: Unhandled Error: ${e.message}`);
            process.exit(101);
        }
    })
    .command(["start", "st", "run"], "Start an automation client", ya => {
        return ya
            .option("change-dir", {
                alias: "C",
                default: process.cwd(),
                describe: "Path to automation client project",
                type: "string",
            })
            .option("compile", {
                default: true,
                describe: "Run 'npm run compile' before starting",
                type: "boolean",
            })
            .option("install", {
                default: true,
                describe: "Run 'npm install' before starting/compiling",
                type: "boolean",
            });
    }, argv => {
        try {
            const status = start(argv["change-dir"], argv.install, argv.compile);
            process.exit(status);
        } catch (e) {
            console.error(`${Package}: Unhandled Error: ${e.message}`);
            process.exit(101);
        }

    })
    .command("git", "Create a git-info.json file", ya => {
        return ya
            .option("change-dir", {
                alias: "C",
                describe: "Path to automation client project",
                default: process.cwd(),
            });
    }, argv => {
        gitInfo(argv)
            .then(status => process.exit(status), err => {
                console.error(`${Package}: Unhandled Error: ${err.message}`);
                process.exit(101);
            });
    })
    .command("config", "Configure environment for running automation clients", ya => {
        return ya
            .option("slack-team", {
                describe: "Slack team ID",
                requiresArg: true,
                type: "string",
            })
            .option("github-user", {
                describe: "GitHub user login",
                requiresArg: true,
                type: "string",
            })
            .option("github-password", {
                describe: "GitHub user password",
                requiresArg: true,
                type: "string",
            })
            .option("github-mfa-token", {
                describe: "GitHub user password",
                requiresArg: true,
                type: "string",
            });
    }, argv => {
        config(argv)
            .then(status => process.exit(status), err => {
                console.error(`${Package}: Unhandled Error: ${err.message}`);
                process.exit(101);
            });
    })
    .showHelpOnFail(false, "Specify --help for available options")
    .alias("help", ["h", "?"])
    .version(readVersion())
    .alias("version", "v")
    .describe("version", "Show version information")
    .demandCommand(1, "Missing command")
    .strict()
    .argv;

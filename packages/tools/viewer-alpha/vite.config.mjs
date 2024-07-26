"use strict";

/* eslint-disable no-console */

import { defineConfig, loadEnv } from "vite";
import chalk from "chalk";
import { mkdirSync, createWriteStream } from "fs";
import { execSync } from "child_process";
import path from "path";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());
    const source = env.source ?? "dev";

    const port = env.VIEWER_PORT ?? 1342;
    console.log(`${chalk.bold(`Web Test App`)}: ${chalk.cyan(`http://localhost:${port}/packages/tools/viewer-alpha/test/apps/web/index.html`)}`);
    console.log(`${chalk.bold(`Analyze Verification App`)}: ${chalk.cyan(`http://localhost:${port}/packages/tools/viewer-alpha/test/apps/web/analyze.html`)}`);
    console.log(`${chalk.bold(`Coverage App`)}: ${chalk.cyan(`http://localhost:${port}/packages/tools/viewer-alpha/test/apps/web/coverage.html`)}`);

    return {
        root: "../../../",
        server: {
            port,
        },
        plugins: [
            {
                name: "configure-server",
                configureServer(server) {
                    server.middlewares.use("/api", (req, res, next) => {
                        if (req.url === "/saveCoverage") {
                            const coverageDirectory = "dist/coverage";
                            const rawDirectory = path.join(coverageDirectory, "raw");
                            mkdirSync(rawDirectory, { recursive: true });
                            const writeStream = createWriteStream(path.join(rawDirectory, "coverage.json"));
                            req.pipe(writeStream);
                            req.on("end", () => {
                                try {
                                    execSync(`node generateCoverageReports.js`);
                                    res.statusCode = 200;
                                } catch (e) {
                                    res.statusCode = 500;
                                    console.error(e);
                                } finally {
                                    res.end();
                                }
                            });
                        } else {
                            next();
                        }
                    });
                },
            },
        ],
        resolve: {
            alias: {
                core: `@${source}/core/dist`,
                loaders: `@${source}/loaders/dist`,
            },
        },
    };
});

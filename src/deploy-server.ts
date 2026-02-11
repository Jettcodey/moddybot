import { LogAPI } from "@/utils/logger.ts";
import { REST, Routes } from "discord.js";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
const WEBHOOK_PORT = parseInt(process.env.WEBHOOK_PORT || "3000");
const DISCORD_TOKEN = process.env.TOKEN || "";
const GUILD_ID = process.env.GUILD_ID || "";
const MODDYBOTPUSH_ID = process.env.MODDYBOTPUSH_ID || "";

const rest = new REST().setToken(DISCORD_TOKEN);

interface GitHubWebhookPayload {
    ref?: string;
    repository?: {
        full_name: string;
        clone_url: string;
    };
    pusher?: {
        name: string;
    };
    commits?: Array<{
        id: string;
        message: string;
    }>;
}

function verifyGitHubSignature(payload: string, signature: string): boolean {
    if (!signature || !signature.startsWith("sha256=")) {
        return false;
    }

    const crypto = new Bun.CryptoHasher("sha256", WEBHOOK_SECRET);
    const digest = "sha256=" + crypto.update(payload).digest("hex");

    return signature === digest;
}

async function sendDiscordMessage(content: string, embed?: any) {
    if (!MODDYBOTPUSH_ID || !DISCORD_TOKEN) {
        LogAPI.log("discord notifications not configured");
        return;
    }

    try {
        await rest.post(Routes.channelMessages(MODDYBOTPUSH_ID), {
            body: embed ? { content, embeds: [embed] } : { content }
        });
    } catch (error) {
        LogAPI.err(`failed to send discord notification: ${error}`);
    }
}

async function executeDeploy(commitMessage?: string, pusher?: string, commitURL?: string) {
    LogAPI.log("starting deployment");

    const repoDir = "/home/cole/moddybot";

    try {
        const embed = {
            title: "moddybot restarting",
            description: commitMessage || "deploying latest changes",
            color: 0xffa500,
            fields: [
                {
                    name: "pushed by",
                    value: pusher || "unknown",
                    inline: true
                },
                {
                    name: "status",
                    value: "pulling changes",
                    inline: true
                },
                {
                    name: "commit",
                    value: commitURL ? `[View Commit](${commitURL})` : "no commit URL",
                    inline: true
                }
            ],
            timestamp: new Date().toISOString()
        };

        await sendDiscordMessage("", embed);

        LogAPI.log("pulling latest changes");
        const gitPull = Bun.spawn(["git", "pull", "origin", "main"], {
            cwd: repoDir,
            stdout: "pipe",
            stderr: "pipe",
        });

        await gitPull.exited;
        const pullOutput = await new Response(gitPull.stdout).text();
        LogAPI.log(pullOutput);

        LogAPI.log("installing dependencies");
        const bunInstall = Bun.spawn(["bun", "install"], {
            cwd: repoDir,
            stdout: "pipe",
            stderr: "pipe",
        });

        await bunInstall.exited;

        await sendDiscordMessage("moddybot stopping");

        LogAPI.log("restarting bot");
        const restart = Bun.spawn(["sudo", "systemctl", "restart", "moddybot"], {
            cwd: repoDir,
            stdout: "pipe",
            stderr: "pipe",
        });

        const exitCode = await restart.exited;
        const stdout = await new Response(restart.stdout).text();
        const stderr = await new Response(restart.stderr).text();

        if (exitCode === 0) {
            LogAPI.log("deployment completed successfully");

            const successEmbed = {
                title: "moddybot back online",
                description: "deployment completed successfully",
                color: 0x00ff00,
                fields: [
                    {
                        name: "changes",
                        value: commitMessage || "latest updates deployed",
                        inline: false
                    },
                    {
                        name: "commit",
                        value: commitURL ? `[View Commit](${commitURL})` : "no commit URL",
                        inline: false
                    }
                ],
                timestamp: new Date().toISOString()
            };

            await sendDiscordMessage("", successEmbed);
            return true;
        } else {
            LogAPI.err("deployment failed");
            LogAPI.err(stderr);

            await sendDiscordMessage("deployment failed, check logs");
            return false;
        }
    } catch (error) {
        LogAPI.err("deployment error");
        LogAPI.err(String(error));

        await sendDiscordMessage("deployment error, check logs");
        return false;
    }
}

const server = Bun.serve({
    port: WEBHOOK_PORT,
    async fetch(req: Request) {
        const url = new URL(req.url);

        if (url.pathname === "/health") {
            return new Response(JSON.stringify({ status: "ok" }), {
                headers: { "Content-Type": "application/json" },
            });
        }

        if (url.pathname === "/webhook" && req.method === "POST") {
            const signature = req.headers.get("x-hub-signature-256") || "";
            const event = req.headers.get("x-github-event") || "";

            const payload = await req.text();

            if (!verifyGitHubSignature(payload, signature)) {
                LogAPI.err("invalid webhook signature");
                return new Response(JSON.stringify({ error: "invalid signature" }), {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                });
            }

            if (event !== "push") {
                return new Response(JSON.stringify({ message: "event ignored" }), {
                    headers: { "Content-Type": "application/json" },
                });
            }

            const data: GitHubWebhookPayload = JSON.parse(payload);

            LogAPI.log(`received push event from ${data.pusher?.name}`);
            LogAPI.log(`repository: ${data.repository?.full_name}`);
            LogAPI.log(`ref: ${data.ref}`);

            const commitMessage = data.commits?.[0]?.message || "no commit message";
            const repoName = data.repository?.full_name || "unknown repo";            
            const commitURL = `https://github.com/${repoName}/commit/${data.commits?.[0]?.id}` || "";
            const pusher = data.pusher?.name || "unknown";

            const success = await executeDeploy(commitMessage, pusher, commitURL);

            return new Response(
                JSON.stringify({
                    message: success ? "deployment triggered" : "deployment failed",
                }),
                {
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        return new Response("not found", { status: 404 });
    },
});

LogAPI.log(`webhook server running on port ${WEBHOOK_PORT}`);
LogAPI.log("endpoints:");
LogAPI.log("  - POST /webhook (github webhooks)");
LogAPI.log("  - GET  /health (health check)");

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
        LogAPI.log("Discord notifications not configured");
        return;
    }

    try {
        await rest.post(Routes.channelMessages(MODDYBOTPUSH_ID), {
            body: embed ? { content, embeds: [embed] } : { content }
        });
    } catch (error) {
        LogAPI.err(`Failed to send Discord notification: ${error}`);
    }
}

async function executeDeploy(commitMessage?: string, pusher?: string) {
    LogAPI.log("Starting deployment...");

    const repoDir = "/home/cole/moddybot";

    try {
        const embed = {
            title: "🔄 ModdyBot is Restarting!",
            description: commitMessage || "Deploying latest changes...",
            color: 0xffa500,
            fields: [
                {
                    name: "Pushed by",
                    value: pusher || "Unknown",
                    inline: true
                },
                {
                    name: "Status",
                    value: "⏳ Pulling changes...",
                    inline: true
                }
            ],
            timestamp: new Date().toISOString()
        };

        await sendDiscordMessage("", embed);

        LogAPI.log("Pulling latest changes...");
        const gitPull = Bun.spawn(["git", "pull", "origin", "main"], {
            cwd: repoDir,
            stdout: "pipe",
            stderr: "pipe",
        });

        await gitPull.exited;
        const pullOutput = await new Response(gitPull.stdout).text();
        LogAPI.log(pullOutput);

        LogAPI.log("Installing dependencies...");
        const bunInstall = Bun.spawn(["bun", "install"], {
            cwd: repoDir,
            stdout: "pipe",
            stderr: "pipe",
        });

        await bunInstall.exited;

        await sendDiscordMessage("🛑 ModdyBot is stopping...");

        LogAPI.log("Restarting bot...");
        const restart = Bun.spawn(["sudo", "systemctl", "restart", "moddybot"], {
            cwd: repoDir,
            stdout: "pipe",
            stderr: "pipe",
        });

        const exitCode = await restart.exited;
        const stdout = await new Response(restart.stdout).text();
        const stderr = await new Response(restart.stderr).text();

        if (exitCode === 0) {
            LogAPI.log("✅ Deployment completed successfully");

            const successEmbed = {
                title: "✅ ModdyBot is Back Online!",
                description: "Deployment completed successfully",
                color: 0x00ff00,
                fields: [
                    {
                        name: "Changes",
                        value: commitMessage || "Latest updates deployed",
                        inline: false
                    }
                ],
                timestamp: new Date().toISOString()
            };

            await sendDiscordMessage("", successEmbed);
            return true;
        } else {
            LogAPI.err("❌ Deployment failed");
            LogAPI.err(stderr);

            await sendDiscordMessage("❌ Deployment failed! Check logs for details.");
            return false;
        }
    } catch (error) {
        LogAPI.err("❌ Deployment error");
        LogAPI.err(String(error));

        await sendDiscordMessage("❌ Deployment error! Check logs for details.");
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
                LogAPI.err("Invalid webhook signature");
                return new Response(JSON.stringify({ error: "Invalid signature" }), {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                });
            }

            if (event !== "push") {
                return new Response(JSON.stringify({ message: "Event ignored" }), {
                    headers: { "Content-Type": "application/json" },
                });
            }

            const data: GitHubWebhookPayload = JSON.parse(payload);

            LogAPI.log(`Received push event from ${data.pusher?.name}`);
            LogAPI.log(`Repository: ${data.repository?.full_name}`);
            LogAPI.log(`Ref: ${data.ref}`);

            const commitMessage = data.commits?.[0]?.message || "No commit message";
            const pusher = data.pusher?.name || "Unknown";

            const success = await executeDeploy(commitMessage, pusher);

            return new Response(
                JSON.stringify({
                    message: success ? "Deployment triggered" : "Deployment failed",
                }),
                {
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        return new Response("Not found", { status: 404 });
    },
});

LogAPI.log(`✅ Webhook server running on port ${WEBHOOK_PORT}`);
LogAPI.log("Endpoints:");
LogAPI.log(`  - POST /webhook (GitHub webhooks)`);
LogAPI.log(`  - GET  /health (Health check)`);

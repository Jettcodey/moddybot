import { LogAPI } from "@/utils/logger.ts";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";
const WEBHOOK_PORT = parseInt(process.env.WEBHOOK_PORT || "3000");

interface GitHubWebhookPayload {
    ref?: string;
    repository?: {
        full_name: string;
        clone_url: string;
    };
    pusher?: {
        name: string;
    };
}

function verifyGitHubSignature(payload: string, signature: string): boolean {
    if (!signature || !signature.startsWith("sha256=")) {
        return false;
    }

    const crypto = new Bun.CryptoHasher("sha256", WEBHOOK_SECRET);
    const digest = "sha256=" + crypto.update(payload).digest("hex");

    return signature === digest;
}

async function executeDeploy() {
    LogAPI.log("Starting deployment...");

    const proc = Bun.spawn(["bash", "deploy.sh"], {
        cwd: process.cwd(),
        stdout: "pipe",
        stderr: "pipe",
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    if (exitCode === 0) {
        LogAPI.log("✅ Deployment completed successfully");
        LogAPI.log(stdout);
    } else {
        LogAPI.err("❌ Deployment failed");
        LogAPI.err(stderr);
    }

    return exitCode === 0;
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

            const success = await executeDeploy();

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

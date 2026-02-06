import { serve } from "bun";
import { exec } from "child_process";

const PORT = 3000;

console.log(`Deploy server listening on port ${PORT}`);

serve({
    port: PORT,
    async fetch(req) {
        if (req.method === "POST" && new URL(req.url).pathname === "/webhook") {
            console.log("Received webhook, pulling interactions...");

            try {
                const pullProc = Bun.spawn(["git", "pull"], {
                    cwd: process.cwd(),
                    stdout: "pipe",
                    stderr: "pipe",
                });

                const pullOutput = await new Response(pullProc.stdout).text();
                console.log("Git Pull Output:", pullOutput);

                const restartProc = Bun.spawn(["pm2", "restart", "all"], {
                    cwd: process.cwd(),
                    stdout: "pipe",
                    stderr: "pipe",
                });

                const restartOutput = await new Response(restartProc.stdout).text();
                console.log("PM2 Cleanup Output:", restartOutput);

                return new Response("Deployed successfully", { status: 200 });
            } catch (error) {
                console.error("Deployment failed:", error);
                return new Response("Deployment failed", { status: 500 });
            }
        }

        return new Response("Not Found", { status: 404 });
    },
});

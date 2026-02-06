module.exports = {
    apps: [
        {
            name: "moddybot",
            script: "bun",
            args: "--env-file=.env ./src/index.tsx",
            cwd: "./",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "1G",
            env: {
                NODE_ENV: "production",
            },
        },
        {
            name: "deploy-server",
            script: "bun",
            args: "--env-file=.env.deploy ./src/deploy-server.ts",
            cwd: "./",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "500M",
            env: {
                NODE_ENV: "production",
            },
        },
    ],
};

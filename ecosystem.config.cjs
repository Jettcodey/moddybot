module.exports = {
    apps: [
        {
            name: "moddybot",
            script: "src/index.ts",
            interpreter: "bun",
        },
        {
            name: "deploy-server",
            script: "src/deploy-server.ts",
            interpreter: "bun",
        },
    ],
};

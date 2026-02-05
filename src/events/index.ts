import fs from "node:fs";
import path from "node:path";

const eventsPath = path.join(__dirname, "..", "events");

export default class Events {
    private events: Map<string, Event> = new Map();

    async loadEvents() {
        const files = fs.readdirSync(eventsPath).filter(file => !file.startsWith("index"));

        for (const file of files) {
            const filePath = path.join(eventsPath, file);
            const exports = await import(filePath);
            const command = exports.default;
            if (command.name)
            {
                this.events.set(`${command.name}-${Math.random() * 100}`, command);
            }
        }
    }

    getEvents()
    {
        return Array.from(this.events.values());
    }
}
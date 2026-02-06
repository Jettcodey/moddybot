import fs from "node:fs";
import path from "node:path";
import type { Event } from "@/types/index.ts";
import {LogAPI} from "@/utils/logger.ts";

const eventsPath = path.join(import.meta.dirname, ".");

export default class Events {
    private events: Map<string, Event> = new Map();

    async loadEvents() {
        const files = fs.readdirSync(eventsPath).filter(file => !file.startsWith("index"));

        const working = [];
        for (const file of files) {
            const filePath = path.join(eventsPath, file);
            const exports = await import(filePath);
            const command = exports.default;
            if (command.name)
            {
                this.events.set(`${command.name}-${Math.random() * 100}`, command);
                working.push(command.name);
            }
        }

        working[working.length - 1] = `and ${working[working.length - 1]}`
        LogAPI.log(working.join(", "), "were loaded.");
    }

    getEvents()
    {
        return Array.from(this.events.values()) as Event[];
    }
}
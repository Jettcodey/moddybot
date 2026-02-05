import * as fs from "node:fs";
import * as path from "node:path";
import type { Command } from "@/types/index.ts";

const commandsPath = path.join(import.meta.dirname, ".");

export class Commands {
    private commands: Map<string, Command> = new Map();

    async loadCommands()
    {
        const files = fs.readdirSync(commandsPath).filter(file => !file.startsWith("index"));

        for (const file of files) {
            const filePath = path.join(commandsPath, file);
            const exports = await import(filePath);
            const command = exports.default;
            if (command.data)
            {
                this.commands.set(command.data.name, command);
            }
        }
    }

    getCommand(name: string): Command | undefined {
        return this.commands.get(name);
    }

    getAllCommands(): Command[] {
        return Array.from(this.commands.values());
    }
}

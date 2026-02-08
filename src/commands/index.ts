import * as fs from "node:fs";
import * as path from "node:path";
import type { Command } from "@/types/index.ts";
import {LogAPI} from "@/utils/logger.ts";

const commandsPath = path.join(import.meta.dirname, ".");

export class Commands {
    private commands: Map<string, Command> = new Map();

    async loadCommands()
    {
        const files = fs.readdirSync(commandsPath, { withFileTypes: true })
            .filter(dirent => dirent.isFile() && dirent.name !== 'index.ts')
            .map(dirent => dirent.name);

        const working = [];

        for (const file of files) {
            const filePath = path.join(commandsPath, file);
            const exports = await import(filePath);
            const command = exports.default;
            if (!command?.permissionCheck) {
                LogAPI.err(`Command ${command.data.name} does not have a permission check`);
            }
z
            if (command.data)
            {
                this.commands.set(command.data.name, command);
                working.push(command.data.name);
            }
        }

        working[working.length - 1] = `and ${working[working.length - 1]}`
        LogAPI.log(working.join(", "), "were loaded.");
    }

    getCommand(name: string): Command | undefined {
        return this.commands.get(name);
    }

    getAllCommands(): Command[] {
        return Array.from(this.commands.values());
    }
}

import * as fs from "node:fs";
import * as path from "node:path";

const commandsPath = path.join(process.cwd(), 'src/commands');

export class Commands {
    private commands: Map<String, any> = new Map();

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

    getCommand(name: string)
    {
        return this.commands.get(name);
    }

    getAllCommands()
    {
        return Array.from(this.commands.values());
    }
}
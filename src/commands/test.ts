import { SlashCommandBuilder } from "discord.js";
import type { Command } from "@/types";

export const command: Command = {
    data: new SlashCommandBuilder()
        .setName("test")
        .setDescription("Test command to verify autonomous deployment"),
    async execute(client, interaction) {
        await interaction.reply({
            content: "✅ Test command working! Autonomous deployment is functional.",
            ephemeral: true
        });
    }
};

import { SlashCommandBuilder } from "discord.js";
import type { Command } from "@/types";

export default {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with pong!"),
    async execute(client, interaction) {
        await interaction.reply({
            content: "pong!",
            ephemeral: false
        });
    }
};

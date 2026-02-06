import { SlashCommandBuilder } from "discord.js";
import type { Command } from "@/types";

export default {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("check bot latency"),
    async execute(client, interaction) {
        const sent = await interaction.reply({ content: "pinging...", fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;

        await interaction.editReply(`pong! \`${latency}ms\``);
    }
};

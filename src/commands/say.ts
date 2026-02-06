import {
    type ChatInputCommandInteraction,
    type Client,
    SlashCommandBuilder,
} from "discord.js";
import {check} from "@/commands/defaults";

export default {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('say')
        .addStringOption(option => option
            .setName('say')
            .setDescription('say')
            .setRequired(true)
        ),

    permissionCheck: check,

    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const guild = interaction.guild;
        const say = interaction.options.getString("say");
        if (!say || !guild) return;

        await interaction.reply({
            content: say
        })
    }
}
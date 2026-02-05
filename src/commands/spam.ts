import {type ChatInputCommandInteraction, type Client, type Message, SlashCommandBuilder} from "discord.js";
import {getConfig, setConfig} from "../helpers";

export default {
    data: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Blacklist a link')
        .addStringOption(option =>
            option
                .setName('link')
                .setDescription('The link to be blacklisted')
                .setRequired(true)
        ),

    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const link = interaction.options.getString("link");
        if (!link) return;

        setConfig("links", [link, ...getConfig().links]);
        await interaction.reply({
            content: "Blacklisted link owo",
        })
    }
}
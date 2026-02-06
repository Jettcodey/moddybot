import {
    type ChatInputCommandInteraction,
    type Client,
    SlashCommandBuilder,
    type Snowflake,
    type GuildMember,
} from "discord.js";
import {getConfig, setConfig} from "@/utils/config.ts";
import {check} from "@/commands/defaults";

// @ts-ignore
export default {
    data: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Blacklist a link')
        .addStringOption(option => option
            .setName('link')
            .setDescription('The link to be blacklisted')
            .setRequired(true)
        ),

    permissionCheck: check, // MAKE SURE THIS IS ALWAYS HERE. if not the bot cannot run commands.

    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const guild = interaction.guild;
        const link = interaction.options.getString("link");
        if (!link || !guild) return;
        const prevLinks: string[] = getConfig().links

        setConfig("links", [link, ...prevLinks]);
        await interaction.reply({
            content: "Blacklisted link owo",
        });
    }
}

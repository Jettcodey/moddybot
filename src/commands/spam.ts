import {
    type ChatInputCommandInteraction,
    type Client,
    SlashCommandBuilder,
    type Snowflake,
    type GuildMember,
} from "discord.js";
import { getConfig, setConfig } from "@/utils/config.ts";
import type { Command } from "@/types/index.ts";

export default {
    data: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Blacklist a link')
        .addStringOption(option => option
            .setName('link')
            .setDescription('The link to be blacklisted')
            .setRequired(true)
        ),

    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const guild = interaction.guild;
        const link = interaction.options.getString("link");
        if (!link || !guild) return;
        const prevLinks: string[] = getConfig().links

        const requiredRole = await guild.roles.fetch(process.env.MINIMUM_ROLE_REQUIRED as Snowflake);
        const member = interaction.member as GuildMember;
        const isNotHighEnough = requiredRole && member.roles.highest.position < requiredRole.position;

        if (isNotHighEnough) {
            await interaction.reply({content: 'Invalid permissions', ephemeral: true});
            return;
        }

        setConfig("links", [link, ...prevLinks]);
        await interaction.reply({
            content: "Blacklisted link owo",
        });
    }
} satisfies Command

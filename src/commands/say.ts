import {
    type ChatInputCommandInteraction,
    type Client,
    type GuildMember,
    type Interaction,
    SlashCommandBuilder,
    type Snowflake
} from "discord.js";
import {getConfig} from "@/utils/config.ts";

export default {
    data: new SlashCommandBuilder()
        .setName('message')
        .setDescription('say')
        .addStringOption(option => option
            .setName('say')
            .setDescription('say')
            .setRequired(true)
        ),
    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const guild = interaction.guild;
        const say = interaction.options.getString("say");
        if (!say || !guild) return;

        const requiredRole = await guild.roles.fetch(process.env.MINIMUM_ROLE_REQUIRED as Snowflake);
        const member = interaction.member as GuildMember;
        const hasRequiredRole = requiredRole && member.roles.highest.position >= requiredRole.position;

        if (!hasRequiredRole) {
            await interaction.reply({content: 'Invalid permissions', ephemeral: true});
            return;
        }

        await interaction.reply({
            content: say
        })
    }
}
import type {ChatInputCommandInteraction, Client, GuildMember, Snowflake} from "discord.js";

export async function check(client: Client, interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild;

    if (!guild) {
        return {result: false, message: 'This command can only be used in a server'};
    }

    const requiredRole = await guild.roles.fetch(process.env.MINIMUM_ROLE_REQUIRED as Snowflake);
    const member = interaction.member as GuildMember;

    if (!requiredRole) {
        return {result: false, message: 'Configuration error: required role not found'};
    }

    const hasRequiredRole = member.roles.highest.position >= requiredRole.position;

    if (!hasRequiredRole) {
        return {result: false, message: 'The Maze isn\'t meant for you.'}; // discord datamining easteregg >:)
    }

    return {result: true};
}
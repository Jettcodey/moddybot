import {SlashCommandBuilder, type Client, type ChatInputCommandInteraction, Snowflake} from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('modder')
        .setDescription('Give a user the modder role')
        .addUserOption(option =>
            option
                .setName('user')
                .setDescription('The user to give the modder role to')
                .setRequired(true)
        ),

    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        if (!interaction.isChatInputCommand()) return;

        const guild = interaction.guild;
        if (!guild) return;

        const targetUser = interaction.options.getUser('user', true);
        const member = await guild.members.fetch(targetUser.id);

        const requiredRole = await guild.roles.fetch(process.env.MINIMUM_ROLE_REQUIRED as Snowflake);
        const isNotHighEnough = requiredRole && member.roles.highest.position < requiredRole.position;

        if (isNotHighEnough) {
            await interaction.reply({content: 'Invalid permissions', ephemeral: true});
            return;
        }

        if (!member) {
            await interaction.reply({content: 'Could not find that member!', ephemeral: true});
            return;
        }

        const modderRole = await guild.roles.fetch("1344708068918952109");

        if (!modderRole) {
            await interaction.reply({content: 'Could not find modder role!', ephemeral: true});
            return;
        }

        await member.roles.add(modderRole);
        await interaction.reply({
            content: `${member.user.tag} is now a ${modderRole.name}`, ephemeral: true
        });
    }
}
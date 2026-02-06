import {
    ApplicationCommandType,
    ContextMenuCommandBuilder,
    type Client,
    type MessageContextMenuCommandInteraction,
} from "discord.js";
import translate from '@vitalets/google-translate-api';

export default {
    data: new ContextMenuCommandBuilder()
        .setName('Translate')
        .setType(ApplicationCommandType.Message),

    async execute(client: Client, interaction: MessageContextMenuCommandInteraction) {
        const targetMessage = interaction.targetMessage;

        await interaction.deferReply();

        try {
            const result = await translate.translate(targetMessage.content, { to: 'en' });

            await interaction.editReply({
                content: `**Translated:** ${result.text}`
            });
        } catch (error) {
            await interaction.editReply({
                content: "Translation failed."
            });
        }
    },

    async permissionCheck(client: Client, interaction: MessageContextMenuCommandInteraction) {
        return { result: true };
    }
}
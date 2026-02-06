import type {
  Client,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder, Interaction, Message, Embed,
} from "discord.js";

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute(client: Client, interaction: ChatInputCommandInteraction): Promise<void>;
  autocomplete?(client: Client, interaction: AutocompleteInteraction): Promise<void>;
  permissionCheck?(client: Client, interaction: ChatInputCommandInteraction): Promise<{
    result: boolean;
    message?: string;
    embeds?: Embed[];
    hide?: boolean;
  }>;
}
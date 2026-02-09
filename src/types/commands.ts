import type {
  Client,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  ContextMenuCommandBuilder,
  UserContextMenuCommandInteraction, MessageContextMenuCommandInteraction,
} from "discord.js";

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder | ContextMenuCommandBuilder;
  execute(
      client: Client,
      interaction: ChatInputCommandInteraction | UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction
  ): Promise<void>;
  autocomplete?(client: Client, interaction: AutocompleteInteraction): Promise<void>;
  permissionCheck?(
      client: Client,
      interaction: ChatInputCommandInteraction | UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction
  ): Promise<{
    result: boolean;
    message?: string;
    embeds?: any[];
    hide?: boolean;
  }>;
}
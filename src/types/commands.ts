import type {
  Client,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
  ContextMenuCommandBuilder,
  UserContextMenuCommandInteraction, MessageContextMenuCommandInteraction, Message, Interaction,
} from "discord.js";

interface Comp {
  customId: string;
  execute: (client: Client, interaction: Interaction, message: Promise<void> | Message<boolean>) => void;
}

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder | ContextMenuCommandBuilder;
  execute(
      client: Client,
      interaction: ChatInputCommandInteraction | UserContextMenuCommandInteraction | MessageContextMenuCommandInteraction
  ): Promise<void> | Promise<Message<boolean>>;
  autocomplete?(client: Client, interaction: AutocompleteInteraction): Promise<void>;
  components: Comp[]
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
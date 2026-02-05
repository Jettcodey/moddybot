import type {
  Client,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute(client: Client, interaction: ChatInputCommandInteraction): Promise<void>;
  autocomplete?(client: Client, interaction: AutocompleteInteraction): Promise<void>;
}

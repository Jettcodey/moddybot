import {
    type ChatInputCommandInteraction,
    type Client,
    type AutocompleteInteraction,
    SlashCommandBuilder,
} from "discord.js";
import type { Command } from "@/types/index.ts";

const ACTIONS = [{
    name: "Setup REPO SDK",
    value: "SETUP_REPO_SDK",
    message: {
        content: `For setting up a unity project with the REPO SDK please check https://canary.discord.com/channels/1344557689979670578/1347085214291329084 pins or click here: https://canary.discord.com/channels/1344557689979670578/1344699470176194673/1434662431036276858`
    }
},
    {
        name: "Setup Unity Environment",
        value: "SETUP_UNITY_ENV",
        message: {
            content: `Need help getting started? Check out https://canary.discord.com/channels/1344557689979670578/1347085214291329084/1431722352508403843!`
        }
    }
]

export default {
    data: new SlashCommandBuilder()
        .setName('devhelp')
        .setDescription('Displays a help message')
        .addStringOption(option => option
            .setName('type')
            .setDescription('The type of help message')
            .setRequired(true)
            .setAutocomplete(true)
        ),

    async autocomplete(client: Client, interaction: AutocompleteInteraction) {
        await interaction.respond(ACTIONS.map(ev => ({name: ev.name, value: ev.value})));
    },

    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const link = interaction.options.getString("type");
        if (!link) return;

        const target = ACTIONS.find(x => x.value == link)
        await interaction.reply({...target?.message})
    }
} satisfies Command

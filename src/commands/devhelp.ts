import {
    type ChatInputCommandInteraction,
    type Client,
    type AutocompleteInteraction,
    SlashCommandBuilder,
} from "discord.js";
import type { Command } from "@/types/index.ts";
import {check} from "@/commands/defaults";

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
    },
    {
        name: "Vagueness",
        value: "QUIT_BEING_FUCKING_VAGUE",
        message: {
            content: "# Vagueness\n" +
                "Even if explaining isn’t your strong suit, please try your best.\n" +
                "Messages like \"no workie\" or \"so and so doesn’t work, help?\" don’t give us enough information to assist you.\n" +
                "We aren’t there with you, so we can only work with what you provide. Please explain the issue in as much detail as possible.\n" +
                "Include screenshots, logs, error messages—literally anything that can help us understand what’s going wrong." +
                "\n\n" +
                "If you want a longer explanation-- here https://canary.discord.com/channels/1344557689979670578/1347085657864015872/1449885242457460747\n" +
                "## Example:\n" +
                "\"I updated and now crash any mod do that?\". We literally don't know. It is impossible for us to know.",
        }
    },
    {
        name: "mods",
        value: "bruh",
        message: {
            content: "Do mods work in multiplayer?: Yes. \nCan I play mods with other people?: Yes."
        }
    },
    {
        name: 'test',
        value: "TEST",
        message: {
            content: "test?"
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

    permissionCheck: () => ({result: true}),

    async autocomplete(client: Client, interaction: AutocompleteInteraction) {
        await interaction.respond(ACTIONS.map(ev => ({name: ev.name, value: ev.value})));
    },

    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const link = interaction.options.getString("type");
        if (!link) return;

        const target = ACTIONS.find(x => x.value == link)
        await interaction.reply({...target?.message})
    }
}

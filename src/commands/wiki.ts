import {
    type ChatInputCommandInteraction,
    type Client,
    type AutocompleteInteraction,
    SlashCommandBuilder,
} from "discord.js";
import type { Command } from "@/types/index.ts";
import {check} from "@/commands/defaults";

const URL = 'https://repomods.com'

const makeURL = (url: string) => `${URL}${url}`

const pages = {
    // global
    overview: '/overview.html',
    develop: '/develop.html',
    // api
    api_get_started: '/repolib/api/start.html',
    api_bundle_loading: '/repolib/api/bundles.html',
    api_mixer_groups: '/repolib/api/audio-mixer-groups.html',
    api_commands: '/repolib/api/commands.html',
    api_enemies: '/repolib/api/enemies.html',
    api_items: '/repolib/api/items.html',
    api_network_events: '/repolib/api/network-events.html',
    api_network_prefabs: '/repolib/api/network-prefabs.html',
    api_valuables: '/repolib/api/valuables.html',
    // sdk
    sdk_start: '/repolib/sdk/start.html',
    sdk_custom_scripts: '/repolib/sdk/custom-scripts.html',
    sdk_enemies: '/repolib/sdk/enemies.html',
    sdk_levels: '/repolib/sdk/levels.html',
    sdk_items: '/repolib/sdk/items.html',
    sdk_valuables: '/repolib/sdk/valuables.html',
}

export default {
    data: new SlashCommandBuilder()
        .setName('wiki')
        .setDescription('Forwards to a wiki of REPO modding.')
        .addStringOption(option => option
            .setName('type')
            .setDescription('The type of wiki')
            .setRequired(true)
            .setAutocomplete(true)
        ),

    permissionCheck: () => ({result: true}),

    async autocomplete(client: Client, interaction: AutocompleteInteraction) {
        await interaction.respond(
            Object.entries(pages).map(([name, value]) => {
                const formatted = name
                    .split('_')
                    .map(word => {
                        if (word.toLowerCase() === 'api') return 'API';
                        if (word.toLowerCase() === 'sdk') return 'SDK';
                        return word.charAt(0).toUpperCase() + word.slice(1);
                    })
                    .join(' ');

                return { name: formatted, value: name };
            })
        );
    },

    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const link = interaction.options.getString("type");
        if (!link) return;

        await interaction.reply(makeURL(link));
    }
}

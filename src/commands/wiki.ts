import {
    type ChatInputCommandInteraction,
    type Client,
    type AutocompleteInteraction,
    SlashCommandBuilder,
} from "discord.js";
import type { Command } from "@/types/index.ts";

const BASE_URL = 'https://repomods.com';

interface Page {
    id: string;
    label: string;
    path: string;
    category: 'global' | 'api' | 'sdk';
}

const PAGES: Page[] = [
    // Global
    { id: 'overview', label: 'Overview', path: '/overview.html', category: 'global' },
    { id: 'develop', label: 'Develop', path: '/develop.html', category: 'global' },

    // API
    { id: 'api_get_started', label: 'API Get Started', path: '/repolib/api/start.html', category: 'api' },
    { id: 'api_bundle_loading', label: 'API Bundle Loading', path: '/repolib/api/bundles.html', category: 'api' },
    { id: 'api_mixer_groups', label: 'API Mixer Groups', path: '/repolib/api/audio-mixer-groups.html', category: 'api' },
    { id: 'api_commands', label: 'API Commands', path: '/repolib/api/commands.html', category: 'api' },
    { id: 'api_enemies', label: 'API Enemies', path: '/repolib/api/enemies.html', category: 'api' },
    { id: 'api_items', label: 'API Items', path: '/repolib/api/items.html', category: 'api' },
    { id: 'api_network_events', label: 'API Network Events', path: '/repolib/api/network-events.html', category: 'api' },
    { id: 'api_network_prefabs', label: 'API Network Prefabs', path: '/repolib/api/network-prefabs.html', category: 'api' },
    { id: 'api_valuables', label: 'API Valuables', path: '/repolib/api/valuables.html', category: 'api' },

    // SDK
    { id: 'sdk_start', label: 'SDK Get Started', path: '/repolib/sdk/start.html', category: 'sdk' },
    { id: 'sdk_custom_scripts', label: 'SDK Custom Scripts', path: '/repolib/sdk/custom-scripts.html', category: 'sdk' },
    { id: 'sdk_enemies', label: 'SDK Enemies', path: '/repolib/sdk/enemies.html', category: 'sdk' },
    { id: 'sdk_levels', label: 'SDK Levels', path: '/repolib/sdk/levels.html', category: 'sdk' },
    { id: 'sdk_items', label: 'SDK Items', path: '/repolib/sdk/items.html', category: 'sdk' },
    { id: 'sdk_valuables', label: 'SDK Valuables', path: '/repolib/sdk/valuables.html', category: 'sdk' },
];

const findPageById = (id: string): Page | undefined => {
    return PAGES.find(page => page.id === id);
};

const buildUrl = (path: string): string => {
    return `${BASE_URL}${path}`;
};

export default {
    data: new SlashCommandBuilder()
        .setName('wiki')
        .setDescription('Forwards to a wiki of REPO modding.')
        .addStringOption(option => option
            .setName('page')
            .setDescription('The wiki page to view')
            .setRequired(true)
            .setAutocomplete(true)
        ),

    permissionCheck: () => ({ result: true }),

    async autocomplete(client: Client, interaction: AutocompleteInteraction) {
        const focusedValue = interaction.options.getFocused(true).value.toLowerCase();

        const filtered = PAGES
            .filter(page => page.label.toLowerCase().includes(focusedValue))
            .slice(0, 25)
            .map(page => ({
                name: page.label,
                value: page.id,
            }));

        await interaction.respond(filtered);
    },

    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const pageId = interaction.options.getString('page', true);
        const page = findPageById(pageId);

        if (!page) {
            await interaction.reply({
                content: '❌ Page not found.',
                ephemeral: true,
            });
            return;
        }

        const url = buildUrl(page.path);
        await interaction.reply({
            content: url,
        });
    },
}
import {
    type ChatInputCommandInteraction,
    type Client,
    SlashCommandBuilder,
    ActivityType,
} from "discord.js";
import {check} from "@/commands/defaults";
import {startRandom, stopRandom} from "@/utils/status.ts";
import {getConfig, setConfig} from "@/utils/config.ts";

export default {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('change the bot\'s status')

        .addSubcommand(sub => sub
            .setName('set')
            .setDescription('set a custom status')
            .addStringOption(option => option
                .setName('type')
                .setDescription('activity type')
                .setRequired(true)
                .addChoices(
                    {name: 'playing', value: 'playing'},
                    {name: 'watching', value: 'watching'},
                    {name: 'listening', value: 'listening'},
                    {name: 'competing', value: 'competing'},
                    {name: 'custom', value: 'custom'},
                )
            )
            .addStringOption(option => option
                .setName('text')
                .setDescription('what to display')
                .setRequired(true)
            )
        )

        .addSubcommand(sub => sub
            .setName('random')
            .setDescription('rotate random statuses')
            .addIntegerOption(option => option
                .setName('interval')
                .setDescription('seconds between rotations (default 300)')
                .setMinValue(10)
            )
        )

        .addSubcommand(sub => sub
            .setName('clear')
            .setDescription('clear the status')
        )

        .addSubcommand(sub => sub
            .setName('add')
            .setDescription('add to the random pool')
            .addStringOption(option => option
                .setName('category')
                .setDescription('what to add to')
                .setRequired(true)
                .addChoices(
                    {name: 'action', value: 'actions'},
                    {name: 'suffix', value: 'suffixes'},
                    {name: 'user', value: 'users'},
                )
            )
            .addStringOption(option => option
                .setName('value')
                .setDescription('value to add (user id for users)')
                .setRequired(true)
            )
        )

        .addSubcommand(sub => sub
            .setName('remove')
            .setDescription('remove from the random pool')
            .addStringOption(option => option
                .setName('category')
                .setDescription('what to remove from')
                .setRequired(true)
                .addChoices(
                    {name: 'action', value: 'actions'},
                    {name: 'suffix', value: 'suffixes'},
                    {name: 'user', value: 'users'},
                )
            )
            .addStringOption(option => option
                .setName('value')
                .setDescription('value to remove')
                .setRequired(true)
            )
        )

        .addSubcommand(sub => sub
            .setName('list')
            .setDescription('show the random status pool')
        ),

    permissionCheck: check,

    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const sub = interaction.options.getSubcommand()

        if (sub == "set") {
            stopRandom()
            const type = interaction.options.getString("type");
            const text = interaction.options.getString("text");
            if (!type || !text) return;

            const types = {
                playing: ActivityType.Playing,
                watching: ActivityType.Watching,
                listening: ActivityType.Listening,
                competing: ActivityType.Competing,
                custom: ActivityType.Custom,
            }

            if (type == "custom") {
                client.user?.setPresence({status: "online", activities: [{name: "custom", type: ActivityType.Custom, state: text}]})
            } else {
                client.user?.setPresence({status: "online", activities: [{name: text, type: types[type]}]})
            }

            await interaction.reply({content: `Set the status to ${type == "custom" ? "" : type + " "}**${text}**.`})
            return;
        }

        if (sub == "random") {
            const interval = interaction.options.getInteger("interval") ?? undefined
            await startRandom(client, interval)
            await interaction.reply({content: `Random statuses are on, rotating every ${interval ?? getConfig().status.interval} seconds.`})
            return;
        }

        if (sub == "clear") {
            stopRandom()
            client.user?.setPresence({status: "online", activities: []})
            await interaction.reply({content: "Cleared the status."})
            return;
        }

        if (sub == "add") {
            const category = interaction.options.getString("category") as "actions" | "suffixes" | "users"
            const value = interaction.options.getString("value")
            if (!category || !value) return;

            const config = getConfig()
            const list = config.status[category]

            if (list.includes(value)) {
                await interaction.reply({content: `That's already in ${category}.`})
                return;
            }

            setConfig("status", {...config.status, [category]: [...list, value]})
            await interaction.reply({content: `Added **${value}** to ${category}.`})
            return;
        }

        if (sub == "remove") {
            const category = interaction.options.getString("category") as "actions" | "suffixes" | "users"
            const value = interaction.options.getString("value")
            if (!category || !value) return;

            const config = getConfig()
            const list = config.status[category]

            if (!list.includes(value)) {
                await interaction.reply({content: `That's not in ${category}.`})
                return;
            }

            setConfig("status", {...config.status, [category]: list.filter(v => v !== value)})
            await interaction.reply({content: `Removed **${value}** from ${category}.`})
            return;
        }

        if (sub == "list") {
            const {actions, suffixes, users} = getConfig().status
            const userNames = await Promise.all(users.map(async id => {
                const u = await client.users.fetch(id).catch(() => null)
                return u ? `${u.globalName || u.username} (${id})` : id
            }))

            await interaction.reply({content:
                `**Actions:** ${actions.join(", ") || "none"}\n` +
                `**Suffixes:** ${suffixes.map(s => s || "(empty)").join(", ") || "none"}\n` +
                `**Users:** ${userNames.join(", ") || "none"}`
            })
        }
    }
}

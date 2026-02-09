import {
    type ChatInputCommandInteraction,
    type Client,
    SlashCommandBuilder,
    ActivityType,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ComponentType,
    EmbedBuilder,
} from "discord.js";
import {check} from "@/commands/defaults";
import {startRandom, stopRandom} from "@/utils/status.ts";
import {getConfig, setConfig} from "@/utils/config.ts";

const activityTypes = {
    playing: ActivityType.Playing,
    watching: ActivityType.Watching,
    listening: ActivityType.Listening,
    competing: ActivityType.Competing,
    custom: ActivityType.Custom,
}

async function buildPanel(client: Client) {
    const {actions, suffixes, users, interval} = getConfig().status
    const activity = client.user?.presence?.activities?.[0]

    let current = "None"
    if (activity) {
        if (activity.type == ActivityType.Custom) current = activity.state || "None"
        else current = `${ActivityType[activity.type]} ${activity.name}`
    }

    const userNames = await Promise.all(users.map(async id => {
        const u = await client.users.fetch(id).catch(() => null)
        return u ? `${u.globalName || u.username}` : id
    }))

    const embed = new EmbedBuilder()
        .setTitle("Status Config")
        .setColor(0x5865F2)
        .addFields(
            {name: "Current", value: current, inline: true},
            {name: "Interval", value: `${interval}s`, inline: true},
            {name: "Actions", value: actions.join(", ") || "none"},
            {name: "Suffixes", value: suffixes.map(s => s || "(empty)").join(", ") || "none"},
            {name: "Users", value: userNames.join(", ") || "none"},
        )

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("status_set").setLabel("Set Status").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("status_random").setLabel("Start Random").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("status_clear").setLabel("Clear").setStyle(ButtonStyle.Danger),
    )

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("status_add").setLabel("Add to Pool").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("status_remove").setLabel("Remove from Pool").setStyle(ButtonStyle.Secondary),
    )

    return {embeds: [embed], components: [row1, row2]}
}

export default {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('open the status config panel'),

    permissionCheck: check,

    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const msg = await interaction.reply({...await buildPanel(client), fetchReply: true})

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter: i => i.user.id == interaction.user.id,
            time: 300_000,
        })

        collector.on('collect', async btn => {
            if (btn.customId == "status_set") {
                const modal = new ModalBuilder()
                    .setCustomId("status_set_modal")
                    .setTitle("Set Status")
                    .addComponents(
                        new ActionRowBuilder<TextInputBuilder>().addComponents(
                            new TextInputBuilder()
                                .setCustomId("type")
                                .setLabel("Type (playing/watching/listening/competing/custom)")
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder<TextInputBuilder>().addComponents(
                            new TextInputBuilder()
                                .setCustomId("text")
                                .setLabel("Status text")
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        ),
                    )

                await btn.showModal(modal)
                try {
                    const submit = await btn.awaitModalSubmit({time: 60_000})
                    const type = submit.fields.getTextInputValue("type").toLowerCase()
                    const text = submit.fields.getTextInputValue("text")

                    if (!activityTypes[type]) {
                        await submit.reply({content: "Invalid type. Use playing, watching, listening, competing, or custom.", ephemeral: true})
                        return
                    }

                    stopRandom()
                    if (type == "custom") {
                        client.user?.setPresence({status: "online", activities: [{name: "custom", type: ActivityType.Custom, state: text}]})
                    } else {
                        client.user?.setPresence({status: "online", activities: [{name: text, type: activityTypes[type]}]})
                    }

                    await submit.deferUpdate()
                    await msg.edit(await buildPanel(client))
                } catch (e) {}
            }

            if (btn.customId == "status_random") {
                const modal = new ModalBuilder()
                    .setCustomId("status_random_modal")
                    .setTitle("Start Random Rotation")
                    .addComponents(
                        new ActionRowBuilder<TextInputBuilder>().addComponents(
                            new TextInputBuilder()
                                .setCustomId("interval")
                                .setLabel("Interval in seconds (leave blank for default)")
                                .setStyle(TextInputStyle.Short)
                                .setRequired(false)
                        ),
                    )

                await btn.showModal(modal)
                try {
                    const submit = await btn.awaitModalSubmit({time: 60_000})
                    const raw = submit.fields.getTextInputValue("interval")
                    const interval = raw ? parseInt(raw) : undefined

                    if (raw && (isNaN(interval!) || interval! < 10)) {
                        await submit.reply({content: "Interval must be a number >= 10.", ephemeral: true})
                        return
                    }

                    await startRandom(client, interval)
                    await submit.deferUpdate()
                    await msg.edit(await buildPanel(client))
                } catch (e) {}
            }

            if (btn.customId == "status_clear") {
                stopRandom()
                client.user?.setPresence({status: "online", activities: []})
                await btn.deferUpdate()
                await msg.edit(await buildPanel(client))
            }

            if (btn.customId == "status_add") {
                const modal = new ModalBuilder()
                    .setCustomId("status_add_modal")
                    .setTitle("Add to Pool")
                    .addComponents(
                        new ActionRowBuilder<TextInputBuilder>().addComponents(
                            new TextInputBuilder()
                                .setCustomId("category")
                                .setLabel("Category (actions/suffixes/users)")
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder<TextInputBuilder>().addComponents(
                            new TextInputBuilder()
                                .setCustomId("value")
                                .setLabel("Value to add (user id for users)")
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        ),
                    )

                await btn.showModal(modal)
                try {
                    const submit = await btn.awaitModalSubmit({time: 60_000})
                    const category = submit.fields.getTextInputValue("category").toLowerCase()
                    const value = submit.fields.getTextInputValue("value")

                    if (!["actions", "suffixes", "users"].includes(category)) {
                        await submit.reply({content: "Invalid category. Use actions, suffixes, or users.", ephemeral: true})
                        return
                    }

                    const config = getConfig()
                    const list = config.status[category]

                    if (list.includes(value)) {
                        await submit.reply({content: `That's already in ${category}.`, ephemeral: true})
                        return
                    }

                    setConfig("status", {...config.status, [category]: [...list, value]})
                    await submit.deferUpdate()
                    await msg.edit(await buildPanel(client))
                } catch (e) {}
            }

            if (btn.customId == "status_remove") {
                const modal = new ModalBuilder()
                    .setCustomId("status_remove_modal")
                    .setTitle("Remove from Pool")
                    .addComponents(
                        new ActionRowBuilder<TextInputBuilder>().addComponents(
                            new TextInputBuilder()
                                .setCustomId("category")
                                .setLabel("Category (actions/suffixes/users)")
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        ),
                        new ActionRowBuilder<TextInputBuilder>().addComponents(
                            new TextInputBuilder()
                                .setCustomId("value")
                                .setLabel("Value to remove")
                                .setStyle(TextInputStyle.Short)
                                .setRequired(true)
                        ),
                    )

                await btn.showModal(modal)
                try {
                    const submit = await btn.awaitModalSubmit({time: 60_000})
                    const category = submit.fields.getTextInputValue("category").toLowerCase()
                    const value = submit.fields.getTextInputValue("value")

                    if (!["actions", "suffixes", "users"].includes(category)) {
                        await submit.reply({content: "Invalid category. Use actions, suffixes, or users.", ephemeral: true})
                        return
                    }

                    const config = getConfig()
                    const list = config.status[category]

                    if (!list.includes(value)) {
                        await submit.reply({content: `That's not in ${category}.`, ephemeral: true})
                        return
                    }

                    setConfig("status", {...config.status, [category]: list.filter(v => v !== value)})
                    await submit.deferUpdate()
                    await msg.edit(await buildPanel(client))
                } catch (e) {}
            }
        })

        collector.on('end', async () => {
            const panel = await buildPanel(client)
            panel.components.forEach(row => row.components.forEach(b => b.setDisabled(true)))
            await msg.edit(panel).catch(() => {})
        })
    }
}

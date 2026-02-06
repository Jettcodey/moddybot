/** @jsx h */
/** @jsxFrag Fragment */

import {
    Client,
    GatewayIntentBits,
    ChannelType,
    type GuildMember,
    type Interaction,
    type Snowflake,
    type TextChannel,
    type ThreadChannel,
    type ForumChannel, REST, Routes, Activity,
} from "discord.js";
import { Commands } from "@/commands/index.ts";
import { Author, buildEmbed, Embed, Field, Footer, h, Fragment, deployCommands } from "@/helpers/index.tsx";
import Events from "@/events/index.ts";
import {LogAPI} from "@/utils/logger.ts";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

const commands = new Commands();
const eventsManager = new Events();

client.on('clientReady', async () => {
    LogAPI.log('Ready!');
    await deployCommands(commands);
    await eventsManager.loadEvents();

    client && client.user!.setPresence({
        status: "online",
        activities: [{
            name: "Watching Skript",
        }]
    })

    eventsManager.getEvents().forEach(event => {
        client.on(event.name, event.execute)
    })
});

client.on("threadCreate", async (thread: ThreadChannel, newlyCreated: boolean) => {
    if (thread.parent?.id == process.env.CREATE_THREAD_ID) {
        const forumChannel = await client.channels.fetch(process.env.THREAD_CREATION_ALERT_ID as Snowflake) as ForumChannel;

        if (forumChannel?.type === ChannelType.GuildForum) {
            const alertEmbed = buildEmbed(
                <Embed
                    title="New Mod Released"
                    description={`A new mod has been posted. Please determine if the publisher has the role or not. Use /modder <user> to give the user the verified role.`}
                    color={0x5865F2}
                >
                    <Field name="Thread Name" value={thread.name} inline={true} />
                    <Field name="Link" value={`<#${thread.id}>`} inline={true} />
                    <Field name="Created By" value={`<@${thread.ownerId}>`} inline={true} />
                </Embed>
            );

            await forumChannel.threads.create({
                name: `New Mod Release: ${thread.name}`,
                message: {
                    embeds: [alertEmbed],
                },
            });
        }
    }
});

client.on("interactionCreate", async (interaction: Interaction) => {
    if (interaction.isAutocomplete()) {
        const command = commands.getCommand(interaction.commandName);
        if (command?.autocomplete) {
            await command.autocomplete(client, interaction);
        }
        return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = commands.getCommand(interaction.commandName);
    if (command) {
        const hasPermission = await command.permissionCheck!(client, interaction);
        if (!hasPermission.result) {
            return await interaction.reply({content: hasPermission.message, embeds: hasPermission.embeds, ephemeral: hasPermission.hide || false});
        }
        await command.execute(client, interaction);
    }
})

client.on('guildMemberAdd', async (member: GuildMember) => {
    const welcomeChannel = client.channels.cache.get(process.env.WELCOME_CHANNEL_ID as Snowflake) as TextChannel

    if (welcomeChannel?.isTextBased())
    {
        const joinDate = new Date();
        const welcomeEmbed = buildEmbed(
            <Embed
                description={"Welcome to the **R.E.P.O Modding Server!**"}
                image={"https://media.discordapp.net/attachments/871531251918581831/1344567517774876762/Untitledvideo-MadewithClipchamp1-ezgif.com-cut.gif?width=880&height=495"}
                color={"#ff8000"}
            >
                <Author name={`${member.user.globalName} - ${member.user.id}`} iconURL={member.user.displayAvatarURL()} />
                <Field inline={false} name={"📌 Read rules!"} value={"Reading rules is very important. So do it https://canary.discord.com/channels/1344557689979670578/1344560754937958432"}/>
                <Field inline={false} name={"🔗 Looking for sick mods?"} value={"Go check out [ThunderStore](https://thunderstore.io/c/repo/) or look at https://canary.discord.com/channels/1344557689979670578/1347090075745255556"}/>
                <Field inline={false} name={"🍻 Becoming a Developer?"} value={"Go check out https://canary.discord.com/channels/1344557689979670578/1347090075745255556"}/>
                <Field inline={false} name={"🌍 Language Barrier"} value={"Unfortunately, this server only mostly supports English, so please try your hardest or use a translator!"}/>
                <Footer text={`Welcome to our community! Enjoy your stay - Today at ${joinDate.toLocaleDateString()}`} />
            </Embed>
        )

        await welcomeChannel.send({
            content: `<@${member.user.id}>`,
            embeds: [
                welcomeEmbed
            ]
        });
    }
})


// const rest = new REST().setToken(process.env.TOKEN);
// rest.post(Routes.channelMessages('1347239563294146652'), {
//     body: {
//         content: '<:kibby:1440145089715376280>',
//         flags: 0,
//         tts: false
//     }
// });

await client.login(process.env.TOKEN)
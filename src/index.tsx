/** @jsx h */
/** @jsxFrag Fragment */

import {
    Client,
    GatewayIntentBits,
    type GuildMember, type Interaction,
    type Message, SectionBuilder,
    type Snowflake,
    type TextChannel, type ThreadChannel
} from "discord.js"
import { ChannelType, type ForumChannel } from "discord.js";
import {Commands} from "./commands";
import {Author, buildEmbed, Embed, Field, Footer, h, Fragment, deployCommands} from "./helpers";
import Events from "./events";

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
    console.log('Ready!');
    await deployCommands(commands);
    await eventsManager.loadEvents();

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
    if (!interaction.isCommand()) return;

    const interactionExport = commands.getCommand(interaction.commandName);
    if (interactionExport) {
        await interactionExport.execute(client, interaction);
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

await client.login(process.env.TOKEN)
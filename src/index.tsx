/** @jsx h */
/** @jsxFrag Fragment */

import {
    Client,
    GatewayIntentBits,
    ChannelType,
    type Interaction,
    type Snowflake,
    type ThreadChannel,
    type ForumChannel,
} from "discord.js";
import {Commands} from "@/commands/index.ts";
import {Author, buildEmbed, Embed, Field, Footer, h, Fragment, deployCommands} from "@/helpers/index.tsx";
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

await eventsManager.loadEvents();
eventsManager.getEvents().forEach(event => {
    client.on(event.name, event.execute)
})

client.on('clientReady', async () => {
    LogAPI.log('Ready!');
    await deployCommands(commands);
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
                    <Field name="Thread Name" value={thread.name} inline={true}/>
                    <Field name="Link" value={`<#${thread.id}>`} inline={true}/>
                    <Field name="Created By" value={`<@${thread.ownerId}>`} inline={true}/>
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

    if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
        const command = commands.getCommand(interaction.commandName);
        if (command) {
            if (command.permissionCheck) {
                const hasPermission = await command.permissionCheck(client, interaction);
                if (!hasPermission.result) {
                    return await interaction.reply({
                        content: hasPermission.message,
                        embeds: hasPermission.embeds,
                        ephemeral: hasPermission.hide || false
                    });
                }
            }
            await command.execute(client, interaction);
        }
    }
});

// const rest = new REST().setToken(process.env.TOKEN);
// rest.post(Routes.channelMessages('1347239563294146652'), {
//     body: {
//         content: '<:kibby:1440145089715376280>',
//         flags: 0,
//         tts: false
//     }
// });

await client.login(process.env.TOKEN)
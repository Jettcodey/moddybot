/** @jsx h */
/** @jsxFrag Fragment */

import {type CommandInteraction, type Message, Snowflake, type TextChannel} from "discord.js";
import {buildEmbed, Field, getConfig, Fragment, h} from "../helpers";
import {Embed} from '../helpers'
const urlRegex = /https?:\/\/[^\s]+/gi;

export default {
    name: "messageCreate",
    async execute(message: Message) {
        const badLinks = getConfig().links
        if (!message.guild || !badLinks) return;

        const foundUrls = message.content.match(urlRegex);
        if (!foundUrls) return;

        const hasBadLink = foundUrls.some(url =>
            badLinks.some(badLink => url.includes(badLink))
        );
        if (!hasBadLink) return;

        try {
            await message.delete();
            const alertChannel = message.guild.channels.cache.get(process.env.ALERT_CHANNEL_ID as Snowflake) as TextChannel
            if (alertChannel) {
                await alertChannel.send({
                    embeds: [
                        buildEmbed(
                            <Embed title={"Disallowed link"} description={foundUrls.join(", ")}>
                                <Field name={"User"} value={`<@${message.author.id}>`}/>
                            </Embed>
                        )
                    ]
                })
            }
        } catch (e) {
            console.log(e);
        }
    }
}
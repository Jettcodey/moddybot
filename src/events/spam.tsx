/** @jsx h */
/** @jsxFrag Fragment */

import type {Message, Snowflake, TextChannel} from "discord.js";
import {buildEmbed, Field, Fragment, h, Embed} from "@/helpers/index.tsx";
import {getConfig} from "@/utils/config.ts";
import type {Event} from "@/types/index.ts";
import {LogAPI} from "@/utils/logger.ts";

const urlRegex = /https?:\/\/\S+/gi;

export default {
    name: "messageCreate",
    async execute(message: Message) {
        const badLinks: string[] = getConfig().links;
        if (!message.guild || !badLinks) return;

        const foundUrls = message.content.match(urlRegex);
        if (!foundUrls) return;

        const hasBadLink = foundUrls.some(url =>
            badLinks.some(badLink => url.includes(badLink))
        );
        if (!hasBadLink) return;

        const linkEmbed = buildEmbed(
            <Embed title={"Disallowed link"} description={foundUrls.join(", ")}>
                <Field name={"User"} value={`<@${message.author.id}>`}/>
            </Embed>
        );

        try {
            await message.delete();
            const alertChannel = message.guild.channels.cache.get(process.env.ALERT_CHANNEL_ID) as TextChannel;
            if (alertChannel) {
                await alertChannel.send({
                    embeds: [linkEmbed],
                });
            }
        } catch (e) {
            LogAPI.log(e);
        }
    }
} satisfies Event<"messageCreate">

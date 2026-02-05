import {EmbedBuilder, type ColorResolvable, REST} from "discord.js";
import { Routes } from 'discord.js';
import { Commands } from '../commands';
import path from "node:path";
import fs from "node:fs";

export function h(type: any, props: any, ...children: any[]) {
    if (typeof type === 'function') {
        return type({ ...props, children });
    }
    return { type, props: { ...props, children } };
}

export const Fragment = Symbol('Fragment');

interface EmbedProps {
    title?: string;
    description?: string;
    color?: ColorResolvable;
    url?: string;
    timestamp?: Date | boolean;
    thumbnail?: string;
    image?: string;
    children?: React.ReactNode;
}

interface FieldProps {
    name: string;
    value: string;
    inline?: boolean;
}

interface FooterProps {
    text: string;
    iconURL?: string;
}

interface AuthorProps {
    name: string;
    iconURL?: string;
    url?: string;
}

export function Embed(props: EmbedProps) {
    return props;
}

export function Field(props: FieldProps) {
    return props;
}

export function Footer(props: FooterProps) {
    return props;
}

export function Author(props: AuthorProps) {
    return props;
}

export function buildEmbed(element: any): EmbedBuilder {
    const embed = new EmbedBuilder();

    if (!element) return embed;

    const props = element.props || element;

    if (props.title) embed.setTitle(props.title);
    if (props.description) embed.setDescription(props.description);
    if (props.color) embed.setColor(props.color);
    if (props.url) embed.setURL(props.url);
    if (props.thumbnail) embed.setThumbnail(props.thumbnail);
    if (props.image) embed.setImage(props.image);

    if (props.timestamp) {
        embed.setTimestamp(props.timestamp === true ? new Date() : props.timestamp);
    }

    if (props.children) {
        const children = Array.isArray(props.children) ? props.children : [props.children];

        for (const child of children) {
            if (!child) continue;

            const childProps = child.props || child;

            if (childProps.text && !childProps.value) {
                embed.setFooter({
                    text: childProps.text,
                    iconURL: childProps.iconURL,
                });
            } else if (childProps.name && childProps.value) {
                embed.addFields({
                    name: childProps.name,
                    value: childProps.value,
                    inline: childProps.inline || false,
                });
            } else if (childProps.name && !childProps.value) {
                embed.setAuthor({
                    name: childProps.name,
                    iconURL: childProps.iconURL,
                    url: childProps.url,
                });
            }
        }
    }

    return embed;
}

export async function deployCommands(manager) {
    await manager.loadCommands();

    const commandsData = manager.getAllCommands().map(cmd => cmd.data.toJSON());

    const rest = new REST().setToken(process.env.TOKEN!);

    try {
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!),
            { body: commandsData },
        );

        console.log('Refreshed all commands.');
    } catch (error) {
        console.error(error);
    }
}

const configPath = path.join(__dirname, "../config.json");

export function getConfig()
{
    const data = fs.readFileSync(configPath, "utf8");
    return JSON.parse(data);
}

export function setConfig(key: string, value: string)
{
    const config = getConfig();
    config[key] = value;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
import {
    SlashCommandBuilder,
    Client,
    ChatInputCommandInteraction,
    FileBuilder,
    Attachment,
    AttachmentBuilder
} from 'discord.js';
// @ts-ignore
import AdmZip from 'adm-zip';
// @ts-ignore
import * as yaml from 'js-yaml';
import {Buffer} from 'node:buffer';
import {buildEmbed, Embed, Field, Footer, h, Fragment} from "@/helpers";

const PROFILE_DATA_PREFIX = "#r2modman";

interface ModVersion {
    major: number;
    minor: number;
    patch: number;
}

interface Mod {
    name: string;
    version: ModVersion;
    enabled: boolean;
}

interface ProfileData {
    profileName: string;
    mods: Mod[];
    community: string;
    ignoredUpdates: any[];
}

function isProfileDataValid(profileData: string): boolean {
    return profileData.startsWith(PROFILE_DATA_PREFIX);
}

async function decodeAndExtractProfile(profileData: string): Promise<AdmZip> {
    if (!isProfileDataValid(profileData)) {
        throw new Error("Invalid profile data - missing #r2modman prefix");
    }

    const b64 = profileData.substring(PROFILE_DATA_PREFIX.length).trim();
    const decoded = Buffer.from(b64, "base64");
    return new AdmZip(decoded);
}

export default {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("Search for a specific modpack on thunderstore")
        .addStringOption(op => op
            .setName("code")
            .setDescription("UUID/modpack code")
            .setRequired(true)
        ),

    permissionCheck: () => ({result: true}),

    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const profileCode = interaction.options.getString("code");

        if (!profileCode) {
            await interaction.reply({
                content: "Not a valid profile code",
                ephemeral: true
            });
            return;
        }

        await interaction.deferReply();

        try {
            const response = await fetch(
                `https://thunderstore.io/api/experimental/legacyprofile/get/${profileCode}/`
            );

            if (!response.ok) {
                await interaction.editReply({
                    content: `Failed to fetch profile: ${response.status} ${response.statusText}`
                });
                return;
            }

            const data = await response.text();
            const zip = await decodeAndExtractProfile(data);
            const zipEntries = zip.getEntries();

            const yamlEntry = zipEntries.find((entry: { entryName: string; }) =>
                entry.entryName.endsWith('.r2x') ||
                entry.entryName.endsWith('.yml') ||
                entry.entryName.endsWith('.yaml')
            );

            if (!yamlEntry) {
                await interaction.editReply({
                    content: "No YAML profile file found in the archive. Is this a valid import code?"
                });
                return;
            }

            const yamlContent = yamlEntry.getData().toString('utf-8');
            const profileData = yaml.load(yamlContent) as ProfileData;

            const enabledMods = profileData.mods.filter(mod => mod.enabled);

            /*const jsonData = enabledMods.map(mod => ({
                name: mod.name,
                version: `${mod.version.major}.${mod.version.minor}.${mod.version.patch}`,
                enabled: enabledMods.includes(mod),
            }))

            const JSONFile = new AttachmentBuilder(Buffer.from(JSON.stringify(jsonData, null, 2)), {name: 'mods.json'})*/

            const textContent = enabledMods.map(mod =>
                `${mod.name}, ${mod.version.major}.${mod.version.minor}.${mod.version.patch}`
            ).join('\n');

            const TextFile = new AttachmentBuilder(
                Buffer.from(textContent, 'utf-8'),
                { name: 'mods.txt' }
            );

            const b64 = data.substring(PROFILE_DATA_PREFIX.length).trim();
            const zipBuffer = Buffer.from(b64, "base64");

            const ZipFile = new AttachmentBuilder(
                zipBuffer,
                { name: `${profileData.profileName.replace(/\s+/g, '_')}.r2z` }
            );

            await interaction.editReply({
                embeds: [
                    buildEmbed(
                        <Embed color={0x5865F2} title={`Profile ${profileData.profileName}`}>
                            <Field inline={true} name={"Total Mods"} value={profileData.mods.length.toString()}/>
                            <Field inline={true} name={"Enabled Mods"} value={enabledMods.length.toString()}/>
                            <Footer text={`Profile Code: ${profileCode}`}/>
                        </Embed>
                    )
                ],
                files: [TextFile, ZipFile],
            });


        } catch (error) {
            console.error('Error processing profile:', error);
            await interaction.editReply({
                content: `Error processing profile: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
    }
}
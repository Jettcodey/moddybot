import {type ChatInputCommandInteraction, type Client, SlashCommandBuilder} from "discord.js";
import type { Command } from "@/types";
import {Author, buildEmbed, Embed, Field, h, makeUrl} from "@/helpers";
import {check} from "@/commands/defaults";

type ThunderstorePackage = {
    namespace: string;
    name: string;
    full_name: string;
    owner: string;
    package_url: string;
    date_created: string;
    date_updated: string;
    rating_score: number;
    is_pinned: boolean;
    is_deprecated: boolean;
    total_downloads: number;
    latest: PackageVersion;
    community_listings: CommunityListing[];
};

type PackageVersion = {
    namespace: string;
    name: string;
    version_number: string;
    full_name: string;
    description: string;
    icon: string;
    dependencies: string[];
    download_url: string;
    downloads: number;
    date_created: string;
    website_url: string;
    is_active: boolean;
};

type CommunityListing = {
    has_nsfw_content: boolean;
    categories: string[];
    community: string;
    review_status: string;
};

export default {
    data: new SlashCommandBuilder()
        .setName("search")
        .setDescription("search for a specific package").addStringOption(op => op.setName("namespace").setDescription("author name")).addStringOption(op => op.setName("package").setDescription("package name")),

    permissionCheck: check,

    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const owner = interaction.options.getString("namespace")
        const packageName = interaction.options.getString("package")

        if (!owner || !packageName) return;

        const url = makeUrl('package', owner, packageName)
        const response = await fetch(url);
        const packageData: ThunderstorePackage = await response.json();

        await interaction.reply({
            embeds: [
                buildEmbed(
                    <Embed title={"ThunderStore package"}>
                        <Author name={packageData.owner} iconURL={packageData.latest.icon}/>
                        <Field name={"Download"} value={packageData.package_url}/>
                    </Embed>
                )
            ]
        })
    }
};

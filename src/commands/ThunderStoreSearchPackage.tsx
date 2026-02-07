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

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatNumber(num: number): string {
    return num.toLocaleString('en-US');
}

export default {
    data: new SlashCommandBuilder()
        .setName("search")
        .setDescription("Search for a specific package on Thunderstore")
        .addStringOption(op => op
            .setName("namespace")
            .setDescription("Author/namespace name")
            .setRequired(true)
        )
        .addStringOption(op => op
            .setName("package")
            .setDescription("Package name")
            .setRequired(true)
        ),

    permissionCheck: check,

    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const owner = interaction.options.getString("namespace", true);
        const packageName = interaction.options.getString("package", true);

        await interaction.deferReply();

        const url = makeUrl('package', owner, packageName);

        try {
            const response = await fetch(url);

            if (!response.ok) {
                await interaction.editReply({
                    content: `❌ Package not found: \`${owner}/${packageName}\`\nMake sure the namespace and package name are correct.`,
                });
                return;
            }

            const packageData = await response.json() as ThunderstorePackage;

            const categories = packageData.community_listings[0]?.categories.join(', ') || 'None';
            const dependencies = packageData.latest.dependencies.length;
            const isDeprecated = packageData.is_deprecated ? '⚠️ **DEPRECATED**' : '';

            await interaction.editReply({
                embeds: [
                    buildEmbed(
                        <Embed
                            title={packageData.full_name}
                            url={packageData.package_url}
                            description={packageData.latest.description}
                            color={packageData.is_deprecated ? 0xFF6B6B : 0x5865F2}
                            thumbnail={packageData.latest.icon}
                        >
                            <Author
                                name={`By ${packageData.owner}`}
                                iconURL={packageData.latest.icon}
                                url={`https://thunderstore.io/package/${packageData.owner}/`}
                            />

                            <Field
                                name="Version"
                                value={packageData.latest.version_number}
                                inline={true}
                            />
                            <Field
                                name="⬇Downloads"
                                value={formatNumber(packageData.latest.downloads)}
                                inline={true}
                            />
                            <Field
                                name="Dependencies"
                                value={dependencies.toString()}
                                inline={true}
                            />

                            <Field
                                name="🏷Categories"
                                value={categories}
                                inline={false}
                            />

                            <Field
                                name="Last Updated"
                                value={formatDate(packageData.date_updated)}
                                inline={true}
                            />
                            <Field
                                name="Created"
                                value={formatDate(packageData.date_created)}
                                inline={true}
                            />

                            {packageData.latest.website_url && (
                                <Field
                                    name="Links"
                                    value={`[Website](${packageData.latest.website_url}) • [Download](${packageData.latest.download_url})`}
                                    inline={false}
                                />
                            )}

                            {isDeprecated && (
                                <Field
                                    name="Status"
                                    value={isDeprecated}
                                    inline={false}
                                />
                            )}
                        </Embed>
                    )
                ]
            });

        } catch (error) {
            await interaction.editReply({
                content: `❌ Failed to fetch package: ${error instanceof Error ? error.message : 'Unknown error'}\n\nURL attempted: ${url}`,
            });
        }
    }
} satisfies Command;
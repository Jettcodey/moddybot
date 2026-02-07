import {
    type AutocompleteInteraction,
    type ChatInputCommandInteraction,
    type Client,
    SlashCommandBuilder
} from "discord.js";
import type { Command } from "@/types";
import {Author, buildEmbed, Embed, Field, h, makeUrl, Fragment, Footer} from "@/helpers";
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

type ThunderstoreListingResponse = {
    count: number;
    next: string | null;
    previous: string | null;
    results: ThunderstoreListingItem[];
};

type ThunderstoreListingItem = {
    categories: Category[];
    community_identifier: string;
    description: string;
    download_count: number;
    icon_url: string;
    is_deprecated: boolean;
    is_nsfw: boolean;
    is_pinned: boolean;
    last_updated: string;
    name: string;
    namespace: string;
    rating_count: number;
    size: number;
    datetime_created: string;
};

type Category = {
    id: string;
    name: string;
    slug: string;
};

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatNumber(num: number): string {
    return num.toLocaleString('en-US');
}

// 753 can probably tell that im running this outside the browser. so lets spoof it.
async function thunderstoreFetch<T>(url: string): Promise<T> {
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
    ];

    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    const response = await fetch(url, {
        method: 'GET',
        // @ts-ignore
        headers: {
            'User-Agent': randomUserAgent,
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': 'https://thunderstore.io/',
            'Origin': 'https://thunderstore.io'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json() as T;
}

export default {
    data: new SlashCommandBuilder()
        .setName("search")
        .setDescription("Search for a specific package on Thunderstore")
        .addStringOption(op => op
            .setName("namespace")
            .setDescription("Author/namespace name or package name")
            .setRequired(true)
        )
        .addStringOption(op => op
            .setName("package")
            .setDescription("Package name")
            .setRequired(false)
        ),

    permissionCheck: () => ({result: true}),

    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        const owner = interaction.options.getString("namespace", true);
        const packageName = interaction.options.getString("package", false);

        await interaction.deferReply();

        if (!packageName) {
            try {
                const data = await thunderstoreFetch<ThunderstoreListingResponse>(
                    `https://thunderstore.io/api/cyberstorm/listing/repo/?q=${encodeURIComponent(owner)}`
                );

                if (data.results.length === 0) {
                    await interaction.editReply({
                        content: `No packages found for: \`${owner}\``,
                    });
                    return;
                }

                const embed = buildEmbed(
                    <Embed
                        title={`📦 Packages by ${owner}`}
                        description={`Found ${data.results.length} package${data.results.length !== 1 ? 's' : ''}`}
                        color={0x5865F2}
                    >
                        {data.results.slice(0, 25).map(x => (
                            <Field
                                key={x.name}
                                name={`${x.name} - ${x.namespace}`}
                                value={`${formatNumber(x.download_count)} Downloads • ${x.rating_count} Ratings\n[View on Thunderstore](https://thunderstore.io/c/repo/p/${x.namespace}/${x.name}/)`}
                                inline={false}
                            />
                        ))}
                        {data.results.length > 25 && (
                            <Footer text={`Showing 25 of ${data.results.length} results • Visit Thunderstore for more`} />
                        )}
                    </Embed>
                );

                return await interaction.editReply({
                    embeds: [embed]
                });

            } catch (error) {
                await interaction.editReply({
                    content: `Failed to search for packages: ${error instanceof Error ? error.message : 'Unknown error'}`,
                });
                return;
            }
        }

        const url = makeUrl('package', owner, packageName);

        try {
            const packageData = await thunderstoreFetch<ThunderstorePackage>(url);

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
                                name="Downloads"
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
                content: `Failed to fetch package: ${error instanceof Error ? error.message : 'Unknown error'}\n\nURL attempted: ${url}`,
            });
        }
    }
}
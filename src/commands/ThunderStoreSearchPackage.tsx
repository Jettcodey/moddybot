import {
    type AutocompleteInteraction,
    type ChatInputCommandInteraction,
    type Client,
    SlashCommandBuilder
} from "discord.js";
import type {Command} from "@/types";
import {Author, buildEmbed, Embed, Field, h, makeUrl, Fragment, Footer} from "@/helpers";
import {check} from "@/commands/defaults";

type ThunderstoreListingPackage = {
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
    download_count: number;
    rating_count: number;
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
    results: ThunderstoreListingPackage[];
};

interface ThunderstoreCategory {
    id: string;
    name: string;
    slug: string;
}

interface ThunderstoreDependency {
    community_identifier: string;
    description: string;
    icon_url: string;
    is_active: boolean;
    name: string;
    namespace: string;
    version_number: string;
    is_removed: boolean;
    is_unavailable: boolean;
}

interface ThunderstoreTeam {
    name: string;
    members: any[];
}

interface ThunderstorePackage {
    categories: ThunderstoreCategory[];
    community_identifier: string;
    community_name: string;
    datetime_created: string;
    dependant_count: number;
    dependencies: ThunderstoreDependency[];
    dependency_count: number;
    description: string;
    download_count: number;
    download_url: string;
    full_version_name: string;
    has_changelog: boolean;
    icon_url: string;
    install_url: string;
    is_deprecated: boolean;
    is_nsfw: boolean;
    is_pinned: boolean;
    last_updated: string;
    latest_version_number: string;
    name: string;
    namespace: string;
    rating_count: number;
    size: number;
    team: ThunderstoreTeam;
    version_count: number;
    website_url: string;
}

type Category = {
    id: string;
    name: string;
    slug: string;
};

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {year: 'numeric', month: 'short', day: 'numeric'});
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
            .setDescription("Author/namespace name or package name or a URL to the package")
            .setRequired(true)
        )
        .addStringOption(op => op
            .setName("package")
            .setDescription("Package name")
            .setRequired(false)
        ).addBooleanOption(op => op.setName("fuzz").setDescription("fuzz searching").setRequired(false)),

    permissionCheck: () => ({result: true}),

    async execute(client: Client, interaction: ChatInputCommandInteraction) {
        let owner = interaction.options.getString("namespace", true);
        let packageName = interaction.options.getString("package", false);
        let shouldFuzz = interaction.options.getBoolean("fuzz", false);

        if (owner.startsWith("https://thunderstore.io")) {
            const urlSplit = owner.split('/').filter(x => x)
            owner = urlSplit[urlSplit.length - 2]
            packageName = urlSplit[urlSplit.length - 1]
        }

        await interaction.deferReply();

        try {
            const data = await thunderstoreFetch<ThunderstoreListingResponse>(
                `https://thunderstore.io/api/cyberstorm/listing/repo/?q=${encodeURIComponent(owner)}`
            );

            if (data.results.length === 0) {
                await interaction.editReply({content: `No packages found for: \`${owner}\``});
                return;
            }

            if (!packageName || shouldFuzz) {
                const embed = buildEmbed(
                    <Embed
                        title={`Packages by ${owner}`}
                        description={`Found ${data.results.length} package${data.results.length !== 1 ? 's' : ''}`}
                        color={0x5865F2}
                    >
                        {data.results.slice(0, 25).map((x, index) => (
                            <Field
                                name={`${x.name} - ${x.namespace}`}
                                value={`${formatNumber(x.download_count)} Downloads • ${x.rating_count} Ratings\n[View on Thunderstore](https://thunderstore.io/c/repo/p/${x.namespace}/${x.name}/)`}
                                inline={(index % 2 !== 2)}
                            />
                        ))}
                        {data.results.length > 25 && (
                            <Footer
                                text={`Showing 25 of ${data.results.length} results • Visit Thunderstore for more`}/>
                        )}
                    </Embed>
                );
                return await interaction.editReply({embeds: [embed]});
            }

            const matchingPackage = data.results.find(pkg =>
                pkg.name.toLowerCase().includes(packageName.toLowerCase())
            );

            /*if (!matchingPackage) {
                await interaction.editReply({
                    content: `No package matching "${packageName}" found for namespace: \`${owner}\``
                });
                return;
            }*/

            const url = `https://thunderstore.io/api/cyberstorm/listing/repo/${matchingPackage?.namespace ?? owner}/${matchingPackage?.name ?? packageName}`;
            let packageData = await thunderstoreFetch<ThunderstorePackage>(url);

            if (!packageData)
            {
                packageData = await thunderstoreFetch<ThunderstorePackage>(`https://thunderstore.io/api/experimental/package/${matchingPackage?.namespace ?? owner}/${matchingPackage?.name ?? packageName}`);
            }

            const categories = packageData.categories.map(x=>x.name).join(', ') || 'None';
            const dependencies = packageData.dependencies.map(x=>x.name).join(', ') || 'None';
            const isDeprecated = packageData.is_deprecated ? '**DEPRECATED**' : '';

            await interaction.editReply({
                embeds: [
                    buildEmbed(
                        <Embed
                            title={packageData.name}
                            url={`https://thunderstore.io/c/repo/p/${packageData.namespace}/${packageData.name}/`}
                            description={packageData.description}
                            color={packageData.is_deprecated ? 0xFF6B6B : 0x5865F2}
                            thumbnail={packageData.icon_url}
                        >
                            <Author
                                name={`By ${packageData.namespace}`}
                                iconURL={packageData.icon_url}
                                url={`https://thunderstore.io/c/repo/p/${packageData.namespace}/${packageData.name}/`}
                            />
                            <Field name="Downloads" value={formatNumber(packageData.download_count)} inline={true}/>
                            <Field name="Dependencies" value={dependencies.toString()} inline={true}/>
                            <Field name="Categories" value={categories} inline={false}/>
                            <Field name="Last Updated" value={formatDate(packageData.last_updated)} inline={true}/>
                            <Field name="Created" value={formatDate(packageData.datetime_created)} inline={true}/>
                            <Field name="Version" value={packageData.latest_version_number} inline={true}/>
                            {packageData.website_url && (
                                <Field
                                    name="Links"
                                    value={`[Website](${packageData.website_url}) • [Download](${packageData.download_url})`}
                                    inline={false}
                                />
                            )}
                            {isDeprecated && <Field name="Status" value={isDeprecated} inline={false}/>}
                        </Embed>
                    )
                ]
            });

        } catch (error) {
            await interaction.editReply({
                content: `Failed to fetch package: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
    }
}
import { PartialTextBasedChannelFields, RichEmbed } from "discord.js";
import * as derpibooru from "node-derpi";

export async function getDerpiPage(page: number, derpiOptions: derpibooru.SearchOptions) {
    derpiOptions.page = page;
    derpiOptions.perPage = 50;

    const searchResults = await derpibooru.Fetch.search(derpiOptions);

    return searchResults.images;
}

export function getImageEmbed(image: derpibooru.Image): RichEmbed {
    const author: string = image.artistName || "<unknown>";
    const description: string = `Author: **${author}**`;
    const stats: string = `Favorites: ${image.favorites}, Score: ${image.score}, \
Upvotes: ${image.upvotes}, Downvotes: ${image.downvotes}`;
    const source: string = image.source || "<unknown>";
    const url: string = `https://derpibooru.org/${image.id}`;

    const embed = new RichEmbed()
        .setColor(0xE681D0)
        .setDescription(description)
        .addField("Stats", stats)
        .addField("Source", source)
        .setImage(image.representations.medium)
        .setTitle(url)
        .setURL(url);

    return embed;
}

function getRating(image: derpibooru.Image): number {
    // SFW = 0, Suggestive = 1, NSFW = 2
    const nsfwTags = ["explicit", "questionable"];
    const suggestiveTags = ["suggestive"];

    // const tags = await image.tags();
    const tags = image.tagNames;
    let explicit = false;
    let suggestive = false;

    console.log(`Tags: ${tags}`);

    for (const tag of tags) {
        if (nsfwTags.includes(tag)) {
            // We can short-circuit out on NSFW tags
            console.log("explicit");
            explicit = true;
            return 2;
        }

        // It is at least suggestive
        if (suggestiveTags.includes(tag)) {
            suggestive = true;
        }
    }

    return suggestive ? 1 : 0;
}

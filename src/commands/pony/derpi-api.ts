import { PartialTextBasedChannelFields } from "discord.js";
import * as derpibooru from "node-derpi";

const nsfwImageResults: derpibooru.Image[] = [];
const safeImageResults: derpibooru.Image[] = [];
const suggestiveImageResults: derpibooru.Image[] = [];
let cacheExpires: Date = new Date();

export async function sendSafeTopImage(
    channels: PartialTextBasedChannelFields[],
    ignoreIds: number[],
    ): Promise<derpibooru.Image | undefined> {
    // We're just fetching the top scoring from the last few days, this
    // should be made to actually query based on arguments passed in
    const derpiOptions: derpibooru.SearchOptions = {
        filterID: derpibooru.DefaultFilters.DEFAULT,
        query: "first_seen_at.gt:3 days ago && !suggestive",
        sortFormat: derpibooru.ResultSortFormat.SCORE,
    };

    return sendTopImage(channels, derpiOptions, safeImageResults, ignoreIds);
}

export async function sendSuggestiveTopImage(
    channels: PartialTextBasedChannelFields[],
    ignoreIds: number[],
    ): Promise<derpibooru.Image | undefined> {
    // We're just fetching the top scoring from the last few days, this
    // should be made to actually query based on arguments passed in
    const derpiOptions: derpibooru.SearchOptions = {
        filterID: derpibooru.DefaultFilters.DEFAULT,
        query: "first_seen_at.gt:3 days ago && suggestive",
        sortFormat: derpibooru.ResultSortFormat.SCORE,
    };

    return sendTopImage(channels, derpiOptions, suggestiveImageResults, ignoreIds);
}

export async function sendNsfwTopImage(
    channels: PartialTextBasedChannelFields[],
    ignoreIds: number[],
    ): Promise<derpibooru.Image | undefined> {
    // We're just fetching the top scoring from the last few days, this
    // should be made to actually query based on arguments passed in
    const derpiOptions: derpibooru.SearchOptions = {
        filterID: derpibooru.DefaultFilters.EVERYTHING,
        query: "first_seen_at.gt:3 days ago && (explicit || questionable)",
        sortFormat: derpibooru.ResultSortFormat.SCORE,
    };

    return sendTopImage(channels, derpiOptions, nsfwImageResults, ignoreIds);
}

async function getDerpiPage(page: number, derpiOptions: derpibooru.SearchOptions) {
    derpiOptions.page = page;
    const searchResults = await derpibooru.Fetch.search(derpiOptions);

    return searchResults.images;
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

function sendChannels(channels: PartialTextBasedChannelFields[], content: string) {
    channels.forEach((channel) => {
        channel.send(content);
    });
}

async function sendTopImage(
    channels: PartialTextBasedChannelFields[],
    derpiOptions: derpibooru.SearchOptions,
    imageResults: derpibooru.Image[],
    ignoreIds: number[],
    ): Promise<derpibooru.Image | undefined> {
    if (imageResults.length < 1 || Date.now() >= cacheExpires.valueOf()) {
        sendChannels(channels, "I'm fetching new ponies! Yay!");
        let newImages = await getDerpiPage(1, derpiOptions);

        // store the results as a "cache"
        let totalImages = imageResults.push(...newImages);

        // Page 1 has already been retrieved above
        let page = 2;

        // TODO: take recently seen images into the total
        while (totalImages < 120) {
            newImages = await getDerpiPage(page, derpiOptions);
            totalImages = imageResults.push(...newImages);
            page++;
        }

        sendChannels(channels, `${totalImages} ponies have arrived!`);

        const date = new Date();
        // Date.setMinutes will update correctly and not just roll over minutes
        date.setMinutes(date.getMinutes() + 120);
        cacheExpires = date;
    }

    while (imageResults.length > 0) {
        // Let's just pop images off the front of the array
        const image = imageResults.shift();

        if (image && !ignoreIds.includes(image.id)) {
            const response = `https://derpibooru.org/${image.id}`;
            sendChannels(channels, response);
            return image;
        }

        // TODO: handle what happens if we flush the entire buffer,
        // otherwise we tightly loop between fetching 120 and discarding all
        // of them as recently seen.
    }

    return undefined;
}

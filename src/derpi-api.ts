import { PartialTextBasedChannelFields } from "discord.js";
import * as derpibooru from "node-derpi";

let nsfwImageResults: derpibooru.Image[] = [];
let safeImageResults: derpibooru.Image[] = [];
let suggestiveImageResults: derpibooru.Image[] = [];
let cacheExpires: Date = new Date();

export async function sendSafeTopImage(channels: PartialTextBasedChannelFields[]) {
    // We're just fetching the top scoring from the last few days, this
    // should be made to actually query based on arguments passed in
    const derpiOptions: derpibooru.SearchOptions = {
        filterID: derpibooru.DefaultFilters.DEFAULT,
        query: "first_seen_at.gt:3 days ago && !suggestive",
        sortFormat: derpibooru.ResultSortFormat.SCORE,
    };

    if (safeImageResults.length < 1 || Date.now() >= cacheExpires.valueOf()) {
        sendChannels(channels, "I'm fetching new ponies! Yay!");
        let newImages = await getDerpiPage(1, derpiOptions);

        // store the results as a "cache"
        safeImageResults = newImages;

        // Page 1 has already been retrieved above
        let page = 2;
        let totalImages = newImages.length;

        while (totalImages < 120) {
            newImages = await getDerpiPage(page, derpiOptions);
            safeImageResults = safeImageResults.concat(newImages);

            totalImages = safeImageResults.length;
            page++;
        }

        sendChannels(channels, `${totalImages} ponies have arrived!`);

        const date = new Date();
        // Date.setMinutes will update correctly and not just roll over minutes
        date.setMinutes(date.getMinutes() + 120);
        cacheExpires = date;
    }

    if (safeImageResults.length > 0) {
        // Let's just pop images off the front of the array
        const image = safeImageResults.shift();

        if (image) {
            const response = `https://derpibooru.org/${image.id}`;

            // We don't need to worry about NSFW, since the default filter handles that
            sendChannels(channels, response);
        }
    }

    return Promise.resolve();
}

export async function sendSuggestiveTopImage(channels: PartialTextBasedChannelFields[]) {
    // We're just fetching the top scoring from the last few days, this
    // should be made to actually query based on arguments passed in
    const derpiOptions: derpibooru.SearchOptions = {
        filterID: derpibooru.DefaultFilters.DEFAULT,
        query: "first_seen_at.gt:3 days ago && suggestive",
        sortFormat: derpibooru.ResultSortFormat.SCORE,
    };

    if (suggestiveImageResults.length < 1 || Date.now() >= cacheExpires.valueOf()) {
        sendChannels(channels, "I'm fetching new ponies! Yay!");
        let newImages = await getDerpiPage(1, derpiOptions);

        // store the results as a "cache"
        suggestiveImageResults = newImages;

        // Page 1 has already been retrieved above
        let page = 2;
        let totalImages = newImages.length;

        while (totalImages < 120) {
            newImages = await getDerpiPage(page, derpiOptions);
            suggestiveImageResults = suggestiveImageResults.concat(newImages);

            totalImages = suggestiveImageResults.length;
            page++;
        }

        sendChannels(channels, `${totalImages} ponies have arrived!`);
    }

    if (suggestiveImageResults.length > 0) {
        // Let's just pop images off the front of the array
        const image = suggestiveImageResults.shift();

        if (image) {
            const response = `https://derpibooru.org/${image.id}`;

            // We don't need to worry about NSFW, since the default filter handles that
            sendChannels(channels, response);
        }
    }

    return Promise.resolve();
}

export async function sendNsfwTopImage(channels: PartialTextBasedChannelFields[]) {
    // We're just fetching the top scoring from the last few days, this
    // should be made to actually query based on arguments passed in
    const derpiOptions: derpibooru.SearchOptions = {
        filterID: derpibooru.DefaultFilters.EVERYTHING,
        query: "first_seen_at.gt:3 days ago && (explicit || questionable)",
        sortFormat: derpibooru.ResultSortFormat.SCORE,
    };

    if (nsfwImageResults.length < 1 || Date.now() >= cacheExpires.valueOf()) {
        sendChannels(channels, "I'm fetching new ponies! Yay!");
        let newImages = await getDerpiPage(1, derpiOptions);

        // store the results as a "cache"
        nsfwImageResults = newImages;

        // Page 1 has already been retrieved above
        let page = 2;
        let totalImages = newImages.length;

        while (totalImages < 120) {
            newImages = await getDerpiPage(page, derpiOptions);
            nsfwImageResults = nsfwImageResults.concat(newImages);

            totalImages = nsfwImageResults.length;
            page++;
        }

        sendChannels(channels, `${totalImages} ponies have arrived!`);
    }

    if (nsfwImageResults.length > 0) {
        // Let's just pop images off the front of the array
        const image = nsfwImageResults.shift();

        if (image) {
            const rating = getRating(image);
            const response = `https://derpibooru.org/${image.id}`;

            console.log(`Rating: ${rating}`);

            if (rating === 2) {
                sendChannels(channels, response);
            }
        }
    }

    return Promise.resolve();
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

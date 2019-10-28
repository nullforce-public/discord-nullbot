import { PartialTextBasedChannelFields } from "discord.js";
import * as derpibooru from "node-derpi";

let derpiImageResults: derpibooru.Image[] = [];
let cacheExpires: Date = new Date();

export async function sendTopImage(
    channels: PartialTextBasedChannelFields[],
    allowSuggestiveChannels: PartialTextBasedChannelFields[] = [],
    allowNsfwChannels: PartialTextBasedChannelFields[] = []) {
    // We're just fetching the top scoring from the last few days, this
    // should be made to actually query based on arguments passed in
    const derpiOptions: derpibooru.SearchOptions = {
        filterID: derpibooru.DefaultFilters.EVERYTHING,
        query: "first_seen_at.gt:3 days ago",
        sortFormat: derpibooru.ResultSortFormat.SCORE,
    };

    const allChannels = [...channels, ...allowSuggestiveChannels, ...allowNsfwChannels];

    if (derpiImageResults.length < 1 || Date.now() >= cacheExpires.valueOf()) {
        sendChannels(allChannels, "I'm fetching new ponies! Yay!");
        let searchResults = await derpibooru.Fetch.search(derpiOptions);

        // store the results as a "cache"
        derpiImageResults = searchResults.images;

        // Page 1 has already been retrieved above
        let page = 2;
        let totalImages = searchResults.images.length;

        while (totalImages < 120) {
            derpiOptions.page = page;
            searchResults = await derpibooru.Fetch.search(derpiOptions);
            derpiImageResults = derpiImageResults.concat(searchResults.images);

            totalImages = derpiImageResults.length;
            // channel.send(`Page: ${page}, ${searchResults.images.length} items, ${totalImages} total`);
            page++;
        }

        sendChannels(allChannels, `${totalImages} ponies have arrived!`);

        const date = new Date();
        // Date.setMinutes will update correctly and not just roll over minutes
        date.setMinutes(date.getMinutes() + 120);
        cacheExpires = date;
    }

    if (derpiImageResults.length > 0) {
        // Let's just pop images off the front of the array
        const image = derpiImageResults.shift();

        if (image) {
            const rating = getRating(image);
            const response = `https://derpibooru.org/${image.id}`;

            console.log(`Rating: ${rating}`);

            switch (rating) {
                case 2:
                    // Only NSFW
                    sendChannels(allowNsfwChannels, response);
                    break;
                case 1:
                    // Send Suggestive to channels that allow suggestive or NSFW
                    sendChannels(allowSuggestiveChannels, response);
                    // sendChannels(allowNsfwChannels, response);
                    break;
                case 0:
                    // Send SFW to channels that are SFW or allow suggestive
                    // sendChannels(allowSuggestiveChannels, response);
                    sendChannels(channels, response);
                    break;
            }
        }
    }

    // TODO: We don't yet need to worry about NSFW, since the default filter handles that

    return Promise.resolve();
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

    tags.forEach((tag) => {
        if (nsfwTags.includes(tag)) {
            // We can short-circuit out on NSFW tags
            console.log("explicit");
            explicit = true;
            return;
        }

        // It is at least suggestive
        if (suggestiveTags.includes(tag)) {
            suggestive = true;
        }
    });

    if (explicit) {
        return 2;
    }

    return suggestive ? 1 : 0;
}

function sendChannels(channels: PartialTextBasedChannelFields[], content: string) {
    channels.forEach((channel) => {
        channel.send(content);
    });
}

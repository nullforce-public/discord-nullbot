import { DMChannel, GroupDMChannel, TextChannel } from "discord.js";
import * as derpibooru from "node-derpi";

let derpiImageResults: derpibooru.Image[] = [];
let cacheExpires: Date = new Date();

export async function sendRandomTopImage(channel: TextChannel | DMChannel | GroupDMChannel) {
    // We're just fetching the top scoring from the last few days, this
    // should be made to actually query based on arguments passed in
    const derpiOptions: derpibooru.SearchOptions = {
        query: "first_seen_at.gt:3 days ago",
        sortFormat: derpibooru.ResultSortFormat.SCORE,
    };

    if (derpiImageResults.length < 1 || Date.now() >= cacheExpires.valueOf()) {
        channel.send("I'm fetching new ponies! Yay!");
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

        channel.send(`${totalImages} ponies have arrived!`);

        const date = new Date();
        // Date.setMinutes will update correctly and not just roll over minutes
        date.setMinutes(date.getMinutes() + 120);
        cacheExpires = date;
    }

    if (derpiImageResults.length > 0) {
        // Let's just pop images off the front of the array
        const image = derpiImageResults.shift();

        if (image) {
            channel.send(`https://derpibooru.org/${image.id}`);
        }

        // const index = Math.floor(Math.random() * derpiImageResults.length);
        // channel.send(`https://derpibooru.org/${derpiImageResults[index].id}`);
    }

    // TODO: We don't yet need to worry about NSFW, since the default filter handles that
    // channel.send("yay! ponies!");

    return Promise.resolve();
}

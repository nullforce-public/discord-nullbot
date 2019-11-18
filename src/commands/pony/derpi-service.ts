import { TextChannel } from "discord.js";
import * as derpibooru from "node-derpi";
import { NullBotClient } from "../../nullbot-client";
import { getDerpiPage, getImageEmbed } from "./derpi-api";

export class DerpiService {
    private client: NullBotClient;
    private derpiImageResults: derpibooru.Image[] = [];
    private cacheExpires: Date = new Date();

    public constructor(client: NullBotClient) {
        this.client = client;
    }

    public async sendRandomImage(channel: TextChannel) {
        // We're just fetching the top scoring from the last few days, this
        // should be made to actually query based on arguments passed in
        const derpiOptions: derpibooru.SearchOptions = {
            query: "first_seen_at.gt:3 days ago && !suggestive",
            sortFormat: derpibooru.ResultSortFormat.SCORE,
        };

        let totalImages = this.derpiImageResults.length;

        if (!this.hasImages(this.derpiImageResults)) {
            channel.send("I'm fetching new ponies! Yay!");
            totalImages = await this.fetchImages(derpiOptions, this.derpiImageResults, []);
        }

        if (totalImages > 0) {
            const index = Math.floor(Math.random() * totalImages);
            const embed = getImageEmbed(this.derpiImageResults[index]);
            return channel.send(embed);
        }

        return undefined;
    }

    private async fetchImages(
        derpiOptions: derpibooru.SearchOptions,
        imageResults: derpibooru.Image[],
        ignoreIds: number[],
    ) {
        let totalImages = this.derpiImageResults.length;

        if (totalImages < 1 || Date.now() >= this.cacheExpires.valueOf()) {
            let newImages = await getDerpiPage(1, derpiOptions);

            // Store the results as a "cache"
            totalImages = imageResults.push(...newImages);

            // Page 1 has already been retrieved above
            let page = 2;

            while (totalImages < 120) {
                newImages = await getDerpiPage(page, derpiOptions);
                totalImages = imageResults.push(...newImages);
                page++;
            }

            const date = new Date();
            // Date.setMinutes will update correctly and not just roll over minutes
            date.setMinutes(date.getMinutes() + 60);
            this.cacheExpires = date;
        }

        return totalImages;
    }

    private hasImages(imageResults: derpibooru.Image[]): boolean {
        const haveImages: boolean = imageResults.length > 0;
        const cacheExpired: boolean = Date.now() >= this.cacheExpires.valueOf();

        // If the caching period hasn't expired, we return true even when we
        // do not have images so that we don't keep fetching images constantly
        // that we've recently seen.
        return !cacheExpired || haveImages;
    }
}

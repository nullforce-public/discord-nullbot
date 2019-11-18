import { TextChannel } from "discord.js";
import * as derpibooru from "node-derpi";
import { NullBotClient } from "../../nullbot-client";
import { getDerpiPage, getImageEmbed } from "./derpi-api";

export class DerpiService {
    private client: NullBotClient;
    private nsfwImageResults: derpibooru.Image[] = [];
    private safeImageResults: derpibooru.Image[] = [];
    private suggestiveImageResults: derpibooru.Image[] = [];
    private cacheExpires: Date = new Date();

    public constructor(client: NullBotClient) {
        this.client = client;
    }

    public async sendRandomImage(
        channel: TextChannel,
        suggestive: boolean = false,
        nsfw: boolean = false,
    ): Promise<derpibooru.Image | undefined> {
        if (!this.hasImages()) {
            channel.send("I'm fetching new ponies! Yay!");
            const nsfwOptions = this.getDerpiOptions(false, true);
            const safeOptions = this.getDerpiOptions(false, false);
            const suggestiveOptions = this.getDerpiOptions(true, false);

            const promises = [];
            promises.push(this.fetchImages(nsfwOptions, this.nsfwImageResults, []));
            promises.push(this.fetchImages(safeOptions, this.safeImageResults, []));
            promises.push(this.fetchImages(suggestiveOptions, this.suggestiveImageResults, []));

            await Promise.all(promises);
        }

        let imageResults = this.safeImageResults;

        if (suggestive) {
            imageResults = this.suggestiveImageResults;
        } else if (nsfw) {
            imageResults = this.nsfwImageResults;
        }

        const image = this.getRandomImage(imageResults);
        if (image) {
            const embed = getImageEmbed(image);
            channel.send(embed);
        }

        return image;
    }

    private async fetchImages(
        derpiOptions: derpibooru.SearchOptions,
        imageResults: derpibooru.Image[],
        ignoreIds: number[],
    ) {
        let totalImages = imageResults.length;

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

    private getDerpiOptions(suggestive: boolean, nsfw: boolean): derpibooru.SearchOptions {
        let derpiOptions: derpibooru.SearchOptions = {
            filterID: derpibooru.DefaultFilters.DEFAULT,
            query: "first_seen_at.gt:3 days ago && !suggestive",
            sortFormat: derpibooru.ResultSortFormat.SCORE,
        };

        // We're just fetching the top scoring from the last few days, this
        // should be made to actually query based on arguments passed in
        if (suggestive) {
            derpiOptions = {
                filterID: derpibooru.DefaultFilters.DEFAULT,
                query: "first_seen_at.gt:3 days ago && suggestive",
                sortFormat: derpibooru.ResultSortFormat.SCORE,
            };
        } else if (nsfw) {
            derpiOptions = {
                filterID: derpibooru.DefaultFilters.EVERYTHING,
                query: "first_seen_at.gt:3 days ago && (explicit || questionable)",
                sortFormat: derpibooru.ResultSortFormat.SCORE,
            };
        }

        return derpiOptions;
    }

    private getRandomImage(
        imageResults: derpibooru.Image[],
    ): derpibooru.Image | undefined {
        const totalImages = imageResults.length;

        if (totalImages > 0) {
            const index = Math.floor(Math.random() * totalImages);
            return imageResults[index];
        }

        return undefined;
    }

    private hasImages(): boolean {
        const haveImages: boolean =
            this.nsfwImageResults.length > 0 &&
            this.safeImageResults.length > 0 &&
            this.suggestiveImageResults.length > 0;
        const cacheExpired: boolean = Date.now() >= this.cacheExpires.valueOf();

        return !cacheExpired && haveImages;
    }
}
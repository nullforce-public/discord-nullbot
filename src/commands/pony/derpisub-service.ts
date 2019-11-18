import { PartialTextBasedChannelFields, RichEmbed, TextChannel } from "discord.js";
import * as derpibooru from "node-derpi";
import { NullBotClient } from "../../nullbot-client";
import { getDerpiPage, getImageEmbed } from "./derpi-api";
import { DerpiSubRepo } from "./derpisub-data";

const nsfwImageResults: derpibooru.Image[] = [];
const safeImageResults: derpibooru.Image[] = [];
const suggestiveImageResults: derpibooru.Image[] = [];
let cacheExpires: Date = new Date();

interface IDerpiChannelSubscriptionInfo {
    allowNsfw: boolean;
    channelId: string;
    guildId: string;
}

export class DerpiSubService {
    private client: NullBotClient;
    private db: DerpiSubRepo;

    public constructor(client: NullBotClient, db: DerpiSubRepo) {
        this.client = client;
        this.db = db;
    }

    public async getSubscriptions() {
        return this.db.getSubscriptions();
    }

    public async sendTopImagesToSubscribedChannels() {
        const safeChannels: TextChannel[] = [];
        const suggestiveChannels: TextChannel[] = [];
        const nsfwChannels: TextChannel[] = [];

        const rows = await this.getSubscriptions();
        let channelCount = 0;

        rows.forEach((row) => {
            const channel = this.getChannel(row.guild_id, row.channel_id);

            if (channel) {
                if (row.allow_nsfw) {
                    nsfwChannels.push(channel);
                } else if (row.allow_suggestive) {
                    suggestiveChannels.push(channel);
                } else {
                    safeChannels.push(channel);
                }

                channelCount++;
            }
        });

        if (channelCount > 0) {
            const sinceDate = new Date();
            sinceDate.setDate(sinceDate.getDate() - 3);
            const recentlySentImageIds = await this.db.getImagesSentToChannelSubs(sinceDate);

            let image = await this.sendSafeTopImage(safeChannels, recentlySentImageIds);
            if (image) { await this.db.markImageAsSentToChannelSubs(image.id); }

            image = await this.sendSuggestiveTopImage(suggestiveChannels, recentlySentImageIds);
            if (image) { await this.db.markImageAsSentToChannelSubs(image.id); }

            image = await this.sendNsfwTopImage(nsfwChannels, recentlySentImageIds);
            if (image) { await this.db.markImageAsSentToChannelSubs(image.id); }
        }
    }

    public async subscribe(
        guildId: string,
        channelId: string,
        allowSuggestive: boolean = false,
        allowNsfw: boolean = false) {
        await this.db.subscribe(guildId, channelId, allowSuggestive, allowNsfw);
    }

    public async unsubscribe(guildId: string, channelId: string) {
        await this.db.unsubscribe(guildId, channelId);
    }

    private async fetchImages(
        derpiOptions: derpibooru.SearchOptions,
        imageResults: derpibooru.Image[],
        ignoreIds: number[],
    ) {
        let totalImages = imageResults.length;

        if (!this.hasImages(imageResults)) {
            let newImages = await getDerpiPage(1, derpiOptions);

            // Store the results as a "cache"
            totalImages = imageResults.push(...newImages);

            // Page 1 has already been retrieved above
            let page = 2;

            // TODO: take recently seen images into the total
            while (totalImages < 120) {
                newImages = await getDerpiPage(page, derpiOptions);
                totalImages = imageResults.push(...newImages);
                page++;
            }

            const date = new Date();
            // Date.setMinutes will update correctly and not just roll over minutes
            date.setMinutes(date.getMinutes() + 240);
            cacheExpires = date;
        }

        return totalImages;
    }

    private getChannel(guildId: string, channelId: string): TextChannel | undefined {
        const guild = this.client.guilds.get(guildId);

        if (guild) {
            const channel = guild.channels.get(channelId) as TextChannel;
            return channel;
        }

        return undefined;
    }

    private async getTopImage(
        imageResults: derpibooru.Image[],
        ignoreIds: number[],
    ): Promise<derpibooru.Image | undefined> {
        while (imageResults.length > 0) {
            // Let's just pop images off the front of the array
            const image = imageResults.shift();

            if (image && !ignoreIds.includes(image.id)) {
                return image;
            }
        }
    }

    private hasImages(imageResults: derpibooru.Image[]): boolean {
        const haveImages: boolean = imageResults.length > 0;
        const cacheExpired: boolean = Date.now() >= cacheExpires.valueOf();

        // If the caching period hasn't expired, we return true even when we
        // do not have images so that we don't keep fetching images constantly
        // that we've recently seen.
        return !cacheExpired || haveImages;
    }

    private sendChannels(channels: PartialTextBasedChannelFields[], content: string | RichEmbed) {
        channels.forEach((channel) => {
            channel.send(content);
        });
    }

    private async sendSafeTopImage(
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

        return this.sendTopImage(channels, derpiOptions, safeImageResults, ignoreIds);
    }

    private async sendSuggestiveTopImage(
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

        return this.sendTopImage(channels, derpiOptions, suggestiveImageResults, ignoreIds);
    }

    private async sendNsfwTopImage(
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

        return this.sendTopImage(channels, derpiOptions, nsfwImageResults, ignoreIds);
    }

    private async sendTopImage(
        channels: PartialTextBasedChannelFields[],
        derpiOptions: derpibooru.SearchOptions,
        imageResults: derpibooru.Image[],
        ignoreIds: number[],
    ): Promise<derpibooru.Image | undefined> {
        if (!this.hasImages(imageResults)) {
            this.sendChannels(channels, "I'm fetching new ponies! Yay!");
            const totalImages = await this.fetchImages(derpiOptions, imageResults, ignoreIds);
            this.sendChannels(channels, `${totalImages} ponies have arrived!`);
        }

        const image = await this.getTopImage(imageResults, ignoreIds);
        if (image) {
            const embed: RichEmbed = getImageEmbed(image);
            this.sendChannels(channels, embed);
        }

        return image;
    }
}

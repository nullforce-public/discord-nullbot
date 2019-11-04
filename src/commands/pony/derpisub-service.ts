import { TextChannel } from "discord.js";
import * as sqlite from "sqlite";
import { NullBotClient } from "../../nullbot-client";
import { sendNsfwTopImage, sendSafeTopImage, sendSuggestiveTopImage } from "./derpi-api";

interface IDerpiChannelSubscriptionInfo {
    allowNsfw: boolean;
    channelId: string;
    guildId: string;
}

export class DerpiSubService {
    private channelSubsTableName = "nullbot_pony_channelsubs";
    private channelSubsSentRecentlyTableName = "nullbot_pony_channelsubs_sentrecently";
    private client: NullBotClient;
    private db: sqlite.Database;

    public constructor(client: NullBotClient, db: sqlite.Database) {
        this.client = client;
        this.db = db;
    }

    public async getImagesSentToChannelSubs(sinceDate: Date) {
        const sql = `select image_id from ${this.channelSubsSentRecentlyTableName} \
            where date_sent >= ?`;

        const rows = await this.db.all(sql, [sinceDate.toISOString()]);
        const imageIds: number[] = [];

        rows.forEach((row) => imageIds.push(row.image_id));

        return imageIds;
    }

    public async getSubscriptions() {
        const sql = `select guild_id, channel_id, allow_suggestive, allow_nsfw \
            from ${this.channelSubsTableName}`;

        // Get all subscriptions
        const rows = await this.db.all(sql);

        return rows;
    }

    public async markImageAsSentToChannelSubs(imageId: number) {
        const sql = `insert into ${this.channelSubsSentRecentlyTableName}(\
            image_id, date_sent) values (?, ?)`;
        const date = new Date();

        await this.db.run(sql, [imageId, date.toISOString()]);
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
            const recentlySentImageIds = await this.getImagesSentToChannelSubs(sinceDate);

            let image = await sendSafeTopImage(safeChannels, recentlySentImageIds);
            if (image) { await this.markImageAsSentToChannelSubs(image.id); }

            image = await sendSuggestiveTopImage(suggestiveChannels, recentlySentImageIds);
            if (image) { await this.markImageAsSentToChannelSubs(image.id); }

            image = await sendNsfwTopImage(nsfwChannels, recentlySentImageIds);
            if (image) { await this.markImageAsSentToChannelSubs(image.id); }
        }
    }

    public async subscribe(
        guildId: string,
        channelId: string,
        allowSuggestive: boolean = false,
        allowNsfw: boolean = false) {
            const insertSql = `insert into ${this.channelSubsTableName}(\
                guild_id, channel_id, allow_suggestive, allow_nsfw) \
                values(?, ?, ?, ?)`;
            const updateSql = `update ${this.channelSubsTableName} \
                set allow_suggestive = ?, allow_nsfw = ? \
                where guild_id = ? and channel_id = ?`;
            const exists = false;

            if (exists) {
                // Is the channel already subscribed?
                await this.db.run(updateSql, [allowSuggestive, allowNsfw, guildId, channelId]);
            } else {
                // Subscribe it
                await this.db.run(insertSql, [guildId, channelId, allowSuggestive, allowNsfw]);
            }
    }

    public async unsubscribe(guildId: string, channelId: string) {
        const sql = `delete from ${this.channelSubsTableName} where guild_id = ? and channel_id = ?`;

        // Unsubscribe the channel, if it is subscribed
        await this.db.run(sql, [guildId, channelId]);
    }

    private getChannel(guildId: string, channelId: string): TextChannel | undefined {
        const guild = this.client.guilds.get(guildId);

        if (guild) {
            const channel = guild.channels.get(channelId) as TextChannel;
            return channel;
        }

        return undefined;
    }
}

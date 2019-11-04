import * as sqlite from "sqlite";

interface IDerpiChannelSubscriptionInfo {
    allowNsfw: boolean;
    channelId: string;
    guildId: string;
}

export class DerpiSubService {
    private channelSubsTableName = "nullbot_pony_channelsubs";
    private channelSubsSentRecentlyTableName = "nullbot_pony_channelsubs_sentrecently";
    private db: sqlite.Database;

    public constructor(db: sqlite.Database) {
        this.db = db;
    }

    public async getSubscriptions() {
        const sql = `select guild_id, channel_id, allow_suggestive, allow_nsfw \
            from ${this.channelSubsTableName}`;

        // Get all subscriptions
        const rows = await this.db.all(sql);

        return rows;
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

    public async markImageAsSentToChannelSubs(imageId: number) {
        const sql = `insert into ${this.channelSubsSentRecentlyTableName}(\
            image_id, date_sent) values (?, ?)`;
        const date = new Date();

        await this.db.run(sql, [imageId, date.toISOString()]);
    }

    public async getImagesSentToChannelSubs(sinceDate: Date) {
        const sql = `select image_id from ${this.channelSubsSentRecentlyTableName} \
            where date_sent >= ?`;

        const rows = await this.db.all(sql, [sinceDate.toISOString()]);
        const imageIds: number[] = [];

        rows.forEach((row) => imageIds.push(row.image_id));

        return imageIds;
    }
}

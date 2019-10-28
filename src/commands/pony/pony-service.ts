import * as sqlite from "sqlite";

interface IDerpiChannelSubscriptionInfo {
    allowNsfw: boolean;
    channelId: string;
    guildId: string;
}

export class DerpiService {
    private tableName = "nullbot_pony_channelsubs";
    private db: sqlite.Database;

    public constructor(db: sqlite.Database) {
        this.db = db;
    }

    public async getSubscriptions() {
        const sql = `select guild_id, channel_id, allow_suggestive, allow_nsfw \
            from ${this.tableName}`;

        // Get all subscriptions
        const rows = await this.db.all(sql);

        return rows;
    }

    public async subscribe(
        guildId: string,
        channelId: string,
        allowSuggestive: boolean = false,
        allowNsfw: boolean = false) {
            const insertSql = `insert into ${this.tableName}(\
                guild_id, channel_id, allow_suggestive, allow_nsfw) \
                values(?, ?, ?, ?)`;
            const updateSql = `update ${this.tableName} \
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
        const sql = `delete from ${this.tableName} where guild_id = ? and channel_id = ?`;

        // Unsubscribe the channel, if it is subscribed
        await this.db.run(sql, [guildId, channelId]);
    }
}

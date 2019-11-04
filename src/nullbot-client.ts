import { AkairoClient, AkairoOptions, PrefixFunction, SQLiteProvider } from "discord-akairo";
import { ClientOptions } from "discord.js";
import * as sqlite from "sqlite";

export class NullBotClient extends AkairoClient {
    public settings: SQLiteProvider;
    public database: sqlite.Database | Promise<sqlite.Database>;
    public memdb: sqlite.Database | Promise<sqlite.Database> | undefined;
    private initialPrefix: string | string[] | PrefixFunction | undefined;

    public constructor(options: AkairoOptions, clientOptions: ClientOptions) {
        super(options, clientOptions);
        this.initialPrefix = options.prefix;

        options.prefix = (message): any => {
            let prefix = this.initialPrefix || "n!";

            if (message.guild) {
                prefix = this.settings.get(message.guild.id, "prefix", prefix);
            }

            return prefix;
        };

        // NOTE: migrate with force: "last" will undo then redo the last migration
        this.database = sqlite.open("./db.sqlite")
            .then((db) => db.migrate({ force: ""}));

        this.settings = new SQLiteProvider(
            this.database,
            "nullbot_settings",
            {
                dataColumn: "settings",
                idColumn: "guild_id",
            },
        );

        this.initMemDb();
    }

    public login(token: string): Promise<string> {
        return this.settings.init().then(() => super.login(token));
    }

    private async initMemDb() {
        this.memdb = await sqlite.open(":memory:");
        await this.memdb.run("create table nullbot_pony_channelsubs(guild_id text, "
            + "channel_id text, allow_suggestive integer, allow_nsfw integer)");
        await this.memdb.run("create table nullbot_pony_channelsubs_sentrecently(\
            image_id integer, date_sent text)");

        return this.memdb;
    }
}

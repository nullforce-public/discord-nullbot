import { AkairoClient, AkairoOptions, PrefixFunction, SQLiteProvider } from "discord-akairo";
import { ClientOptions } from "discord.js";
import * as sqlite from "sqlite";

export class NullBotClient extends AkairoClient {
    public settings: SQLiteProvider;
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
        const database = sqlite.open("./db.sqlite")
            .then((db) => db.migrate({ force: ""}));

        this.settings = new SQLiteProvider(
            database,
            "nullbot_settings",
            {
                dataColumn: "settings",
                idColumn: "guild_id",
            },
        );
    }

    public login(token: string): Promise<string> {
        return this.settings.init().then(() => super.login(token));
    }
}

import { Command, SQLiteHandler } from "discord-akairo";
import { Message } from "discord.js";
import * as sqlite from "sqlite";
import { NullBotClient } from "../../nullbot-client";
import { DerpiService } from "./pony-service";

class DerpiSubCommand extends Command {
    constructor() {
        super("derpisub", {
            aliases: ["derpisub"],
            args: [
                {
                    default: "",
                    id: "subcommand",
                    type: "lowercase",
                },
                {
                    id: "suggestive",
                    match: "flag",
                    prefix: "--suggestive",
                },
                {
                    id: "nsfw",
                    match: "flag",
                    prefix: "--nsfw",
                },
            ],
            category: "pony",
            channelRestriction: "guild",
            userPermissions: ["MANAGE_CHANNELS"],
        });
    }

    public async exec(message: Message, args: any) {
        const client = this.client as NullBotClient;

        let response = "Command is currently unavailable. Please try again later.";

        const memdb = client.memdb as sqlite.Database;

        if (memdb) {
            const prefix = message.util ? message.util.prefix : "n!";

            // Parse arguments
            const suggestive: boolean = args.suggestive;
            const nsfw: boolean = args.nsfw;
            const subcommand = args.subcommand;

            // Get the Guild ID and Channel ID
            const guild = message.guild.id;
            const channel = message.channel.id;

            const usage = `**Command Usage:** \`${prefix}derpisub <add | remove> [--nsfw]\``;
            response = "I didn't understand.\n" + usage;

            const svc = new DerpiService(memdb);

            if (subcommand === "add") {
                await svc.subscribe(guild, channel, suggestive, nsfw);

                response = "Channel was subscribed.";
            } else if (subcommand === "remove") {
                await svc.unsubscribe(guild, channel);

                response = "Channel was unsubscribed.";
            }
        }

        return message.channel.send(response);
    }
}

module.exports = DerpiSubCommand;

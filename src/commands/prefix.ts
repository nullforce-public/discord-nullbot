import { Command } from "discord-akairo";
import { Message } from "discord.js";
import { NullBotClient } from "../nullbot-client";

class PrefixCommand extends Command {
    constructor() {
        super("prefix", {
            aliases: ["prefix"],
            args: [
                {
                    default: "n!",
                    id: "prefix",
                },
            ],
            channelRestriction: "guild",
        });
    }

    public exec(message: Message, args: any): any {
        const guildId = message.guild.id;
        const client = this.client as NullBotClient;
        const oldPrefix = client.settings.get(guildId, "prefix", "n!");

        return client.settings.set(guildId, "prefix", args.prefix)
            .then(() => {
                return message.reply(`Prefix changed from ${oldPrefix} to ${args.prefix}.`);
            });
    }
}

module.exports = PrefixCommand;

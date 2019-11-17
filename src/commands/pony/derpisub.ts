import { Command } from "discord-akairo";
import { Message } from "discord.js";
import { NullBotClient } from "../../nullbot-client";

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
        let response = "Command is currently unavailable. Please try again later.";
        const client = this.client as NullBotClient;
        const svc = client.serviceFactory.getDerpiSubService();

        if (svc) {
            const prefix = message.util ? message.util.prefix : "n!";

            // Parse arguments
            const suggestive: boolean = args.suggestive;
            const nsfw: boolean = args.nsfw;
            const subcommand = args.subcommand;

            // Get the Guild ID and Channel ID
            const guild = message.guild.id;
            const channel = message.channel.id;

            const usage = `**Command Usage:** \`${prefix}derpisub <add | remove> [--suggestive] [--nsfw]\``;
            response = "I didn't understand.\n" + usage;

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

import { Command } from "discord-akairo";
import { Message, TextChannel } from "discord.js";
import * as derpibooru from "node-derpi";
import { NullBotClient } from "../../nullbot-client";

class DerpiCommand extends Command {
    private derpiImageResults: derpibooru.Image[] = [];
    private cacheExpires: Date = new Date();

    constructor() {
        super("derpi", {
            aliases: ["derpi", "mlfw", "mlp", "ponies", "pony"],
            args: [
                {
                    default: "",
                    id: "term1",
                    type: "string",
                },
                {
                    default: "",
                    id: "term2",
                    type: "string",
                },
                {
                    default: "",
                    id: "term3",
                    type: "string",
                },
                {
                    id: "extra",
                    match: "rest",
                },
                {
                    id: "nsfw",
                    match: "flag",
                    prefix: "--nsfw",
                },
            ],
            category: "pony",
            split: "quoted",
        });
    }

    public async exec(message: Message, args: any) {
        const client = this.client as NullBotClient;
        const svc = client.serviceFactory.getDerpiService();

        if (!svc) {
            const response = "Command is currently unavailable. Please try again later.";
            return message.channel.send(response);
        }

        return svc.sendRandomImage(message.channel as TextChannel);
    }
}

module.exports = DerpiCommand;

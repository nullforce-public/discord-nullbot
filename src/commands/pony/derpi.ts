import { Command } from "discord-akairo";
import { Message, TextChannel } from "discord.js";
import { NullBotClient } from "../../nullbot-client";

class DerpiCommand extends Command {
    constructor() {
        super("derpi", {
            aliases: ["derpi", "mlfw", "mlp", "ponies", "pony"],
            args: [
                {
                    default: "",
                    id: "termOrId",
                    type: "dynamicInt",
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

        // Parse arguments
        const termOrId: number | string = args.termOrId;
        const suggestive: boolean = args.suggestive;
        const nsfw: boolean = args.nsfw;

        const channel = message.channel as TextChannel;

        if (nsfw && !(channel.type === "dm" || channel.nsfw)) {
            const response = "You cannot use the --nsfw flag in a non-NSFW channel.";
            return message.channel.send(response);
        }

        // If the first term is a number, retrieve that image by ID
        if (typeof termOrId === "number") {
            return svc.sendImage(channel, termOrId);
        }

        return svc.sendRandomImage(
            channel,
            suggestive,
            nsfw);
    }
}

module.exports = DerpiCommand;

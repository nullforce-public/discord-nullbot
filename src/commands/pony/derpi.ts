import { Command } from "discord-akairo";
import { Message } from "discord.js";
import * as derpibooru from "node-derpi";
import { getImageEmbed } from "./derpi-api";

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
        // We're just fetching the top scoring from the last few days, this
        // should be made to actually query based on arguments passed in
        const derpiOptions: derpibooru.SearchOptions = {
            query: "first_seen_at.gt:3 days ago && !suggestive",
            sortFormat: derpibooru.ResultSortFormat.SCORE,
        };

        if (this.derpiImageResults.length < 1 || Date.now() >= this.cacheExpires.valueOf()) {
            message.channel.send("I'm fetching new ponies! Yay!");
            const searchResults = await derpibooru.Fetch.search(derpiOptions);

            // store the results as a "cache"
            this.derpiImageResults = searchResults.images;
            const date = new Date();
            // Date.setMinutes will update correctly and not just roll over minutes
            date.setMinutes(date.getMinutes() + 60);
            this.cacheExpires = date;
        }

        if (this.derpiImageResults.length > 0) {
            const index = Math.floor(Math.random() * this.derpiImageResults.length);
            const embed = getImageEmbed(this.derpiImageResults[index]);
            return message.channel.send(embed);
        }

        return undefined;
    }
}

module.exports = DerpiCommand;

import { Command } from "discord-akairo";
import { Message } from "discord.js";

class PingCommand extends Command {
    constructor() {
        super("ping", {
            aliases: ["ping"],
        });
    }

    public exec(message: Message) {
        return message.channel.send("pong!");
    }
}

module.exports = PingCommand;

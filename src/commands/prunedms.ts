import { Command } from "discord-akairo";
import { DMChannel, Message } from "discord.js";

class PingCommand extends Command {
    constructor() {
        super("prunedms", {
            aliases: ["prunedms"],
            args: [
                {
                    default: "1",
                    id: "amount",
                    type: "number",
                },
            ],
            channelRestriction: "dm",
        });
    }

    public async exec(message: Message, args: any) {
        const amount = Math.min(args.amount, 10);
        const channel = message.channel as DMChannel;
        let deletedMessages = 0;
        let fetchSize = 50;

        while (deletedMessages < amount) {
            const messages = await channel.fetchMessages({
                limit: fetchSize,
            });

            const myMessages = messages
            .filter((m) => m.deletable || m.author.id === message.client.user.id)
            .sort((a, b) => a.createdTimestamp < b.createdTimestamp ? 1 : -1);

            for (const msg of myMessages.values()) {
                await msg.delete();
                deletedMessages++;

                if (deletedMessages >= amount) break;
            }

            fetchSize = fetchSize + 50;
        }
    }
}

module.exports = PingCommand;

import { Command } from "discord-akairo";
import { Message, RichEmbed } from "discord.js";

class HelpCommand extends Command {
    private color: number = 0x7289DA;
    constructor() {
        super("help", {
            aliases: ["commands", "help"],
            args: [
                {
                    default: null,
                    description: "(optional) A command name",
                    id: "key",
                    type: "string",
                },
            ],
            category: "help",
            description: "List all of my commands or information about a specific command",
        });
    }

    public exec(message: Message, args: any) {
        const key = args.key ? (args.key as string).toLowerCase() : null;

        if (key) {
            if (this.handler.modules.has(key)) {
                const command: Command = this.handler.modules.get(key) as Command;
                return message.channel.send(this.getCommandInfo(command));
            }
        } else {
            return message.channel.send(this.getCommandList());
        }

        return message.channel.send("Command not found");
    }

    private getCommandInfo(command: Command): RichEmbed {
        const embed = new RichEmbed()
            .setColor(this.color)
            .setDescription(command.description)
            .setTitle(command.id);

        embed.addField("Aliases", command.aliases.join(", "));

        const data: string[] = [];

        command.args.forEach((arg) => {
            const name = arg.prefix ? arg.prefix : arg.id;
            data.push(`**${name}:** ${arg.description || "<unknown>"}`);
        });

        embed.addField("Arguments", data.join("\n"));

        return embed;
    }

    private getCommandList(): RichEmbed {
        const excluded = ["default", "help"];
        const embed = new RichEmbed()
            .setColor(this.color)
            .setTitle("My commands:");

        // Full list
        this.handler.categories.forEach((category, categoryName) => {
            if (!excluded.includes(categoryName)) {
                const commands = category.map((command) => command.id).join(", ");
                embed.addField(categoryName, commands);
            }
        });

        return embed;
    }
}

module.exports = HelpCommand;

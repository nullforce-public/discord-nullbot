import * as Mixer from "@mixer/client-node";
import { Command } from "discord-akairo";
import { Message, RichEmbed } from "discord.js";

class MixerCommand extends Command {
    constructor() {
        super("mixer", {
            aliases: ["mixer"],
            args: [
                {
                    default: "",
                    description: "The username of the streamer on Mixer",
                    id: "username",
                    type: "string",
                },
            ],
            category: "streaming",
            description: "Get information for a streamer on Mixer",
        });
    }

    public async exec(message: Message, args: any) {
        // Parse arguments
        const username: string = args.username;

        if (username === "") {
            return message.channel.send("You must provide the mixer channel name.");
        }

        const client = new Mixer.Client(new Mixer.DefaultRequestRunner());
        const clientId = process.env.NULLBOT_MIXER_CLIENT_ID || "";
        const channelName = username;

        client.use(new Mixer.OAuthProvider(client, { clientId }) as Mixer.Provider);

        const result: any = await client.request("GET", `channels/${channelName}`);

        if (result.body.statusCode === 404) {
            return message.channel.send(`I couldn't find a channel named ${channelName}`);
        } else if (result.body.statusCode !== 200 && result.statusCode !== 200) {
            return message.channel.send("Hmm, an error.");
        }

        const embed = this.getRichEmbed(result.body);
        return message.channel.send(embed);
    }

    private getRichEmbed(body: any): RichEmbed {
        // User
        const username = body.user.username;
        const avatarUrl = body.user.avatarUrl;
        const bio = body.user.bio;
        const level = body.user.level;
        const followerCount = body.numFollowers;
        const viewerCount = body.viewersTotal;

        // Game
        const gameName = body.type.name;
        const gameDescription = body.type.description;
        const gameBackground = body.type.backgroundUrl;

        // Stream
        const streamTitle = body.name;
        const audience = body.audience;
        const currentViewers = body.viewersCurrent;
        const isOnline = body.online;
        const onlineText = isOnline ? "Online" : "Offline";

        const imageUrl = isOnline ? gameBackground : gameBackground;
        const description = (gameDescription) ? gameDescription : bio || "";

        const embed = new RichEmbed()
        .setAuthor(`Mixer - ${username}`, "https://mixer.com/_latest/assets/favicons/favicon-32x32.png")
        .setColor(0x1FBAED)
        .addField("Status", onlineText, true)
        .addField("Audience", audience, true)
        .addField("Level", level, true)
        .addField("Followers", followerCount, true)
        .addField("Views", viewerCount, true)
        .addField("Viewers", currentViewers, true)
        .addField("Game", gameName)
        .addField("Description", description)
        .setImage(imageUrl)
        .setThumbnail(avatarUrl)
        .setTitle(streamTitle)
        .setURL(`https://mixer.com/${username}`);

        return embed;
    }
}

module.exports = MixerCommand;

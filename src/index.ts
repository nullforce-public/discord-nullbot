import { TextChannel } from "discord.js";
import dotenv from "dotenv";
import { sendRandomTopImage } from "./derpi-api";
import { NullBotClient } from "./nullbot-client";

// Load .env in local development
dotenv.config();

const discordBotToken = process.env.DISCORD_BOT_TOKEN || "";

const client = new NullBotClient({
    commandDirectory: "./dist/commands/",
    ownerID: "73632204323819520", // nullforce
    prefix: "n!",
}, {
    disableEveryone: true,
});

client.once("ready", () => {
    console.log("Ready!");

    // create a 1 minute resolution timer
    setInterval(() => {
        onceEveryMinute();
    }, 60_000);
});

client.login(discordBotToken);

let count = 0;

async function onceEveryMinute() {
    const guild = client.guilds.get("273318518395633664"); // Nullforce Dev
    const channelId = "636357207562387467"; // #bot-ops

    count++;

    if (guild) {
        const channel = guild.channels.get(channelId) as TextChannel;

        if (channel) {
            // channel.send("It's been a minute, ponies!");
            sendRandomTopImage(channel);

            // if (count % 2 === 0) {
            //     channel.send("Every other minute, ponies!");
            // }

            // if (count % 5 === 0) {
            //     channel.send("It's been 5 whole minutes, ponies!");
            // }

            // if (count % 10 === 0) {
            //     channel.send("Fluttershy says, \"yay, it's been 10 minutes\"");
            // }
        }
    }
}

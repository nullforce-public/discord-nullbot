import { Client } from "discord.js";
import dotenv from "dotenv";

// Load .env in local development
dotenv.config();

const discordBotToken = process.env.DISCORD_BOT_TOKEN;
const client = new Client();

client.once("ready", () => {
    console.log("Ready!");
});

client.on("message", (message) => {
    // Ignore bots
    if (message.author.bot) return;

    console.log(`message: ${message.content}`);

    if (message.content === "!ping") {
        message.channel.send("pong!");
    }
});

client.login(discordBotToken);

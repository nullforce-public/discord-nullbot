import { AkairoClient } from "discord-akairo";
import dotenv from "dotenv";

// Load .env in local development
dotenv.config();

const discordBotToken = process.env.DISCORD_BOT_TOKEN || "";
const client = new AkairoClient({
    commandDirectory: "./dist/commands/",
    ownerID: "73632204323819520", // nullforce
    prefix: "!",
}, {
    disableEveryone: true,
});

client.once("ready", () => {
    console.log("Ready!");
});

client.login(discordBotToken);

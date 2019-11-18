import { TextChannel } from "discord.js";
import dotenv from "dotenv";
import * as sqlite from "sqlite";
import { DerpiSubRepo } from "./commands/pony/derpisub-data";
import { DerpiSubService } from "./commands/pony/derpisub-service";
import { NullBotClient } from "./nullbot-client";

// Load .env in local development
dotenv.config();

const discordBotToken: string = process.env.DISCORD_BOT_TOKEN || "";
const discordBotOwnerId: string = process.env.DISCORD_BOT_OWNER_ID || "";
const baseMinuteInterval: number = +(process.env.DEBUG_ONE_MINUTE_IN_MILLISECONDS || 60_000);
const telemetryChannelId: string = process.env.DEBUG_TELEMETRY_CHANNEL_ID || "";
const telemetryGuildId: string = process.env.DEBUG_TELEMETRY_GUILD_ID || "";

let telemetryChannel: TextChannel | undefined;

const client = new NullBotClient({
    commandDirectory: "./dist/commands/",
    ownerID: discordBotOwnerId,
    prefix: "n!",
}, {
    disableEveryone: true,
});

client.once("ready", () => {
    console.log("Ready!");

    const telemetryGuild = telemetryGuildId !== "" ? client.guilds.get(telemetryGuildId) : undefined;
    telemetryChannel = telemetryGuild ? telemetryGuild.channels.get(telemetryChannelId) as TextChannel : undefined;

    if (telemetryChannel) { telemetryChannel.send("NullBot is Ready!"); }

    onceEveryMinute();

    // create a 1 minute resolution timer
    setInterval(() => {
        onceEveryMinute();
    }, baseMinuteInterval);
});

client.login(discordBotToken);

let count = 0;

async function onceEveryMinute() {

    // Keeps track of the minute count
    count++;

    // Every 2 minutes
    if (count % 2 === 0) {
        const derpiSubService = client.serviceFactory.getDerpiSubService();
        if (derpiSubService) {
            derpiSubService.sendTopImagesToSubscribedChannels();
        }
    }

    // Every 15 minutes
    if (count % 15 === 0) {
        if (telemetryChannel) {
            telemetryChannel.send("NullBot is alive!");
        }
    }
}

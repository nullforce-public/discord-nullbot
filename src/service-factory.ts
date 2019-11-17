import * as sqlite from "sqlite";
import { DerpiSubRepo } from "./commands/pony/derpisub-data";
import { DerpiSubService } from "./commands/pony/derpisub-service";
import { NullBotClient } from "./nullbot-client";

export class ServiceFactory {
    private client: NullBotClient;

    public constructor(client: NullBotClient) {
        this.client = client;
    }

    public getDerpiSubService(): DerpiSubService | undefined {
        const memdb = this.client.memdb as sqlite.Database;
        if (this.client.memdb) {
            const repo = new DerpiSubRepo(memdb);
            const svc = new DerpiSubService(this.client, repo);
            return svc;
        }
    }
}

import * as sqlite from "sqlite";
import { DerpiService } from "./commands/pony/derpi-service";
import { DerpiSubRepo } from "./commands/pony/derpisub-data";
import { DerpiSubService } from "./commands/pony/derpisub-service";
import { NullBotClient } from "./nullbot-client";

export class ServiceFactory {
    private client: NullBotClient;
    private derpiService: DerpiService | undefined;

    public constructor(client: NullBotClient) {
        this.client = client;
    }

    public getDerpiService(): DerpiService | undefined {
        if (!this.derpiService) {
            this.derpiService = new DerpiService(this.client);
        }

        return this.derpiService;
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

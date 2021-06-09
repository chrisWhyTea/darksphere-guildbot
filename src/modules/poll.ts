import { Client, Message } from "discord.js";
import { BaseLogger } from "pino";
import { Module } from "./module";



export class PollModule extends Module {
    constructor(client: Client, logger: BaseLogger) {
        super(client, logger)
        this.logger.info({ module: "PollModule" }, "module initialized")
    }


    async commandHandler(message: Message) {
        return
    }


}
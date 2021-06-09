import { PrismaClient } from '@prisma/client'
import { Channel, Client, GuildMember, Message, PartialDMChannel, PartialGuildMember } from 'discord.js'
import dotenv from 'dotenv'
import _ from 'lodash'
import pino from 'pino'
import { Module } from './modules/module'
import { PollModule } from './modules/poll'
import { UserLogModule } from './modules/userLog'
dotenv.config()


const prisma = new PrismaClient()

const logger = pino()
if (_.isNil(process.env.BOT_AUTH_TOKEN)) {
    logger.fatal("required env variables is not set")
    process.exit(1)
}
const BOT_AUTH_TOKEN = process.env.BOT_AUTH_TOKEN

async function main() {
    const client = new Client()

    client.once("ready", async () => {

        const modules: Module[] = [
            new PollModule(client, logger),
            new UserLogModule(client, logger)
        ]

        logger.info({ modules: modules.length }, "bot is ready")
        client.on("message", async (message: Message) => {
            // Only handle command messages
            if (message.content.startsWith(process.env.COMMAND_PREFIX || "/")) {
                if (message.channel.type === "dm") {
                    client.guilds.fetch
                    message.reply(":exclamation: Bitte benutze den Befehl in einem Text Channel des Discord Server auf dem der Bot etwas machen soll.")
                    return
                }
                await message.delete()
                const commandArray = message.content.substr(1).split(" ")
                for await (const module of modules) {
                    module.commandHandler(message, commandArray)
                }
            }
        })

        client.on("guildMemberAdd", async (member: GuildMember) => {
            for await (const module of modules) {
                await module.memberAddHandler(member)
            }
        })

        client.on("guildMemberRemove", async (member: GuildMember | PartialGuildMember) => {
            for await (const module of modules) {
                await module.memberRemoveHandler(member)
            }
        })

        client.on("guildMemberUpdate", async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
            for await (const module of modules) {
                await module.memberUpdateHandler(oldMember, newMember)
            }
        })

        client.on("channelDelete", async (channel: Channel | PartialDMChannel) => {
            if (channel.type === "text") {
                for await (const module of modules) {
                    await module.channelDeleteHandler(channel)
                }
            }
        })
    })

    client.login(BOT_AUTH_TOKEN)
}

main().catch((e) => {
    throw e
})
    .finally(async () => {
        await prisma.$disconnect()
    })
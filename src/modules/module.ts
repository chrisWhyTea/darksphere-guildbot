import { PrismaClient, Server } from "@prisma/client";
import { Channel, Client, DiscordAPIError, GuildMember, Message, PartialDMChannel, PartialGuildMember } from "discord.js";
import _ from "lodash";
import { BaseLogger } from 'pino';
import { prisma } from "../db";
import { Language } from "../language";

export abstract class Module {
    client: Client
    logger: BaseLogger
    prisma: PrismaClient
    lng: Language;
    constructor(client: Client, logger: BaseLogger) {
        this.client = client
        this.logger = logger
        this.prisma = prisma()
        this.lng = new Language()
    }

    async getServerById(serverId: string): Promise<Server> {
        const server = await this.prisma.server.findFirst({
            where: { id: serverId },
        })

        if (_.isNil(server)) {
            const guild = await this.client.guilds.fetch(serverId)
            const owner = guild.owner
            if (_.isNil(owner)) {
                throw new Error("Could not do initial server entry due to missing server owner")
            }
            // We expect that the guild owner is in the highest role so it is the admin role for the bot
            const adminRoleId = owner.roles.highest.id

            const createdServer = this.prisma.server.create({
                data: {
                    id: serverId,
                    permissionsAdminRoleId: adminRoleId,
                    permissionsEditRoleId: adminRoleId,
                    permissionsViewRoleId: adminRoleId,
                }
            })
            return createdServer
        }

        return server
    }

    async commandHandler(message: Message, commandArray: string[]): Promise<void> {

    }

    async memberAddHandler(member: GuildMember): Promise<void> { }

    async memberRemoveHandler(member: GuildMember | PartialGuildMember): Promise<void> {

    }

    async memberUpdateHandler(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {

    }

    async channelDeleteHandler(channel: Channel | PartialDMChannel) {

    }

    async sendBotLogNotification(text: string, server: Server, message: Message) {
        if (server.botLogActive) {
            await this.sendMessageToBotLogChannel(text, server)
        } else {
            await (await message.author.createDM()).send(text)
        }
    }

    async sendMessageToBotLogChannel(text: string, server: Server) {
        if (_.isNil(server.botLogChannelId)) {
            return
        }
        if (server.botLogActive === false) {
            return
        }
        try {
            const botLogChannel = await this.client.channels.fetch(server.botLogChannelId);
            if (botLogChannel.isText()) {
                await botLogChannel.send(text);
            }
        } catch (e) {
            if (e instanceof DiscordAPIError && e.message === "Unknown Channel") {
                this.logger.info({ server: server.id, channel: server.botLogChannelId }, "BotLog channel was not found")
                const serverOwner = (await this.client.guilds.fetch(server.id)).owner

                if (_.isNil(serverOwner)) {
                    return
                }
                await serverOwner.send(text)
                await serverOwner.send(`:exclamation: ${this.lng.get("BOTLOG_CHANNEL_NOT_AVAILABLE_ANYMORE", server.language)}`)
                return
            }
            throw e
        }

    }

    async checkIfChannelBelongsToServer(channelId: string, serverId: string) {
        try {
            const fetechedChannel: any = (await this.client.channels.fetch(channelId)).toJSON()
            if (_.isNil(fetechedChannel.guild)) {
                return false
            }
            return fetechedChannel.guild === serverId
        } catch (e) {
            if (e instanceof DiscordAPIError && e.message === "Unknown Channel") {
                return false
            }
        }
    }


    async checkIfRoleBelongsToServer(roleId: string, serverId: string) {

        const fetechedRole: any = (await (await this.client.guilds.fetch(serverId)).roles.fetch(roleId))
        if (_.isNil(fetechedRole)) {
            return false
        }
        return true
    }

    async checkPermissions(server: Server, member: GuildMember, type: "admin" | "edit" | "view") {
        const roleCache = (await member.fetch()).roles.cache.toJSON()
        const roleIds = _.map(roleCache, (o: any) => {
            return o.id
        })
        if (type === "admin") {
            return roleIds.includes(server.permissionsAdminRoleId)
        } else if (type === "edit") {
            return roleIds.includes(server.permissionsEditRoleId)

        } else if (type === "view") {
            return roleIds.includes(server.permissionsViewRoleId)
        }
    }
}
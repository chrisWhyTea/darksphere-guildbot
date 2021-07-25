import { Server } from "@prisma/client";
import { Channel, Client, DiscordAPIError, GuildMember, Message, PartialGuildMember } from "discord.js";
import _, { isNil } from "lodash";
import { BaseLogger } from "pino";
import { Module } from "./module";


export class UserLogModule extends Module {
    constructor(client: Client, logger: BaseLogger) {
        super(client, logger)
        this.logger.info({ module: "UserLogModule" }, "module initialized")
    }

    async memberAddHandler(member: GuildMember): Promise<void> {
        this.logger.info({ memberId: member.id, guildId: member.guild.id }, "member joined")
        try {
            const server = await this.getServerById(member.guild.id)
            if (!server.userLogOnUserEvents || _.isNil(server.userLogChannelId)) {
                return
            }
            let usernameString = this.getUsernameString(member);

            const text = `:green_circle: <@${member.id}> ${usernameString} ${this.lng.get("USERLOG_USER_JOINED", server.language)}`
            await this.sendNotificationToUserLog(text, server);
        } catch (e) {
            this.logger.error(e)
        }
        return
    }

    async memberRemoveHandler(member: GuildMember | PartialGuildMember): Promise<void> {
        this.logger.info({ memberId: member.id, guildId: member.guild.id }, "member left the server")
        try {
            const server = await this.getServerById(member.guild.id)
            if (!server.userLogOnUserEvents) {
                return
            }

            let usernameString = this.getUsernameString(member);

            const text = `:red_circle: <@${member.id}> ${usernameString} ${this.lng.get("USERLOG_USER_LEFT", server.language)}`
            await this.sendNotificationToUserLog(text, server);
        } catch (e) {
            this.logger.error(e)
        }
        return
    }

    private getUsernameString(member: GuildMember | PartialGuildMember) {
        let usernameString = "";
        if (!_.isNil(member.user)) {
            let nicknameAddition = "";
            if (!_.isNil(member.nickname)) {
                nicknameAddition = ` aka **${member.nickname}**`;
            }
            usernameString = `[**${member.user.username}**${nicknameAddition}]`;
        }
        return usernameString;
    }

    async memberUpdateHandler(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
        if (oldMember.nickname !== newMember.nickname) {
            try {
                const server = await this.getServerById(newMember.guild.id)
                if (!server.userLogOnUserEvents || _.isNil(server.userLogChannelId)) {
                    return
                }
                if (oldMember.nickname !== newMember.nickname) {
                    const oldMemberName = oldMember.nickname || oldMember.displayName
                    const newMemberName = newMember.nickname || newMember.displayName
                    const text = `:yellow_circle: <@${newMember.id}> ${this.lng.get("USERLOG_USER_NICKNAME_CHANGED_1", server.language)} **${oldMemberName}** ${this.lng.get("USERLOG_USER_NICKNAME_CHANGED_2", server.language)} **${newMemberName}**.`
                    await this.sendNotificationToUserLog(text, server);
                }
            } catch (e) {
                this.logger.error(e)
            }
            return
        }
    }

    async channelDeleteHandler(channel: Channel) { }

    async getServerByUserlogChannelId(channelId: string) {
        const server = await this.prisma.server.findFirst({
            where: { userLogChannelId: channelId },
        })
        return server
    }

    async commandHandler(message: Message, commandArray: string[]) {
        const baseCommand = commandArray.shift()
        if (!_.isNil(baseCommand) && baseCommand.toLowerCase() === "userlog") {
            if (_.isNil(message.member)) {
                return
            }
            if (_.isNil(message.guild)) {
                return
            }
            const server = await this.getServerById(message.member.guild.id)
            if (!await this.checkPermissions(server, message.member, "admin")) {
                await (await message.author.createDM()).send(":no_entry_sign:" + this.lng.get("NO_PERMISSION", server.language))
                return
            }
            if (commandArray.length === 0) {
                await (await message.author.createDM()).send(this.createHelpText(server.language))
                return
            }
            const action = commandArray.shift()
            if (!_.isNil(action) && ["setchannel", "toggle", "status"].includes(action.toLowerCase())) {
                if (action.toLowerCase() === "setchannel") {
                    const channelId = commandArray.shift()
                    if (isNil(channelId)) {
                        await (await message.author.createDM()).send(this.createHelpText(server.language))
                        return
                    }
                    if (await this.checkIfChannelBelongsToServer(channelId, server.id)) {
                        const serverUpdated = await this.prisma.server.update({
                            where: { id: server.id },
                            data: {
                                userLogChannelId: channelId
                            }
                        })
                        const text = `:yellow_square: <@${message.member.id}> ${this.lng.get("USERLOG_NOTIFICATION_CHANNEL_CHANGED_1", server.language)} <#${channelId}> ${this.lng.get("USERLOG_NOTIFICATION_CHANNEL_CHANGED_2", server.language)}`
                        await this.sendBotLogNotification(text, serverUpdated, message)
                    } else {
                        await (await message.author.createDM()).send(this.lng.get("USERLOG_NO_CHANNEL_FOUND", server.language))
                        return
                    }

                } else if (action.toLowerCase() === "toggle") {
                    if (_.isNil(server.userLogChannelId)) {
                        await (await message.author.createDM()).send(this.lng.get("USERLOG_NO_CHANNEL_SET", server.language))
                        return
                    }
                    const updatedServer = await this.prisma.server.update({
                        where: { id: server.id },
                        data: {
                            userLogOnUserEvents: !server.userLogOnUserEvents
                        }
                    })
                    let text
                    if (updatedServer.userLogOnUserEvents === true) {
                        text = `:green_square: <@${message.member.id}> ${this.lng.get("USERLOG_ACTIVATED", server.language)}`
                    } else {
                        text = `:red_square: <@${message.member.id}> ${this.lng.get("USERLOG_DEACTIVATED", server.language)}`
                    }
                    await this.sendBotLogNotification(text, server, message)

                } else if (action.toLowerCase() === "status") {
                    let channelText: string
                    let statusText: string
                    let status: string
                    let additionalText = ""

                    if (server.userLogOnUserEvents === true) {
                            status = ":green_square: " + this.lng.get("STATE_ON", server.language)
                        } else {
                            status = ":red_square: " + this.lng.get("STATE_OFF", server.language)
                        }
                    const aktivText = `**${this.lng.get("STATE", server.language)}:**        ${status}`
                    if (!_.isNil(server.botLogChannelId)) {
                        channelText = `**${this.lng.get("CHANNEL", server.language)}:**     <#${server.botLogChannelId}>`
                        statusText = `**${this.lng.get("USERLOG_STATUS_HEADER", server.language)}**\n\n${aktivText}\n${channelText}`
                    } else {
                        channelText = `**${this.lng.get("CHANNEL", server.language)}:**     ${this.lng.get("NO_CHANNEL_SELECTED", server.language)}`
                        additionalText = "\n\n:exclamation:" + this.lng.get("USERLOG_NO_CHANNEL_SET", server.language)
                    }
                    statusText = `**${this.lng.get("USERLOG_STATUS_HEADER", server.language)}**\n\n${aktivText}\n${channelText}${additionalText}`
                    await this.sendBotLogNotification(statusText, server, message)

                }
            } else {
                await (await message.author.createDM()).send(this.createHelpText(server.language))
                return
            }
        }

    }

    private async sendNotificationToUserLog(text: string, server: Server) {
        if (_.isNil(server.userLogChannelId)) {
            return
        }
        try {
            const userLogChannel = await this.client.channels.fetch(server.userLogChannelId);
            if (userLogChannel.isText()) {
                await userLogChannel.send(text);
            }
        } catch (e) {
            if (e instanceof DiscordAPIError && e.message === "Unknown Channel") {
                this.logger.info({ server: server.id, channel: server.userLogChannelId }, "UserLog channel was not found")
                const serverOwner = (await this.client.guilds.fetch(server.id)).owner

                if (_.isNil(serverOwner)) {
                    return
                }
                await serverOwner.send(text)
                await serverOwner.send(`:exclamation: ${this.lng.get("USERLOG_CHANNEL_NOT_AVAILABLE_ANYMORE", server.language)}`)
                return
            }
            throw e
        }

    }

    private createHelpText(language: string) {
        const botCommandsHelp = this.lng.get("HELP_USERLOG_COMMANDS", language)
        const commands = `


\`/userlog setChannel CHANNEL_ID\` ${this.lng.get("HELP_USERLOG_LOG_SET_CHANNEL", language)}
\`/userlog status\` ${this.lng.get("HELP_USERLOG_LOG_STATUS", language)}
\`/userlog toggle\` ${this.lng.get("HELP_USERLOG_TOGGLE", language)}
 `
        return botCommandsHelp + commands
    }

}

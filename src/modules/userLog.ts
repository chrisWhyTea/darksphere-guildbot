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
            const text = `:green_circle: <@${member.id}> hat den server **betreten**.`
            await this.sendNotificationToUserLog(text, server);
        } catch (e) {
            this.logger.error(e)
        }
        return
    }

    async memberRemoveHandler(member: GuildMember | PartialGuildMember): Promise<void> {
        this.logger.info({ memberId: member.id, guildId: member.guild.id }, "member joined")
        try {
            const server = await this.getServerById(member.guild.id)
            if (!server.userLogOnUserEvents) {
                return
            }
            const text = `:red_circle: <@${member.id}> hat den server **verlassen** oder wurde vom server **gekickt**.`
            await this.sendNotificationToUserLog(text, server);
        } catch (e) {
            this.logger.error(e)
        }
        return
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
                    const text = `:yellow_circle: <@${newMember.id}> Nickname wurde geändert von **${oldMemberName}** zu **${newMemberName}**.`
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
                await (await message.author.createDM()).send(noPermissionString)
                return
            }
            if (commandArray.length === 0) {
                await (await message.author.createDM()).send(commandHelpUserlogGeneralString)
                return
            }
            const action = commandArray.shift()
            if (!_.isNil(action) && ["setchannel", "toggle", "status"].includes(action.toLowerCase())) {
                if (action.toLowerCase() === "setchannel") {
                    const channelId = commandArray.shift()
                    if (isNil(channelId)) {
                        await (await message.author.createDM()).send(commandHelpUserlogSetChannelString)
                        return
                    }
                    if (await this.checkIfChannelBelongsToServer(channelId, server.id)) {
                        const serverUpdated = await this.prisma.server.update({
                            where: { id: server.id },
                            data: {
                                userLogChannelId: channelId
                            }
                        })
                        const text = `:yellow_square: <@${message.member.id}> hat den UserLog Channel auf <#${channelId}> gesetzt.`
                        await this.sendNotificationToUserLog(text, serverUpdated);
                    } else {
                        await (await message.author.createDM()).send(commandErrorUnknownChannelString)
                        return
                    }

                } else if (action.toLowerCase() === "toggle") {
                    if (_.isNil(server.userLogChannelId)) {
                        await (await message.author.createDM()).send(commandErrorUserlogNoChannelIdSet)
                        return
                    }
                    await this.prisma.server.update({
                        where: { id: server.id },
                        data: {
                            userLogOnUserEvents: !server.userLogOnUserEvents
                        }
                    })
                    if (server.userLogOnUserEvents) {
                        const text = `:red_square: <@${message.member.id}> hat den UserLog **deaktiviert**.`
                        await this.sendNotificationToUserLog(text, server);

                    } else {
                        const text = `:green_square: <@${message.member.id}> hat den UserLog **aktiviert**.`
                        await this.sendNotificationToUserLog(text, server);
                    }

                } else if (action.toLowerCase() === "status") {
                    var channelText
                    var statusText
                    var status = statusOffString
                    var additionalText = ""
                    const aktivText = `**${aktivString}:**          ${status}`
                    if (server.userLogOnUserEvents) {
                        status = statusOnString
                    }
                    if (!_.isNil(server.userLogChannelId)) {
                        channelText = `**${channelString}:**     <#${server.userLogChannelId}>`
                        statusText = `**${userLogStatusHeaderString}**\n\n${aktivText}\n${channelText}`
                    } else {
                        channelText = `**${channelString}:**     ${noChannelString}`
                        additionalText = statusNoChannelSetString
                    }
                    statusText = `**${userLogStatusHeaderString}**\n\n${aktivText}\n${channelText}${additionalText}`
                    await (await message.author.createDM()).send(statusText)

                }
            } else {
                await (await message.author.createDM()).send(unknownCommandString + "\n\n" + commandHelpUserlogGeneralString)
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
                this.logger.info({server: server.id, channel: server.userLogChannelId},"UserLog channel was not found")
                const serverOwner = (await this.client.guilds.fetch(server.id)).owner

                if (_.isNil(serverOwner)) {
                    return
                }
                await serverOwner.send(text)
                await serverOwner.send(":exclamation: Der UserLog Channel ist für den Bot nichtmehr sichtbar da dem Bot entweder die Rechte genommen wurden oder der Channel gelöscht wurde. \n\nUm diese Nachricht an dich (den Serverbesitzer) zu verhindern, setze einen Channel mit `/userlog setChannel CHANNEL_ID` der vom Bot einsehbar ist. \nAndernfalls verwende `/userlog toggle` um den UserLog auszuschalten.")
                return
            }
            throw e
        }

    }


}
const noPermissionString = ":no_entry_sign: Du hast keine Berechtigung um diesen Befehl zu nutzen."
const unknownCommandString = ":grey_question: Unbekannter Befehl"

const commandHelpUserlogSetChannelString = "`/userlog setChannel CHANNEL_ID` setzt den UserLog Benachrichtigungs Channel, der Channel muss für den Bot sichtbar sein."
const commandHelpUserlogToggleString = "`/userlog toggle` Schaltet die UserLog Benachrichtigungen an oder aus"
const commandHelpUserlogStatusString = "`/userlog status` Gibt den Status des UserLogs zurück"
const commandHelpUserlogGeneralString = "**UserLog Befehle** \n\n" + commandHelpUserlogSetChannelString + "\n" + commandHelpUserlogToggleString + "\n" + commandHelpUserlogStatusString
const commandErrorUnknownChannelString = ":x: Der Channel auf dem Discord Server konnte nicht gefunden werden, bitte versuche es erneut mit der Channel Id eines Channels der für den Bot sichtbar ist."
const commandErrorUserlogNoChannelIdSet = ":x: Es wurde kein UserLog Channel gesetzt. Um den UserLog zu aktivieren muss mit `/userlog setChannel CHANNEL_ID` ein Channel gesetzt werden."
const commandSuccessUserlogSetChannelString = ":white_check_mark: Userlog Channel erfolgreich gesetzt."
const commandSuccessUserlogToggleOnString = ":white_check_mark: Userlog angeschaltet."
const commandSuccessUserlogToggleOffString = ":white_check_mark: Userlog ausgeschaltet."
const statusNoChannelSetString = "\n\n:exclamation: Es wurde kein UserLog Channel gesetzt. Um den UserLog zu aktivieren muss mit `/userlog setChannel CHANNEL_ID` ein Channel gesetzt werden."
const statusOnString = "An :green_square:"
const statusOffString = "Aus :red_square:"
const aktivString = "Aktiv"
const noChannelString = "Kein Channel ausgewählt"
const userLogStatusHeaderString = "UserLog Status"
const channelString = "Channel"

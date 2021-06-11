import { Client, Message } from "discord.js"
import _ from "lodash"
import { BaseLogger } from "pino"
import { Module } from "./module"

export class BotModule extends Module {
    constructor(client: Client, logger: BaseLogger) {
        super(client, logger)
        this.logger.info({ module: "BotModule" }, "module initialized")
    }

    async commandHandler(message: Message, commandArray: string[]) {
        const baseCommand = commandArray.shift()

        if (!_.isNil(baseCommand) && baseCommand.toLowerCase() === "bot") {
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
                await (await message.author.createDM()).send(commandHelpBotGeneralString)
                return
            }
            const action = commandArray.shift()
            if (!_.isNil(action) && ["permissions", "setpermissions", "restart", "log"].includes(action.toLowerCase())) {
                if (action.toLowerCase() === "setpermissions") {
                    const permissionType = commandArray.shift()
                    const roleId = commandArray.shift()
                    if (_.isNil(permissionType) || !["admin", "edit", "view"].includes(permissionType.toLowerCase()) || _.isNil(roleId)) {
                        await (await message.author.createDM()).send(commandHelpBotSetPermissionsString)
                        return
                    }

                    if (await this.checkIfRoleBelongsToServer(roleId, server.id)) {
                        var data = {}
                        if (permissionType.toLowerCase() === "admin") {
                            data = { permissionsAdminRoleId: roleId }
                        } else if (permissionType.toLowerCase() === "edit") {
                            data = { permissionsEditRoleId: roleId }
                        } else if (permissionType.toLowerCase() === "view") {
                            data = { permissionsViewRoleId: roleId }
                        }

                        const serverUpdated = await this.prisma.server.update({
                            where: { id: server.id },
                            data: data
                        })
                        const fetechedRole: any = (await (await this.client.guilds.fetch(server.id)).roles.fetch(roleId))
                        const text = `:white_check_mark: <@${message.member.id}> hat '${permissionType}' Botrechte der Rolle '${fetechedRole.name}' gegeben.`
                        await this.sendBotLogNotification(text, server, message)
                    } else {
                        await (await message.author.createDM()).send(commandErrorUnknownRoleString)
                        return
                    }
                }
                else if (action.toLowerCase() === "restart") {
                    const text = `:recycle: <@${message.member.id}> hat den Bot **neugestartet.**`
                    await this.sendBotLogNotification(text, server, message)
                    process.exit(0)
                }
                if (action.toLowerCase() === "log") {
                    const logAction = commandArray.shift()
                    if (!_.isNil(logAction) && logAction.toLowerCase() === "setchannel") {
                        const channelId = commandArray.shift()
                        if (_.isNil(channelId)) {
                            await (await message.author.createDM()).send(commandHelpBotLogSetChannelString)
                            return
                        }
                        if (await this.checkIfChannelBelongsToServer(channelId, server.id)) {
                            const updatedServer = await this.prisma.server.update({
                                where: { id: server.id },
                                data: {
                                    botLogChannelId: channelId
                                }
                            })
                            const text = `:yellow_square: <@${message.member.id}> hat den BotLog Channel auf <#${channelId}> gesetzt.`
                            await this.sendBotLogNotification(text, updatedServer, message)
                        } else {
                            await (await message.author.createDM()).send(commandErrorUnknownChannelString)
                            return
                        }

                    } else if (!_.isNil(logAction) && logAction.toLowerCase() === "toggle") {
                        if (_.isNil(server.botLogChannelId)) {
                            await (await message.author.createDM()).send(commandErrorBotLogNoChannelIdSet)
                            return
                        }
                        const updatedServer = await this.prisma.server.update({
                            where: { id: server.id },
                            data: {
                                botLogActive: !server.botLogActive
                            }
                        })
                        let text
                        if (updatedServer.botLogActive === true) {
                            text = `:green_square: <@${message.member.id}> hat den BotLog **aktiviert**.`

                        } else {
                            text = `:red_square: <@${message.member.id}> hat den BotLog **deaktiviert**.`


                        }

                        // Make sure the notification always lands in the botlog channel, would suck if not
                        if (updatedServer.botLogActive) {
                            await this.sendBotLogNotification(text, updatedServer, message)
                        } else {
                            await this.sendBotLogNotification(text, server, message)
                        }

                    } else if (!_.isNil(logAction) && logAction.toLowerCase() === "status") {
                        var channelText: string
                        var statusText: string
                        var status: string
                        var additionalText = ""

                        if (server.botLogActive) {
                            status = statusOnString
                        } else {
                            status = statusOffString
                        }
                        const aktivText = `**${aktivString}:**          ${status}`
                        if (!_.isNil(server.botLogChannelId)) {
                            channelText = `**${channelString}:**     <#${server.botLogChannelId}>`
                            statusText = `**${botLogStatusHeaderString}**\n\n${aktivText}\n${channelText}`
                        } else {
                            channelText = `**${channelString}:**     ${noChannelString}`
                            additionalText = statusNoChannelSetString
                        }
                        statusText = `**${botLogStatusHeaderString}**\n\n${aktivText}\n${channelText}${additionalText}`
                        await this.sendBotLogNotification(statusText, server, message)

                    }else{
                        await (await message.author.createDM()).send(commandHelpBotLogGeneralString)
                    }
                }
            } else {
                await (await message.author.createDM()).send(commandHelpBotGeneralString)
                return
            }
        }

    }
}

const noPermissionString = ":no_entry_sign: Du hast keine Berechtigung um diesen Befehl zu nutzen."
const unknownCommandString = ":grey_question: Unbekannter Befehl"
const commandHelpBotRestartString = "`/bot restart` startet den Bot neu"
const commandHelpBotPermissionsString = "`/bot permissions` zeigt die permissions an"
const commandHelpBotLogSetChannelString = "`/bot log setChannel CHANNEL_ID` setzt den BotLog Benachrichtigungs Channel, der Channel muss für den Bot sichtbar sein."
const commandHelpBotLogStatusString = "`/bot log status` Gibt den Status des UserLogs zurück"
const commandHelpBotLogToggleString = "`/bot log toggle` Schaltet die BotLog Benachrichtigungen an oder aus, im fall das die benachrichtigungen aus sind bekommt die person die einen command benutzt eine DM vom Bot"
const commandHelpBotSetPermissionsString = "`/bot setPermissions admin ROLE_ID` setzt die 'admin' Botrechte für die Rolle.\n`/bot setPermissions edit ROLE_ID` setzt die 'edit' Botrechte für die Rolle.\n`/bot setPermissions view ROLE_ID` setzt die 'view' Botrechte für die Rolle."


const commandHelpBotGeneralString = "**Bot Befehle**\nAlle Befehle benötigen 'admin' rechte.\n\n" + commandHelpBotLogSetChannelString + "\n" + commandHelpBotLogStatusString + "\n" + commandHelpBotLogToggleString + "\n" + commandHelpBotPermissionsString + "\n" + commandHelpBotSetPermissionsString + "\n" + commandHelpBotRestartString
const commandHelpBotLogGeneralString = "**BotLog Befehle**\nAlle Befehle benötigen 'admin' rechte.\n\n" + commandHelpBotLogSetChannelString + "\n" + commandHelpBotLogStatusString + "\n" + commandHelpBotLogToggleString


const commandErrorUnknownRoleString = ":x: Die Rolle konnte auf dem Discord Server nicht gefunden werden."

const commandErrorUnknownChannelString = ":x: Der Channel auf dem Discord Server konnte nicht gefunden werden, bitte versuche es erneut mit der Channel Id eines Channels der für den Bot sichtbar ist."
const commandErrorBotLogNoChannelIdSet = ":x: Es wurde kein BotLog Channel gesetzt. Um den BotLog zu aktivieren muss mit `/bot log setChannel CHANNEL_ID` ein Channel gesetzt werden."
const statusOnString = "An :green_square:"
const statusOffString = "Aus :red_square:"
const aktivString = "Aktiv"
const noChannelString = "Kein Channel ausgewählt"
const botLogStatusHeaderString = "BotLog Status"
const channelString = "Channel"
const statusNoChannelSetString = "\n\n:exclamation: Es wurde kein BotLog Channel gesetzt. Um den BotLog zu aktivieren muss mit `/bot log setChannel CHANNEL_ID` ein Channel gesetzt werden."

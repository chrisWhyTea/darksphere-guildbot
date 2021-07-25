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
                await (await message.author.createDM()).send(":no_entry_sign:" + this.lng.get("NO_PERMISSION", server.language))
                return
            }
            if (commandArray.length === 0) {
                await (await message.author.createDM()).send(this.createHelpText(server.language))
                return
            }
            const action = commandArray.shift()
            if (!_.isNil(action) && ["permissions", "setpermissions", "restart", "log", "setlanguage"].includes(action.toLowerCase())) {
                if (action.toLowerCase() === "setpermissions") {
                    const permissionType = commandArray.shift()
                    const roleId = commandArray.shift()
                    if (_.isNil(permissionType) || !["admin", "edit", "view"].includes(permissionType.toLowerCase()) || _.isNil(roleId)) {
                        await (await message.author.createDM()).send(this.createHelpText(server.language))
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
                        const text = `:white_check_mark: <@${message.member.id}> ${this.lng.get("BOT_ROLE_SET_1", server.language)} '${permissionType}' ${this.lng.get("BOT_ROLE_SET_2", server.language)} '${fetechedRole.name}' ${this.lng.get("BOT_ROLE_SET_3", server.language)}`
                        await this.sendBotLogNotification(text, server, message)
                    } else {
                        await (await message.author.createDM()).send(":x: " + this.lng.get("UNKNOWN_ROLE_ERROR", server.language))
                        return
                    }
                }
                else if (action.toLowerCase() === "restart") {
                    const text = `:recycle: <@${message.member.id}> ${this.lng.get("BOT_RESTART", server.language)}`
                    await this.sendBotLogNotification(text, server, message)
                    process.exit(0)
                }
                else if (action.toLowerCase() === "log") {
                    const logAction = commandArray.shift()
                    if (!_.isNil(logAction) && logAction.toLowerCase() === "setchannel") {
                        const channelId = commandArray.shift()
                        if (_.isNil(channelId)) {
                            await (await message.author.createDM()).send(this.createHelpText(server.language))
                            return
                        }
                        if (await this.checkIfChannelBelongsToServer(channelId, server.id)) {
                            const updatedServer = await this.prisma.server.update({
                                where: { id: server.id },
                                data: {
                                    botLogChannelId: channelId
                                }
                            })
                            const text = `:yellow_square: <@${message.member.id}> ${this.lng.get("BOTLOG_NOTIFICATION_CHANNEL_CHANGED_1", server.language)} <#${channelId}> ${this.lng.get("BOTLOG_NOTIFICATION_CHANNEL_CHANGED_2", server.language)}`
                            await this.sendBotLogNotification(text, updatedServer, message)
                        } else {
                            await (await message.author.createDM()).send(":x: " + this.lng.get("BOTLOG_NO_CHANNEL_FOUND", server.language))
                            return
                        }

                    } else if (!_.isNil(logAction) && logAction.toLowerCase() === "toggle") {
                        if (_.isNil(server.botLogChannelId)) {
                            await (await message.author.createDM()).send(":x: " + this.lng.get("BOTLOG_NO_CHANNEL_SET", server.language))
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
                            text = `:green_square: <@${message.member.id}> ${this.lng.get("BOTLOG_ACTIVATED", server.language)}`

                        } else {
                            text = `:red_square: <@${message.member.id}> ${this.lng.get("BOTLOG_DEACTIVATED", server.language)}`


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
                            status = ":green_square: " + this.lng.get("STATE_ON", server.language)
                        } else {
                            status = ":red_square: " + this.lng.get("STATE_OFF", server.language)
                        }
                        const aktivText = `**${this.lng.get("STATE", server.language)}:**        ${status}`
                        if (!_.isNil(server.botLogChannelId)) {
                            channelText = `**${this.lng.get("CHANNEL", server.language)}:**     <#${server.botLogChannelId}>`
                            statusText = `**${this.lng.get("BOTLOG_STATUS_HEADER", server.language)}**\n\n${aktivText}\n${channelText}`
                        } else {
                            channelText = `**${this.lng.get("CHANNEL", server.language)}:**     ${this.lng.get("NO_CHANNEL_SELECTED", server.language)}`
                            additionalText = "\n\n:exclamation:" + this.lng.get("BOTLOG_NO_CHANNEL_SET", server.language)
                        }
                        statusText = `**${this.lng.get("BOTLOG_STATUS_HEADER", server.language)}**\n\n${aktivText}\n${channelText}${additionalText}`
                        await this.sendBotLogNotification(statusText, server, message)

                    } else {
                        await (await message.author.createDM()).send(this.createHelpText(server.language))
                    }
                }
                else if (action.toLowerCase() === "setlanguage") {
                    const language = commandArray.shift()
                    if (_.isNil(language)) {
                        await (await message.author.createDM()).send(this.createHelpText(server.language))
                        return
                    }
                    if (["de", "en"].includes(language)) {
                        const updatedServer = await this.prisma.server.update({
                            where: { id: server.id },
                            data: {
                                language: language
                            }
                        })
                        const text = `:yellow_square: <@${message.member.id}> ${this.lng.get("BOT_LANGUAGE_CHANGED_1", server.language)} '${language}' ${this.lng.get("BOT_LANGUAGE_CHANGED_2", server.language)}`
                        await this.sendBotLogNotification(text, updatedServer, message)
                    } else {
                        await (await message.author.createDM()).send(":x: " + this.lng.get("BOT_SET_LANGUAGE_NOT_SUPPORTED", server.language))
                        return
                    }
                }
            } else {
                await (await message.author.createDM()).send(this.createHelpText(server.language))
                return
            }
        }

    }

    private createHelpText(language: string) {
        const botCommandsHelp = this.lng.get("HELP_BOT_COMMANDS", language)
        const commands = `

\`/bot restart\` ${this.lng.get("HELP_BOT_RESTART", language)}
\`/bot log setChannel CHANNEL_ID\` ${this.lng.get("HELP_BOT_LOG_SET_CHANNEL", language)}
\`/bot log status\` ${this.lng.get("HELP_BOT_LOG_STATUS", language)}
\`/bot log toggle\` ${this.lng.get("HELP_BOT_TOGGLE", language)}
\`/bot setPermissions admin ROLE_ID\` ${this.lng.get("HELP_BOT_SET_ADMIN_PERMISSIONS", language)}
\`/bot setPermissions edit ROLE_ID\` ${this.lng.get("HELP_BOT_SET_EDIT_PERMISSIONS", language)}
\`/bot setPermissions view ROLE_ID\` ${this.lng.get("HELP_BOT_SET_VIEW_PERMISSIONS", language)}
\`/bot setLanguage de|en\` ${this.lng.get("HELP_BOT_SET_LANGUAGE", language)}
 `
        return botCommandsHelp + commands
    }
}

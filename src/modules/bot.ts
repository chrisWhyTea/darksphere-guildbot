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
            if (!_.isNil(action) && ["permissions","setpermissions", "restart"].includes(action.toLowerCase())) {
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
                        const text = `:white_check_mark: Du hast '${permissionType}' Bot rechte der Rolle '${fetechedRole.name}' gegeben.`
                        await (await message.author.createDM()).send(text);
                    } else {
                        await (await message.author.createDM()).send(commandErrorUnknownRoleString)
                        return
                    }
                }
                else if (action.toLowerCase() === "restart") {
                    process.exit(0)
                }
            } else {
                await (await message.author.createDM()).send(unknownCommandString + "\n\n" + commandHelpBotGeneralString)
                return
            }
        }

    }

}

const noPermissionString = ":no_entry_sign: Du hast keine Berechtigung um diesen Befehl zu nutzen."
const unknownCommandString = ":grey_question: Unbekannter Befehl"
const commandHelpBotRestartString = "`/bot restart` startet den Bot neu"
const commandHelpBotPermissionsString = "`/bot permissions` zeigt die permissions an"
const commandHelpBotSetPermissionsString = "`/bot setPermissions admin ROLE_ID` setzt die 'admin' Botrechte für die Rolle.\n`/bot setPermissions edit ROLE_ID` setzt die 'edit' Botrechte für die Rolle.\n`/bot setPermissions view ROLE_ID` setzt die 'view' Botrechte für die Rolle."
const commandHelpBotGeneralString = "**Bot Befehle**\n Alle Befehle benötigen 'admin' rechte.\n\n" + commandHelpBotPermissionsString + "\n" + commandHelpBotSetPermissionsString + "\n" + commandHelpBotRestartString
const commandErrorUnknownRoleString = ":x: Die Rolle konnte auf dem Discord Server nicht gefunden werden."
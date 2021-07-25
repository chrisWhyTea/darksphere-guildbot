import _ from "lodash"

const strings = {
    NO_PERMISSION: {
        en: "You have no permissions to use the command.",
        de: "Du hast keine Berechtigung um diesen Befehl zu nutzen.",
    },
    BOTLOG_NO_CHANNEL_SET: {
        en: "No BotLog channel was set. To activate the BotLog, set a channel with `/bot log setChannel CHANNEL_ID`",
        de: "Es wurde kein BotLog Channel gesetzt. Um den BotLog zu aktivieren muss mit `/bot log setChannel CHANNEL_ID` ein Channel gesetzt werden."
    },
    BOTLOG_NO_CHANNEL_FOUND: {
        en: "The channel was not found on this discord server, please retry with an channel id of an channel on this server that is visible for the bot.",
        de: "Der Channel konnte auf dem Discord Server nicht gefunden werden, bitte versuche es erneut mit der Channel Id eines Channels der für den Bot sichtbar ist."
    },
    BOTLOG_NOTIFICATION_CHANNEL_CHANGED_1: {
        en: "changed the BotLog channel to ",
        de: "hat den BotLog Channel auf "
    },
    BOTLOG_NOTIFICATION_CHANNEL_CHANGED_2: {
        en: ".",
        de: "gesetzt."
    },
    BOTLOG_ACTIVATED: {
        en: "**activated** the BotLog.",
        de: "hat den BotLog **aktiviert**."
    },
    BOTLOG_DEACTIVATED: {
        en: "**deactivated** the BotLog.",
        de: "hat den BotLog **deaktiviert**."
    },
    BOTLOG_CHANNEL_NOT_AVAILABLE_ANYMORE: {
        en: "The BotLog channel is not visible to the bot anymore due to missing permissions or the channel was deleted.\n\n To disable this message for you (server owner), set a channel with `/bot log setChannel CHANNEL_ID` for a channel the bot can see. \nOtherwise use `/bot log toggle` to disable the BotLog.",
        de: "Der BotLog Channel ist für den Bot nichtmehr sichtbar da dem Bot entweder die Rechte genommen wurden oder der Channel gelöscht wurde. \n\nUm diese Nachricht an dich (den Serverbesitzer) zu verhindern, setze einen Channel mit `/bot log setChannel CHANNEL_ID` der vom Bot einsehbar ist. \nAndernfalls verwende `/bot log toggle` um den UserLog auszuschalten."
    },
    BOT_RESTART: {
        en: "**restarted** the Bot.",
        de: "hat den Bot **neugestartet*."
    },
    BOT_ROLE_SET_1: {
        en: "gave",
        de: "hat"
    },
    BOT_ROLE_SET_2: {
        en: "bot rights to the role",
        de: "Botrechte der Rolle"
    },
    BOT_ROLE_SET_3: {
        en: ".",
        de: "gegeben."
    },
    BOTLOG_STATUS_HEADER: {
        en: "BotLog state",
        de: "BotLog Status"
    },
    STATE_ON: {
        en: "On",
        de: "An",
    },
    STATE_OFF: {
        en: "Off",
        de: "Aus",
    },
    STATE: {
        en: "State",
        de: "Status",
    },
    CHANNEL: {
        en: "Channel",
        de: "Channel",
    },
    NO_CHANNEL_SELECTED: {
        en: "No channel selected",
        de: "Kein Channel ausgewählt",
    },
    HELP_BOT_RESTART: {
        en: "restarts the bot",
        de: "startet den Bot neu",
    },
    HELP_BOT_PERMISSIONS: {
        en: "show bot rights",
        de: "zeigt die bot rechte an",
    },
    HELP_BOT_LOG_SET_CHANNEL: {
        en: "set the BotLog notification channel, this channel requires to be visible to the bot",
        de: "setzt den BotLog Benachrichtigungs Channel, der Channel muss für den Bot sichtbar sein.",
    },
    HELP_BOT_LOG_STATUS: {
        en: "Get the state of the BotLog.",
        de: "Gibt den Status des BotLog zurück.",
    },
    HELP_BOT_TOGGLE: {
        en: "toggles the BotLog Notifications, in case the notifications are 'off' the person who sends a command gets the corresponding notification as DM.",
        de: "schaltet die BotLog Benachrichtigungen an oder aus, im fall das die benachrichtigungen aus sind bekommt die person die einen command benutzt eine DM vom Bot",
    },
    HELP_BOT_SET_ADMIN_PERMISSIONS: {
        en: "set the 'admin' bot rights for this role.",
        de: "setzt die 'admin' Botrechte für die Rolle.",
    },
    HELP_BOT_SET_EDIT_PERMISSIONS: {
        en: "set the 'edit' bot rights for this role.",
        de: "setzt die 'edit' Botrechte für die Rolle.",
    },
    HELP_BOT_SET_VIEW_PERMISSIONS: {
        en: "set the 'view' bot rights for this role.",
        de: "setzt die 'view' Botrechte für die Rolle.",
    },
    HELP_BOT_SET_LANGUAGE: {
        en: "set the language of the bot.",
        de: "setzt die Sprache des Bots.",
    },
    HELP_BOT_COMMANDS: {
        en: "**Bot Commands**\nAll commands require 'admin' rights.",
        de: "**Bot Befehle**\nAlle Befehle benötigen 'admin' rechte.",
    },
    UNKNOWN_ROLE_ERROR: {
        en: "Could not find the role on this Discord Server",
        de: "Die Rolle konnte auf dem Discord Server nicht gefunden werden.",
    },
    BOT_LANGUAGE_CHANGED_1: {
        en: "set the language of the bot to",
        de: "hat die Sprache des Bots auf",
    },
    BOT_LANGUAGE_CHANGED_2: {
        en: ".",
        de: "gesetzt.",
    },
    BOT_SET_LANGUAGE_NOT_SUPPORTED: {
        en: "Language not supported",
        de: "Diese Sprache wird nicht unterstützt.",
    },
    USERLOG_USER_JOINED:{
        en: "**joined** the Server",
        de: "hat den Server **betreten**."
    },
    USERLOG_USER_LEFT:{
        en: "**left** the Server or was **kicked**.",
        de: "hat den Server **verlassen** oder wurde vom Server **gekickt**."
    },
    USERLOG_USER_NICKNAME_CHANGED_1:{
        en: "nickname changed from",
        de: "Nickname wurde geändert von"
    },
    USERLOG_USER_NICKNAME_CHANGED_2:{
        en: "to",
        de: "zu"
    },
    USERLOG_NOTIFICATION_CHANNEL_CHANGED_1: {
        en: "changed the UserLog channel to",
        de: "hat den UserLog Channel auf"
    },
    USERLOG_NOTIFICATION_CHANNEL_CHANGED_2: {
        en: ".",
        de: "gesetzt."
    },
    USERLOG_ACTIVATED: {
        en: "**activated** the UserLog.",
        de: "hat den UserLog **aktiviert**."
    },
    USERLOG_DEACTIVATED: {
        en: "**deactivated** the UserLog.",
        de: "hat den UserLog **deaktiviert**."
    },
    USERLOG_CHANNEL_NOT_AVAILABLE_ANYMORE: {
        en: "The UserLog channel is not visible to the bot anymore due to missing permissions or the channel was deleted.\n\n To disable this message for you (server owner), set a channel with `/userlog setChannel CHANNEL_ID` for a channel the bot can see. \nOtherwise use `/userlog toggle` to disable the UserLog.",
        de: "Der UserLog Channel ist für den Bot nichtmehr sichtbar da dem Bot entweder die Rechte genommen wurden oder der Channel gelöscht wurde. \n\nUm diese Nachricht an dich (den Serverbesitzer) zu verhindern, setze einen Channel mit `/userlog setChannel CHANNEL_ID` der vom Bot einsehbar ist. \nAndernfalls verwende `/userlog toggle` um den UserLog auszuschalten."
    },
    USERLOG_NO_CHANNEL_FOUND: {
        en: "The channel was not found on this discord server, please retry with an channel id of an channel on this server that is visible for the bot.",
        de: "Der Channel konnte auf dem Discord Server nicht gefunden werden, bitte versuche es erneut mit der Channel Id eines Channels der für den Bot sichtbar ist."
    },
    USERLOG_STATUS_HEADER: {
        en: "UserLog state",
        de: "UserLog Status"
    },
    USERLOG_NO_CHANNEL_SET: {
        en: "No UserLog channel was set. To activate the UserLog, set a channel with /userlog setChannel CHANNEL_ID`",
        de: "Es wurde kein UserLog Channel gesetzt. Um den UserLog zu aktivieren muss mit `/userlog setChannel CHANNEL_ID` ein Channel gesetzt werden."
    },
    HELP_USERLOG_COMMANDS: {
        en: "**UserLog Commands**\nAll commands require 'admin' rights.",
        de: "**UserLog Befehle**\nAlle Befehle benötigen 'admin' rechte.",
    },
    HELP_USERLOG_LOG_SET_CHANNEL: {
        en: "set the UserLog notification channel, this channel requires to be visible to the bot",
        de: "setzt den UserLog Benachrichtigungs Channel, der Channel muss für den Bot sichtbar sein.",
    },
    HELP_USERLOG_LOG_STATUS: {
        en: "Get the state of the UserLog.",
        de: "Gibt den Status des UserLog zurück.",
    },
    HELP_USERLOG_TOGGLE: {
        en: "toggles the UserLog Notifications.",
        de: "schaltet die UserLog Benachrichtigungen an oder aus.",
    },

}

export class Language {
    get(key: string, language: string): string {
        const value = _.get(strings, key, key)
        if (_.isNil(value)) {
            return key
        }
        const languageValue = _.get(value, language, key)
        if (_.isNil(languageValue)) {
            return key
        }
        return languageValue

    }
}
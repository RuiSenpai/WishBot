let Database = require('./../../utils/Database.js'),
    utils = require('./../../utils/utils.js');

module.exports = {
    usage: `Used to toggle and configure settings. Configurable settings include automated table unflipping as well as welcome and leave messages. Welcome and Join messages are sent in the channel in which the command is used and can be cleared by leaving the message field blank.

__Welcome/Leave Messages can include the following text to return different things:__\`\`\`ruby
     [GuildName]: Server Name
[ChannelMention]: Mention to Current Channel
   [ChannelName]: Name of the Current Channel
      [UserName]: Name of the User
   [UserMention]: Mention to the User*

*Does not work in leave messages
\`\`\`

\`setting tableflip\`
\`setting [leave] or [welcome] and [message] or [none]\``,
    delete: true,
    togglable: false,
    cooldown: 5,
    process: (bot, msg, suffix) => {
        if (suffix.toLowerCase() === 'tableflip') Database.toggleSetting(msg.channel.guild, suffix, null, msg.channel).then(result => bot.createMessage(msg.channel.id, "⚙ " + result + " ⚙").then(message => utils.messageDelete(bot, message))).catch()
        else if (suffix.toLowerCase().startsWith('welcome') || suffix.toLowerCase().startsWith('leave')) {
            let setting = suffix.split(' ')[0],
                message = suffix.substring(setting.length + 1, suffix.length);
            if (message.length > 256) bot.createMessage(msg.channel.id, "🚫 Welcome/Leave Messages are limited to 256 characters in length. 🚫").catch()
            else Database.toggleSetting(msg.channel.guild, setting, message, msg.channel).then(result => bot.createMessage(msg.channel.id, "⚙ " + result + " ⚙").then(message => utils.messageDelete(bot, message))).catch()
        } else bot.createMessage(msg.channel.id, "🚫 `" + suffix.split(' ')[0] + "` isn't an available setting 🚫").then(message => utils.messageDelete(bot, message)).catch()
    }
}
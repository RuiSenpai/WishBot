let mysql = require('mysql'),
    fs = require('fs'),
    options = require('./../options/options.json'),
    pool = mysql.createPool({
        connectionLimit: 100,
        host: 'localhost', //Its local you cant do anything anyway
        port: '3306',
        user: 'Onee',
        password: 'Boudreau18!',
        database: 'database'
    }),
    utils = require('./utils.js'),
    guildPrefixes = require('./../database/guildPrefixes.json')

function addGuild(guild) {
    return new Promise((resolve, reject) => {
        pool.query('INSERT INTO server_settings SET guild_id = ?', guild.id, (err, result) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

exports.removeGuild = (guild) => {
    return new Promise((resolve, reject) => {
        pool.query('DELETE FROM server_settings WHERE guild_id = ' + guild.id, (err, result) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

//Ignore Channel Stuffs
exports.ignoreChannel = channel => {
    return new Promise((resolve, reject) => {
        pool.query('INSERT INTO channel_ignores SET channel_id = ' + channel.id, (err, result) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

exports.unignoreChannel = channel => {
    return new Promise((resolve, reject) => {
        pool.query('DELETE FROM channel_ignores WHERE channel_id = ' + channel.id, (err, result) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

exports.checkChannel = channel => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM channel_ignores WHERE channel_id = ' + channel.id, (err, result) => {
            if (err) resolve();
            else if (result.length >= 1) reject();
            else resolve();
        });
    });
}

//Command Stuffs
function toggleCommand(guild, command) {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM server_settings WHERE guild_id = ' + guild.id, (err, result) => {
            if (result.length === 0) addGuild(guild).then(() => toggleCommand(guild, command).then(action => resolve(action))).catch(err => reject(err))
            else {
                let toggled = false;
                if (result[0].disabled_commands != undefined) {
                    var disabled = JSON.parse(result[0].disabled_commands);
                    if (disabled.hasOwnProperty(command)) delete disabled[command];
                    else {
                        disabled[command] = true;
                        toggled = true;
                    }
                } else {
                    var disabled = {};
                    disabled[command] = true;
                    toggled = true;
                }
                let data = {
                    guild_id: guild.id,
                    disabled_commands: JSON.stringify(disabled)
                }
                saveGuild(guild, data).then(() => resolve(`Sucessfully toggled \`${command}\` to \`${!toggled}\``)).catch(console.log)
            }
        });
    });
}

function saveGuild(guild, data) {
    return new Promise((resolve, reject) => {
        pool.query('UPDATE server_settings SET ? WHERE guild_id = ' + guild.id, data, (err, res) => {
            if (err) console.log(err);
            else resolve();
        })
    });
}

exports.checkCommand = (guild, command) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT disabled_commands FROM server_settings WHERE guild_id = ' + guild.id, (err, result) => {
            if (err || result.length === 0) resolve();
            else {
                let disabled = JSON.parse(result[0].disabled_commands)
                if (disabled && disabled[command] != undefined) reject();
                else resolve();
            }
        });
    });
}

exports.toggleCommand = toggleCommand;

//Settings
function toggleSetting(guild, settingChange, message) {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM server_settings WHERE guild_id = ' + guild.id, (err, result) => {
            if (result.length === 0) addGuild(guild).then(() => toggleSetting(guild, settingChange, message).then(action => resolve(action))).catch(err => reject(err))
            else {
                settingChange = settingChange.toLowerCase();
                var toggled = false;
                var serverSettings = result[0].settings != undefined ? JSON.parse(result[0].settings) : {};
                if (settingChange === 'tableflip') {
                    if (serverSettings.hasOwnProperty('tableflip')) delete serverSettings['tableflip'];
                    else {
                        serverSettings['tableflip'] = true;
                        toggled = true;
                    }
                } else if (settingChange === 'welcome') {
                    if (message) {
                        serverSettings['welcome'] = message;
                        toggled = true;
                    } else delete serverSettings['welcome'];
                } else if (setting === 'leave') {
                    if (settingChange) {
                        serverSettings['leave'] = message;
                        toggled = true;
                    } else delete serverSettings['leave'];
                }
                let data = {
                    guild_id: guild.id,
                    settings: JSON.stringify(serverSettings)
                }
                saveGuild(guild, data).then(() => resolve(`Sucessfully toggled \`${settingChange}\` to \`${toggled}\``)).catch(console.log)
            }

        });
    });
}

exports.checkSetting = (guild, setting) => {
    return new Promise((resolve, reject) => {
        pool.query('SELECT * FROM server_settings WHERE guild = ' + guild.id, (err, result) => {
            if (err || result.length === 0) resolve();
            else {
                let disabled = JSON.parse(result[0].settings)
                if (disabled[command] != undefined) reject();
                else resolve();
            }
        });
    });
}

exports.toggleSetting = toggleSetting;

//Prefix Stuff
function addGuildtoJson(guild) {
    return new Promise((resolve, reject) => {
        guildPrefixes[guild.id] = {};
        resolve();
    });
}

function changePrefix(guild, newPrefix) {
    return new Promise((resolve, reject) => {
        if (guildPrefixes.hasOwnProperty(guild.id)) {
            if (newPrefix === options.prefix) {
                delete guildPrefixes[guild.id];
                resolve();
            } else if (newPrefix.includes(' ')) {
                reject('Prefixes cannot contain spaces');
            } else {
                guildPrefixes[guild.id] = newPrefix;
                resolve();
            }
        } else {
            addGuildtoJson(guild).then(() => changePrefix(guild, newPrefix).then(() => resolve()))
        }
        savePrefixes();
    });
}
exports.changePrefix = changePrefix;

exports.checkPrefix = (guild) => {
    if (guildPrefixes.hasOwnProperty(guild.id)) return guildPrefixes[guild.id];
}


function savePrefixes() {
    fs.writeFile(__dirname + '/../database/guildPrefixes-temp.json', JSON.stringify(guildPrefixes, null, 4), error => {
        if (error) console.log(errorC(error))
        else {
            fs.stat(__dirname + '/../database/guildPrefixes-temp.json', (err, stats) => {
                if (err) console.log(errorC(err))
                else if (stats["size"] < 5) console.log("ERROR due to size");
                else {
                    fs.rename(__dirname + '/../database/guildPrefixes-temp.json', __dirname + '/../database/guildPrefixes.json', e => {
                        if (e) console.log(errorC(e));
                    });
                }
            });
        }
    })
}
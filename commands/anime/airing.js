require("moment-duration-format");
let options = require('./../../options/options.json'),
    nani = require('nani').init(options.nani_id, options.nani_secret),
    moment = require('moment'),
    utils = require('./../../utils/utils.js'),
    weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    seasons = ['winter', 'spring', 'summer', 'fall'],
    url = 'browse/anime?status=Currently%20Airing&full_page=true&type=Tv&airing_data=true&sort=popularity-desc',
    airingAnime;


//Will work on more when api is updated
module.exports = {
    usage: 'Returns a paged list of currently airing anime. Input the page number to see airing anime on that page. Can also return more specific details if an anime is specified. Please Note time til airing is not 100% accurate\n`airing [none] or [page number] or [anime]`',
    delete: true,
    cooldown: 5,
    process: (bot, msg, suffix) => {
        bot.sendChannelTyping(msg.channel.id).catch()
        nani.get(url)
            .then(data => {
                console.log(data)
                airingAnime = data.filter(isAiring);
                processAnime(bot, msg, suffix);
            }).catch();
    }
}

function processAnime(bot, msg, suffix) {
    if (/^[0-9]$/.test(suffix) || !suffix) {
        let currentAnime = airingAnime.map(title => title.title_english + " | " + weekday[new Date(title.airing.time).getDay()]);
        let pagedTitles = utils.splitArray(currentAnime, 10);
        ((suffix - 1 < pagedTitles.length) && suffix) ? page = suffix - 1 : page = 0;
        let msgString = `\`\`\`markdown\n### Airing Anime for the ${utils.toTitleCase(seasons[getSeason()])} Season: (Page ${page+1}/${pagedTitles.length}) ###\n`;
        msgString += pagedTitles[page].map((value, position) => '[' + (position + 1 + (page * 10)) + ']: ' + value).join('\n');
        bot.createMessage(msg.channel.id, msgString + "```").catch(err => console.log(errC(err)));
    } else if (airingAnime.find(title => isAnime(title, suffix))) {
        let anime = airingAnime.find(title => isAnime(title, suffix)),
            msgString = '```ruby\n';
        msgString += `Title: ${anime.title_english}\n`
        msgString += `Romaji Title: ${anime.title_romaji}\n`;
        msgString += `Japanese Title: ${anime.title_japanese}\n\n`;
        msgString += `Next Episode: ${anime.airing.next_episode}/${anime.total_episodes || '?'} | Airing: ${moment(anime.airing.time).utc().format('dddd HH:mm')} UTC\n`;
        msgString += `Time Til Airing: ${moment.duration(anime.airing.countdown).format('D[day(s)] H[hour(s)] m[minute(s)]')}`
        bot.createMessage(msg.channel.id, msgString + "```").catch(console.log)
    } else bot.createMessage(msg.channel.id, 'No Airing Anime found called `' + suffix + '`, **' + msg.author.username + '**-senpai.').then(message => utils.messageDelete(bot, message)).catch(console.log);
}

function isAiring(title) {
    if (title.airing != null) return title;
}

function isAnime(title, suffix) {
    if (new RegExp(suffix, "i").test(title.title_english)) return title;
}

function getSeason() {
    let season = (new Date()).getMonth();
    if (season === 0 || season === 1 || season === 2) return 0;
    else if (season === 3 || season === 4 || season === 5) return 1;
    else if (season === 6 || season === 7 || season === 8) return 2;
    else if (season === 9 || season === 10 || season === 11) return 3;
}
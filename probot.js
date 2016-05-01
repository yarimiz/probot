var Botkit = require('botkit');
var moment = require('moment');
var schedule = require('node-schedule');
var http = require('http');

http.createServer(function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
}).listen(process.env.PORT);


var controller = Botkit.slackbot({
    debug: false,
    log: true,
    json_file_store: "db"
        //include "log: false" to disable logging
        //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});

var signedPlayers = []
var rolledGames = []

var clearDataJob = schedule.scheduleJob('0 0 0 1/1 * ? *', function() {
    signedPlayers = []
    rolledGames = []
});

// connect the bot to a stream of messages
controller.spawn({
    token: "xoxb-37892585655-vsraLj0sE2B0mODftTT5Z2I1",
}).startRTM()

// give the bot something to listen for.
controller.hears(['Ani', 'אני', 'signin'], ['direct_message'], function(bot, message) {
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            if (signedPlayers.indexOf(user.name) == -1) {
                bot.reply(message, 'OK, ' + user.name + '! I signed you up');
                bot.say({
                    type: "message",
                    text: user.name + ' wants to play today',
                    channel: "C1431N087"
                });
                signedPlayers.push(user.name);
            } else {
                bot.reply(message, user.name + ', you are already signed for today');
            }
        }
    });
});

controller.hears(['signout'], ['direct_message'], function(bot, message) {
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            var indexOfPlayer = signedPlayers.indexOf(user.name);
            if (indexOfPlayer > -1) {
                signedPlayers.splice(indexOfPlayer, 1);
                bot.reply(message, 'OK, You wont play today');
                bot.say({
                    type: "message",
                    text: user.name + ' wont play today.',
                    channel: "C1431N087"
                });

            } else {
                bot.reply(message, user.name + ', you are not even registered!');
            }
        }
    });
});

controller.hears('whois', ['direct_message', 'direct_mention', 'mention', 'ambient'], function(bot, message) {
    bot.startConversation(message, whois);
});

controller.hears('showgames', ['direct_message', 'direct_mention', 'mention', 'ambient'], function(bot, message) {
    bot.startConversation(message, showGames);
});

showGames = function(response, convo) {
    if (rolledGames.length > 0) {
        convo.say("Total of " + rolledGames.length + " games:");
        for (i = 0; i < rolledGames.length; i++) {
            convo.say("Game #" + (i + 1) + ": " + rolledGames[i].toString());
        }
    } else {
        convo.say("No games rolled for today yet");
    }
}

whois = function(response, convo) {
    convo.say("Total players: " + signedPlayers.length);
    convo.say(signedPlayers.toString())
}

controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message', function(bot, message) {
    var maxNameLength = 13;
    var name = message.match[1];
    if(name.length > maxNameLength){
        name = name.substring(0, maxNameLength);
        bot.reply(message,"Sorry, your name is too long. I trimmed it to " + name)
    }
        
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
                name: name
            };
            
            controller.storage.users.save(user, function(err, id) {
                bot.reply(message, 'Hi ' + user.name + '! Happy to meet you.');
            });
        }else{
            bot.reply(message, "You already exist " + user.name + ". Don't fuck with me");
        }
    });

});

controller.hears('Play', ['ambient'], function(bot, message) {
    var now = new Date;
    if (now.getHours() >= 18) {
        bot.startConversation(message, rollAGame);
    } else {
        bot.reply(message, "Sorry, it's not 18:00 yet. No game! " + now);
    }
});

controller.hears('help', ['direct_message', 'direct_mention', 'mention', 'ambient'], function(bot, message) {
    var now = new Date;
    bot.startConversation(message, showHelp);
});

showHelp = function(response, convo) {
    convo.say("I am Pro-Bot. Here is the commands I support:")
    convo.say("First of all, I have to know you - write 'call me [yourname]' so I will know your name");
    convo.say("'Ani'/'אני'/'signup' to sign in for today's game (Works only in private message to the bot)");
    convo.say("'Signout' to sign out from today's game (Works only in private message to the bot)");
    convo.say("'whois' to see who is signed in for today");
    convo.say("'play' to roll games for today (Works only in #misc-soccer-il channel and after 17:30)");
    convo.say("'showGames' to see the rolled games for today");
}

rollAGame = function(response, convo) {
    convo.say("Starting to roll games, Enjoy and play safe!");
    convo.say("Total players: " + signedPlayers.length);
    if (signedPlayers.length > 0) {
        var numOfPossibleGames = Math.ceil(signedPlayers.length / 4);
        var gamesList = [numOfPossibleGames];
        for (gameNum = 1; gameNum <= numOfPossibleGames; gameNum++) {
            var thisGamePlayers = [];
            for (playersNum = 1; playersNum <= 4; playersNum++) {
                if (signedPlayers.length > 0) {
                    var randIndex = Math.floor(Math.random() * signedPlayers.length);
                    thisGamePlayers.push(signedPlayers[randIndex]);
                    signedPlayers.splice(randIndex, 1);
                }
            }
            rolledGames.push(thisGamePlayers);

            convo.say("Game #" + gameNum + ": " + thisGamePlayers.toString());
        }
    } else {
        convo.say("Sorry, no players today");
    }
}
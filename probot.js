var Botkit = require('botkit');
var moment = require('moment');
var schedule = require('node-schedule');
 
var controller = Botkit.slackbot({
  debug: false,
  log: true,
  json_file_store: "db"
  //include "log: false" to disable logging
  //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});

var signedPlayers = []
var rolledGames = []

var clearDataJob = schedule.scheduleJob('0 0 0 1/1 * ? *', function(){
  signedPlayers = []
  rolledGames = []
});

var postGamesJob = schedule.scheduleJob('0 55 17 ? * SUN-THU *', function(){
    bot.say({
        type: "message",
        text: "play",
        channel: "C1431N087"
    })
});

// connect the bot to a stream of messages
controller.spawn({
  token: "xoxb-37892585655-vsraLj0sE2B0mODftTT5Z2I1",
}).startRTM()

// give the bot something to listen for.
controller.hears(['Ani','אני','signin'],['direct_message','direct_mention','mention','message_received'],function(bot,message) {
	controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
			if(signedPlayers.indexOf(user.name) == -1){
				bot.reply(message, 'Hello ' + user.name + '! You are now registered');
                bot.say(
                    {
                        type: "message",
                        text: user.name + ' has joined the list',
                        channel: "C1431N087"
                    }
                );
				signedPlayers.push(user.name);
			} else {
				bot.reply(message, user.name + ', you are already registered!');
			}
        }
    });
});

controller.hears(['signout'],['direct_message','direct_mention','mention'],function(bot,message) {
	controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            var indexOfPlayer = signedPlayers.indexOf(user.name);
			if(indexOfPlayer > -1){
                signedPlayers.splice(indexOfPlayer,1);
				bot.reply(message, 'OK, You wont play today');
                bot.say(
                    {
                        type: "message",
                        text: user.name + ' wont play today.',
                        channel: "C1431N087"
                    }
                );
				
			} else {
				bot.reply(message, user.name + ', you are not even registered!');
			}
        }
    });
});

controller.hears('whois', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    bot.startConversation(message, whois);
});

controller.hears('showgames', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    bot.startConversation(message, showGames);
});

showGames = function(response, convo){
    for(i = 1; i <= rolledGames; i++){
        convo.say("Game #" + i + ": " + rolledGames[i].toString());
    }
}

whois = function(response, convo){
    convo.say("Total players: " + signedPlayers.length);
    convo.say(signedPlayers.toString())
}

controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
		
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Hi ' + user.name + '! Happy to meet you.');
        });
    });
});

controller.hears('Play', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    var now = new Date;
    //if(now.getHours() > 17 && now.getMinutes() > 30){
        bot.startConversation(message, rollAGame);
    //}
    //else{
    //    bot.reply(message, "Sorry, it's not 17:30 yet. No game!");
    //}
});

rollAGame = function(response, convo) {
    convo.say("Starting to roll games, Enjoy and play safe!");
    convo.say("Total players: " + signedPlayers.length);
    if(signedPlayers.length > 0){
        var numOfPossibleGames = Math.ceil(signedPlayers.length / 4);
        var gamesList = [numOfPossibleGames];
        for(gameNum = 1; gameNum <= numOfPossibleGames; gameNum++){
            var thisGamePlayers = [];
            for(playersNum = 1; playersNum <= 4; playersNum++){
                if(signedPlayers.length > 0){
                    var randIndex = Math.floor(Math.random() * signedPlayers.length);
                    thisGamePlayers.push(signedPlayers[randIndex]);
                    signedPlayers.splice(randIndex,1);
                }
            }
            rolledGames.push(thisGamePlayers);
            
            convo.say("Game #" + gameNum + ": " + thisGamePlayers.toString());
        }
    }else{
        convo.say("Sorry, no players today");
    }
}


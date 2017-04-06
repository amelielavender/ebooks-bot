/********************************************

 _._     _,-'""`-._
(,-.`._,'(       |\`-/|
    `-.-' \ )-`( , o o)
          `-    \`_`"'-  
          
     licensed under the MIT license
github.com/almondette/ebooks-bot/blob/master/LICENSE

     markov tweetbot generator by amelie!
     this is my first google script, i 
     hope it serves you well.
     
     adapted from zach whalen's ssbot, 
     mostly the bot menu functions.
     the rest is mine and i'm proud!
     
     feel free to edit or remove the code
     as you wish, with attribution.

********************************************/


/*****************
  ADD 'BOT' MENU
*****************/

function onOpen() {

    var ui = SpreadsheetApp.getUi();
    ui.createMenu('Bot')

        .addItem('Generate Preview', 'preview')
        .addSeparator()
        .addItem('Send a Test Tweet', 'makeSingleTweet')
        .addItem('Revoke Twitter Authorization', 'authRevoke')
        .addSeparator()
        .addItem('Start Posting Tweets', 'setTiming')
        .addItem('Stop Posting Tweets', 'clearTiming')
        .addToUi();
};

/*****************
GENERATE PREVIEWS
*****************/

function preview() {

    var preview = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('preview');
    preview.getRange('B4:B20').setValue(' ');
    SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(preview);

    for (var p = 0; p < 16; p++) {
        var offset = p + 5;
        var prv = getEbooksText(10); // change this value if you want more or less preview output
        preview.getRange('b' + offset).setValue(prv);
    }

}

/*****************
  YOUR BBY BOT!
*****************/

function getEbooksText() {

    var ebooks = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ebooks.getSheetByName('settings')
    var archiveUrl = sheet.getRange('D32').getValue();

    var ss = SpreadsheetApp.openByUrl(archiveUrl);

    var archive = ss.getSheetByName('Archive');
    var lastRow = archive.getLastRow();

    var startwords = [];
    var endwords = {};
    var tweets = {};

    var allTweets = archive.getRange('C1:C' + lastRow).getValues();
  
    for (var i = 0; i < allTweets.length; i++) {
        var words = allTweets[i][0].split(' ');
        endwords[words[words.length - 1]] = true;
        startwords.push(words[0]);
        for (var j = 0; j < words.length - 1; j++) {
            if (tweets.hasOwnProperty(words[j])) {
                tweets[words[j]].push(words[j + 1]);
            } else {
                tweets[words[j]] = [words[j + 1]];
            }
        }
    }

    var choice = function (w) {
        var i = Math.floor(w.length * Math.random());
        return w[i];
    };

    var shitpost = function (min_length) {
        word = choice(startwords);
        var msg = [word];
        while (tweets.hasOwnProperty(word)) {
            var next_words = tweets[word];
            word = choice(next_words);
            msg.push(word);
            if (msg.length > min_length && endwords.hasOwnProperty(word)) break;
        }
        if (msg.length < min_length) return shitpost(min_length);
        return msg.join(' ');
    };

    var msg = shitpost(5 + Math.floor(5 * Math.random()));
    var noLinks = [
              "https?:\/\/t\.co\/[a-z0-9]+",
              "@[a-z0-9_]+",
              "RT:?",
              "#[a-z0-9_]+",
              ":"
             ];
    var deleteThese = new RegExp(noLinks.join('|'), 'ig');
    msg = msg.replace(deleteThese, '');

    return msg;
}

/*****************
CONNECT TO TWITTER
*****************/

function getTwitterService() {

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('settings');
    var twitter_name = sheet.getRange('D7').getValue();
    var consumer_key = sheet.getRange('D17').getValue();
    var consumer_secret = sheet.getRange('D19').getValue();
    var project_key = sheet.getRange('D23').getValue();

    var service = OAuth1.createService('twitter');

    service.setAccessTokenUrl('https://api.twitter.com/oauth/access_token');
    service.setRequestTokenUrl('https://api.twitter.com/oauth/request_token');
    service.setAuthorizationUrl('https://api.twitter.com/oauth/authorize');

    service.setConsumerKey(consumer_key);
    service.setConsumerSecret(consumer_secret);

    service.setCallbackFunction('authCallback');

    service.setPropertyStore(PropertiesService.getScriptProperties());

    return service;
}

function showSidebar() {
    var twitterService = getTwitterService();
    if (!twitterService.hasAccess()) {
        var authorizationUrl = twitterService.authorize();
        var template = HtmlService.createTemplate(
            '<a href="<?= authorizationUrl ?>" target="_blank">Authorize</a>. ' +
            'Reopen the sidebar when the authorization is complete.');
        template.authorizationUrl = authorizationUrl;
        var page = template.evaluate();
        DocumentApp.getUi().showSidebar(page);
    } else {
        Logger.log('something went wrong. showSidebar()')
    }
}

function authCallback(request) {
    var service = getTwitterService();
    var isAuthorized = service.handleCallback(request);
    if (isAuthorized) {
        return HtmlService.createHtmlOutput('Success! You can close this page.');
    } else {
        return HtmlService.createHtmlOutput('Denied. You can close this page');
    }
}

function authRevoke() {
    OAuth1.createService('twitter')
        .setPropertyStore(PropertiesService.getUserProperties())
        .reset();
    msgPopUp('<p>Your Twitter authorization deleted. You\'ll need to re-run "Send a Test Tweet" to reauthorize before you can start posting again.');
}


/*****************
  TWEET TIMING~
*****************/

//calls makeSingleTweet function on a timer. Makes sense!
function setTiming() {

    // reset any existing triggers
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
        ScriptApp.deleteTrigger(triggers[i]);
    }



    var setting = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('settings').getRange('D35').getValue();

    switch (setting) {
        case "12 hours":
            var trigger = ScriptApp.newTrigger("makeSingleTweet")
                .timeBased()
                .everyHours(12)
                .create();
            break;
        case "8 hours":
            ScriptApp.newTrigger("makeSingleTweet")
                .timeBased()
                .everyHours(8)
                .create();
            break;
        case "6 hours":
            ScriptApp.newTrigger("makeSingleTweet")
                .timeBased()
                .everyHours(6)
                .create();
            break;
        case "4 hours":
            ScriptApp.newTrigger("makeSingleTweet")
                .timeBased()
                .everyHours(4)
                .create();
            break;
        case "2 hours":
            ScriptApp.newTrigger("makeSingleTweet")
                .timeBased()
                .everyHours(2)
                .create();
            break;
        case "1 hour":
            ScriptApp.newTrigger("makeSingleTweet")
                .timeBased()
                .everyHours(1)
                .create();
            break;
        case "30 minutes":
            ScriptApp.newTrigger("makeSingleTweet")
                .timeBased()
                .everyMinutes(30)
                .create();
            break;
        case "15 minutes":
            ScriptApp.newTrigger("makeSingleTweet")
                .timeBased()
                .everyMinutes(15)
                .create();
            break;
        case "10 minutes":
            ScriptApp.newTrigger("makeSingleTweet")
                .timeBased()
                .everyMinutes(10)
                .create();
            break;
        case "5 minutes":
            ScriptApp.newTrigger("makeSingleTweet")
                .timeBased()
                .everyMinutes(5)
                .create();
            break;
        default:
            Logger.log('I\'m sorry, but I couldn\'t understand what you were asking.');
    }

    ScriptApp.newTrigger("makeReply")
        .timeBased()
        .everyMinutes(5)
        .create();
    Logger.log(trigger);

}

function clearTiming() {
    // reset any existing triggers
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
        ScriptApp.deleteTrigger(triggers[i]);
    }

}

/*****************
     ONE TWEET
*****************/

//grabs a tweet! This is invoked when you hit Send a test tweet and by the spreadsheet on the timer you set.
function makeSingleTweet() {

    var tweet = getEbooksText();

    doTweet(tweet);
}

//sends the tweet!
function doTweet(tweet) {

    var service = getTwitterService();

    if (service.hasAccess()) {
        var status = 'https://api.twitter.com/1.1/statuses/update.json';
        var payload = "status=" + getEbooksText();

    } else {
        var authorizationUrl = service.authorize();
        msgPopUp('<p>Please visit the following URL and then re-run "Send a Test Tweet": <br/> <a target="_blank" href="' + authorizationUrl + '">' + authorizationUrl + '</a></p>');
    }

    var parameters = {
        "method": "POST",
        "escaping": false,
        "payload": payload
    };

    try {
        var result = service.fetch('https://api.twitter.com/1.1/statuses/update.json', parameters);
        //Logger.log(result.getContentText());    
    } catch (e) {
        Logger.log(e.toString());
    }

}

function makeReply() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('settings');
    var username = sheet.getRange('D8').getValue();

    var service = getTwitterService();

    if (service.hasAccess()) {
        var search = ('https://api.twitter.com/1.1/search/tweets.json?q=to%3A' + username);
    } else {
        var authorizationUrl = service.authorize();
        msgPopUp('<p>Please visit the following URL and then re-run "Send a Test Tweet": <br/> <a target="_blank" href="' + authorizationUrl + '">' + authorizationUrl + '</a></p>');
    }

    var parameters = {
        "method": "GET",
        "result_type": "recent"
    }

    var results = service.fetch(search, parameters);
    var json = results.getContentText();
    var data = JSON.parse(json);

    for (var d = 0; d < [5]; d++) {
        
        var user = data.statuses[d].user.screen_name;
        var id = data.statuses[d].id_str;
        var recent = data.statuses[0].id_str;
      
        var check = sheet.getRange('D40').getValue(); //gets id to reference
        var re = new RegExp(recent, 'g'); //searching sheet against the most recent @mention

        if (check.match(re)) {
            Logger.log('already replied to @' + user);
            break;
        } else {
            doReply(user, id);
            Logger.log(recent);
            var log = Logger.getLog();
            sheet.getRange('D40').setValue(log); //logs new id 
        }
    }
  function replyReset() {
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      ScriptApp.deleteTrigger(triggers[1]);
    }
  }
}

//sends reply
function doReply(user, id) {

    var mention = '@' + user + ' ';
    var service = getTwitterService();
    if (service.hasAccess()) {

        var status = 'https://api.twitter.com/1.1/statuses/update.json';
        var payload = "status=" + mention + getEbooksText() + "&in_reply_to_status_id=" + id;

    } else {
        var authorizationUrl = service.authorize();
        msgPopUp('<p>Please visit the following URL and then re-run "Send a Test Tweet": <br/> <a target="_blank" href="' + authorizationUrl + '">' + authorizationUrl + '</a></p>');
    }

    var parameters = {
        "method": "POST",
        "escaping": false,
        "payload": payload
    }

    try {
        var result = service.fetch('https://api.twitter.com/1.1/statuses/update.json', parameters);
        //Logger.log(result.getContentText());    
    } catch (e) {
        Logger.log(e.toString());
    }
}



/*****************
 STYLES POPUP MSG
*****************/

function msgPopUp(msg) {
    var content = '<div style="font-family: Verdana;font-size: 22px; text-align:left; width: 95%; margin: 0 auto;">' + msg + '</div>';
    var htmlOutput = HtmlService
        .createHtmlOutput(content)
        .setSandboxMode(HtmlService.SandboxMode.IFRAME)
        .setWidth(600)
        .setHeight(500);
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, ' ');
}

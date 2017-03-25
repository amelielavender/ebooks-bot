# ebooks-bot
gs script behind a google sheet for those who can't code. this google script calls info from a spreadsheet and the twitter oauth api.

inspired by @zachwhalen/ssbot

[go to code docs](/README.md#ebooks-bot-functions)

licensed under the [MIT license](/LICENSE)

credit: amelie! (@almondette on github and other places)

special thanks: everyone who's ever blogged about their markov chain experiences. they're a great reference for beginners like me!

## pre-requisites

to use the spreadsheet for a psuedo-markov ebooks twitter bot, you need to do and/or have these things:
* a new twitter account for your bot
* [a TAGS archive](https://tags.hawksey.info)
* [the ebooks bot spreadsheet](https://docs.google.com/spreadsheets/d/1wDcNuz0pDAfgzep2bBMwHKlH2nwFeVtSbtv_difIZXw/copy)

## creating a new twitter account

* go to twitter.com, create a new account for your bot if you haven't
  * you might need a phone number for verfication purposes, but you can get a free number over at [google voice](https://voice.google.com)
* verify your new account and stay logged in

## setting up a twitter app

* go to https://apps.twitter.com 
* head to the settings tab
* fill out your app's name, app's description, and website.
  * ex: my bot, a bot that tweets every x hours/minutes/days, https://example.com
  * leave the callback url blank for now. the spreadsheet will generate it for you.
  * make sure "Allow this application to be used to Sign in with Twitter" is checked
* head to the keys and access tokens tab
  * generate your access tokens and consumer secret
  * make sure your app has both read and write access
* stay on the keys and access tokens page. you'll need your token and secret for your spreadsheet

## setting up the ebooks bot spreadsheet

double click on each cell to fill in the appropriate information correctly. ~~i'm still not used to that, myself...~~

* fill in your bot's username to serve as a reminder when you're editing the sheet. i also recommend changing the name of your new spreadsheet to "[username] bot".
* follow the instructions on the left side of the sheet. they prompt you to fill in the appropriate information.
* make sure to get the entire url of your TAGS sheet by opening it up and copying what appears in your address bar. 
  * you don't need to change *sharing* permissions or anything. ie, your TAGS sheet isn't shared with anyone and can only be viewed by you.
* the ebooks bot sheet will ask you for permission to access files on your google drive, accept to let ebooks bot read your TAGS archive!
* a callback url will be generated after pasting your script id into the correct field. copy the callback url into your app's details on https://apps.twitter.com

generate a preview. this will populate the preview sheet.
go to `bot > send a test tweet`. you may be prompted to visit a link and `send a test tweet` again
if your bot tweeted after authenticating, congrats! 
go to `bot > start posting tweets` to activate timed tweets on the timer that you set via a dropdown.

## ebooks bot functions

the script file uses a few functions to:
1. create a markov chain of words 
2. authenticate the spreadsheet as an app
3. tweet on a timer
4. add a new bot menu in the sheet menubar

#### markov chaining

retrieve the source material, in this case, it's the TAGS archive

```
var ebooks = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ebooks.getSheetByName('settings')
  var archiveUrl = sheet.getRange('D32').getValue();
  
  var ss = SpreadsheetApp.openByUrl(archiveUrl);
  
  var archive = ss.getSheetByName('Archive');
  var lastRow = archive.getLastRow();
  
  var startwords = [];
  var endwords = {};
  var tweets = {};
 
  var allTweets = archive.getRange( 'C1:C'+ lastRow ).getValues();  
```

split each tweet into words by delimiter `whitespace`. set up arrays of words that most often begin and end tweets

```
 for (var i = 0; i < allTweets.length; i++) {
    var words = allTweets[i][0].split(' ');
    endwords[words[words.length - 1]] = true;
    startwords.push(words[0]);
    for (var j = 0; j < words.length - 1; j++) {
        if (tweets.hasOwnProperty(words[j])) {
            tweets[words[j]].push(words[j+1]);
        } else {
            tweets[words[j]] = [words[j+1]];
        }
    }
```

make a function that randomly chooses the following words 

```
  var choice = function(w) {
    var i = Math.floor(w.length * Math.random());
    return w[i];
```

push those words into the sentence

```
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
```

make sure tweets are more than 4-5 words when `min_length` is called

`var msg = shitpost(5 + Math.floor(5 * Math.random()));`

urls, hashtags, and mentions are not tweeted. i'm not changing that.

`foo.replace(/https?:\/\/t\.co\/[a-z0-9]+/ig, '').replace(/@[a-zA-Z0-9_]+/g, '').replace(/RT /, '').replace(/#[a-zA-Z0-9_]+/g, '');`

#### twitter oauth

used [the google scripts oauth1 library](https://github.com/googlesamples/apps-script-oauth1)

#### google script documentation

good [stuff](https://developers.google.com/apps-script/reference/calendar/)

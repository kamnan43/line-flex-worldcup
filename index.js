'use strict';

const lineSdk = require('@line/bot-sdk');
const express = require('express');
const fs = require('fs');
const git = require('./git-deploy');
const config = require('./config.json');
const worldcup = require('./worldcup');
const https = require('https');
const app = express();
app.use('/static', express.static('static'));
app.use('/downloaded', express.static('downloaded'));
app.post('/git', function (req, res) {
  res.status(200).end();
  git.deploy({
    origin: "origin",
    branch: "master"
  });
});
app.post('/webhooks', lineSdk.middleware(config), (req, res) => {
  // app.post('/webhooks', (req, res) => {
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end();
  }
  Promise.all(req.body.events.map(handleEvent))
    .then(() => res.end())
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

function handleEvent(event) {
  console.log(event);
  var userId = event.source.userId;
  var replyToken = event.replyToken;
  if (!userId) {
    return worldcup.sendTextMessage(userId, replyToken, 'Error : NO_USER_ID');
  }
  switch (event.type) {
    case 'message':
      const message = event.message;
      switch (message.type) {
        case 'text':
          if (['Last Match', 'Next Match', 'Schedule', 'Group'].indexOf(message.text) > -1) {
            return handleCommand(message, replyToken, event.source);
          } else if (message.text.startsWith('[bc]')) {
            message.text = message.text.replace('[bc]', '');
            return; // worldcup.broadcastMessage(message.text);
          } else {
            return; // worldcup.sendMenuMessage(userId, replyToken);
          }
        default:
          return worldcup.sendTextMessage(userId, replyToken, 'ระบบยังไม่รองรับข้อความรูปแบบนี้');
      }
    case 'follow':
      return worldcup.sendMenuMessage(userId, replyToken);

    case 'unfollow':
    // return worldcup.disableMember(userId);

    case 'postback':
      let postbackData = event.postback.data.split("_", 2);
      let mode = postbackData[0];
      let data = postbackData[1];
      switch (mode) {
        case 'LIVE': return worldcup.sendLiveMessage(userId, replyToken);
        case 'LAST': return worldcup.sendLastMessage(userId, replyToken);
        case 'NEXT': return worldcup.sendNextMessage(userId, replyToken);
        case 'SUBSCRIBE': return worldcup.getLiveReport();
        case 'SCHEDULE': return worldcup.sendScheduleMessage(userId, replyToken);
        case 'GROUP': return worldcup.sendStandingMessage(userId, replyToken);
      }
    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}

function handleCommand(message, replyToken, source) {
  switch (message.text) {
    case 'Last Match':
      return worldcup.sendLastMessage(source.userId, replyToken);
    case 'Next Match':
      return worldcup.sendNextMessage(source.userId, replyToken);
    case 'Schedule':
      return worldcup.sendScheduleMessage(source.userId, replyToken);
    case 'Group':
      return worldcup.sendStandingMessage(source.userId, replyToken);
    default:
      return;
  }
}

// listen on port
const port = config.PORT;

var certOptions = {
  key: fs.readFileSync('./cert/privkey.pem'),
  cert: fs.readFileSync('./cert/fullchain.pem')
};

app.listen(port, () => {
  console.log(`listening on ${port}`);
});
https.createServer(certOptions, app).listen(port + 800);

worldcup.updateFixture();
setInterval(() => {
  worldcup.updateFixture();
}, 1000 * 60); // 1 minute

worldcup.updateStanding();
setInterval(() => {
  worldcup.updateStanding();
}, 1000 * 60 * 10); // 10 minutes

worldcup.getLiveReport();  // realtime database

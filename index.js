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
          if (['Next Match', 'Schedule', 'Standing'].indexOf(message.text) > -1) {
            return handleCommand(message, replyToken, event.source);
          } else if (message.text.startsWith('[bc]')) {
            message.text = message.text.replace('[bc]', '');
            return worldcup.broadcastMessage(message.text);
          } else if (message.text.startsWith('@')) {
            return worldcup.sendCandidateProfile(userId, replyToken, message.text.replace('@', ''));
          }
        default:
          return worldcup.sendTextMessage(userId, replyToken, 'ระบบยังไม่รองรับข้อความรูปแบบนี้');
      }
    case 'follow':
      return worldcup.sendGreetingMessage(userId, replyToken);

    case 'unfollow':
    // return worldcup.disableMember(userId);

    case 'postback':
      let postbackData = event.postback.data.split("_", 2);
      let mode = postbackData[0];
      let data = postbackData[1];
    default:
      throw new Error(`Unknown event: ${JSON.stringify(event)}`);
  }
}

function handleCommand(message, replyToken, source) {
  switch (message.text) {
    case 'Next Match':
      return worldcup.sendNextMatch(source.userId, replyToken);
    case 'Schedule':
      return worldcup.sendSchedule(source.userId, replyToken);
    case 'Standing':
      return worldcup.sendStanding(source.userId, replyToken);
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

const config = require('./config.json');
const options = require('./worldcup-options');
const baseURL = config.BASE_URL;
const lineSdk = require('@line/bot-sdk');
const lineHelper = require('./line-helper.js');
const apifootball = require('./apifootball');
const line = new lineSdk.Client(config);
const path = require('path');
const _ = require('lodash');
const cp = require('child_process');
const http = require('http');
const fs = require('fs');
const firebase = require("firebase-admin");
var firebaseConfig = config.firebase;
firebaseConfig.credential = firebase.credential.cert(require(firebaseConfig.serviceAccountFile));
firebase.initializeApp(firebaseConfig);
var database = firebase.database();
var membersRef = database.ref("/members");
var relationsRef = database.ref("/members");
var fixturesRef = database.ref("/fixtures");
var standingsRef = database.ref("/standing");

module.exports = {
  updateFixture: updateFixture,
  updateStanding: updateStanding,
  getLastMatch: getLastMatch,
  getNextMatch: getNextMatch,
  getLiveReport: getLiveReport,

  sendTextMessage: (userId, replyToken, text) => {
    line.replyMessage(
      replyToken,
      [
        lineHelper.createTextMessage(text)
      ]
    );
  },

  // broadcastMessage: (text) => {
  //   let query = membersRef.orderByKey()
  //     .once("value", function (snapshot) {
  //       snapshot.forEach(function (snap) {
  //         var doc = snap.val();
  //         if (doc.status == 1) {
  //           line.pushMessage(doc.userId, [lineHelper.createTextMessage(text)]);
  //         }
  //       });
  //     });
  // },

  sendMenuMessage: async (userId, replyToken) => {
    let bubble = options.getMenuBubble(replyToken);
    let liveMatch = await getLiveMatch();
    if (liveMatch.length > 0) {
      bubble.body.contents.unshift({ type: 'separator', margin: 'lg' });
      liveMatch.forEach(match => {
        bubble.body.contents.unshift(options.getLiveMatchBox(match))
      });
      bubble.body.contents.unshift(options.menuLiveBox);
    }
    let messages = [
      lineHelper.createFlexMessage('Menu', bubble),
    ];
    saveFile(replyToken, messages[0].contents);
    line.replyMessage(replyToken, messages)
      .then((msg) => { console.log('line:', msg) })
      .catch((err) => { console.log('line error:', err) });
  },

  sendLiveMessage: async (userId, replyToken) => {
    let liveMatch = await getLiveMatch();
    sendMatchMessage(liveMatch, replyToken);
  },

  sendInfoMessage: async (userId, replyToken, matchId) => {
    let match = await getMatch(matchId);
    sendMatchMessage(match, replyToken);
  },

  sendLastMessage: async (userId, replyToken) => {
    let lastMatch = await getLastMatch();
    sendMatchMessage(lastMatch, replyToken);
  },

  sendNextMessage: async (userId, replyToken) => {
    let nextMatch = await getNextMatch();
    sendMatchMessage(nextMatch, replyToken);
  },

  sendStandingMessage: async (userId, replyToken) => {
    getStanding().then((list) => {
      let groupBubbles = config.apiFootball.leagues.map(leagueId => {
        let group = list.filter(l => +(l.league_id) === leagueId);
        group = group.sort((a, b) => { return a.overall_league_position - b.overall_league_position });
        return options.getStandingBubble(group, replyToken);
      });
      let messages = [
        lineHelper.createFlexCarouselMessage('Group Standing', groupBubbles),
      ];
      saveFile(replyToken, messages[0].contents);
      line.replyMessage(replyToken, messages)
        .then((msg) => { console.log('line:', msg) })
        .catch((err) => { console.log('line error:', err) });
    });
  },

  sendH2HMessage: async (userId, replyToken, matchId) => {
    getMatch(matchId)
      .then((match) => {
        return apifootball.getH2H(match.match_hometeam_name, match.match_awayteam_name);
      })
      .then((result) => {
        let h2hBubbles = options.getH2HContentBubble(result);
        let messages = [
          lineHelper.createFlexCarouselMessage('Head 2 Head', h2hBubbles),
        ];
        saveFile(replyToken, messages[0].contents);
        line.replyMessage(replyToken, messages)
          .then((msg) => { console.log('line:', msg) })
          .catch((err) => { console.log('line error:', err) });
      });
  },

  sendScheduleMessage: async (userId, replyToken) => {
    getAllMatch().then((list) => {
      let groupBubbles = config.apiFootball.leagues.map(leagueId => {
        let group = list.filter(l => +(l.league_id) === leagueId);
        return options.getScheduleBubble(group, replyToken);
      });
      let messages = [
        lineHelper.createFlexCarouselMessage('Schedule', groupBubbles),
      ];
      saveFile(replyToken, messages[0].contents);
      line.replyMessage(replyToken, messages)
        .then((msg) => { console.log('line:', msg) })
        .catch((err) => { console.log('line error:', err) });
    });
  }
}

async function sendMatchMessage(match, replyToken) {
  let bubble = [];
  let messages = [];
  if (match.length > 0) {
    for (let i = 0; i < 5 && i < match.length; i++) {
      bubble.push(options.getMatchContentBubble('Match Info', match[i], replyToken))
    }
    messages.push(lineHelper.createFlexCarouselMessage('Match Info', bubble));
  } else {
    messages.push(lineHelper.createTextMessage('No Match'));
  }
  saveFile(replyToken, messages[0].contents);
  line.replyMessage(replyToken, messages)
    .then((msg) => { console.log('line:', msg) })
    .catch((err) => { console.log('line error:', err) });
}

function getLiveMatch() {
  return new Promise((resolve, reject) => {
    let list = [];
    fixturesRef
      .orderByChild('match_live')
      .equalTo('1')
      .once("value", function (snapshot) {
        snapshot.forEach(function (snap) {
          var doc = snap.val();
          list.push(doc);
        });
        list = list.sort(sortByMatchDateTime);
        resolve(list);
      });
  });
}

function getLastMatch() {
  return new Promise((resolve, reject) => {
    let list = [];
    fixturesRef
      .orderByChild('match_status')
      .equalTo('FT')
      .once("value", function (snapshot) {
        snapshot.forEach(function (snap) {
          list.push(snap.val());
        });
        list = list.sort(sortByMatchDateTimeDesc);
        resolve(list);
      });
  });
}

function getNextMatch() {
  return new Promise((resolve, reject) => {
    let list = [];
    fixturesRef
      .orderByChild('match_status')
      .once("value", function (snapshot) {
        snapshot.forEach(function (snap) {
          var doc = snap.val();
          if (doc.match_status !== 'FT' && doc.match_live !== '1') {
            list.push(doc);
          }
        });
        list = list.sort(sortByMatchDateTime);
        resolve(list);
      });
  });
}

function getAllMatch() {
  return new Promise((resolve, reject) => {
    let list = [];
    fixturesRef
      .once("value", function (snapshot) {
        snapshot.forEach(function (snap) {
          list.push(snap.val());
        });
        list = list.sort(sortByMatchDateTime);
        resolve(list);
      });
  });
}

function getMatch(matchId) {
  return new Promise((resolve, reject) => {
    let list = [];
    fixturesRef
      .orderByChild('match_id')
      .equalTo(matchId)
      .once("value", function (snapshot) {
        snapshot.forEach(function (snap) {
          list.push(snap.val());
        });
        resolve(list);
      });
  });
}

function getStanding() {
  console.log('getStanding');
  return new Promise((resolve, reject) => {
    let list = [];
    standingsRef
      .once("value", function (snapshot) {
        snapshot.forEach(function (snap) {
          list.push(snap.val());
        });
        resolve(list);
      });
  });
}

function getLiveReport() {
  console.log('getLiveReport');
  let list = [];
  fixturesRef
    .orderByChild('match_live')
    .equalTo('1')
    .on("value", function (snapshot) {
      snapshot.forEach(function (snap) {
        var doc = snap.val();
        // console.log('doc', JSON.stringify(doc));
        let events = [];
        if (doc.goalscorer) {
          let goalscorer = doc.goalscorer.filter(s => s.time !== '').map(s => {
            return {
              type: 'goal',
              time: +(s.time.replace('\'', '')),
              home_scorer: s.home_scorer,
              score: s.score,
              away_scorer: s.away_scorer,
            };
          });
          events = events.concat(goalscorer);
        }

        if (doc.cards) {
          let cards = doc.cards.filter(s => s.time !== '').map(s => {
            return {
              type: 'card',
              time: +(s.time.replace('\'', '')),
              home_fault: s.home_fault,
              card: s.card,
              away_fault: s.away_fault,
            }
          });
          events = events.concat(cards);
        }

        if (doc.lineup && doc.lineup.home && doc.lineup.home.substitutions) {
          let homeSubstitutions = doc.lineup.home.substitutions.filter(s => s.lineup_time !== '').map(s => {
            return {
              type: 'subs',
              side: 'home',
              time: +(s.lineup_time.replace('\'', '')),
              lineup_player: s.lineup_player,
            }
          });
          events = events.concat(homeSubstitutions);
        }

        if (doc.lineup && doc.lineup.away && doc.lineup.away.substitutions) {
          let awaySubstitutions = doc.lineup.away.substitutions.filter(s => s.lineup_time !== '').map(s => {
            return {
              type: 'subs',
              side: 'away',
              time: +(s.lineup_time.replace('\'', '')),
              lineup_player: s.lineup_player,
            }
          });
          events = events.concat(awaySubstitutions);
        }
        doc.events = events.sort((a, b) => { return a.time - b.time });
        // console.log('live=====>', doc.events);

        // find in list
        let indexOfDoc = list.findIndex(i => i.match_id === doc.match_id);
        if (indexOfDoc >= 0) {
          // let difference = doc.events.filter(x => !list[indexOfDoc].events.includes(x));
          let difference = _.difference(doc.events, list[indexOfDoc].events);
          if (difference) console.log('difference', difference);
          list[indexOfDoc] = doc;
          // let isChanged = (list[indexOfDoc].events.length !== doc.events.length);
          // if (isChanged) {
          //   let difference = doc.events.filter(x => !list.events.includes(x));
          //   console.log('difference', difference);
          // }
        } else {
          list.push(doc);
        }
      });
      // list = list.sort(sortByMatchDateTime);
    });
}

function sortByMatchDateTime(a, b) {
  if (a.match_date < b.match_date) return -1;
  else if (a.match_date > b.match_date) return 1;
  else return a.match_time < b.match_time ? -1 : 1;
}

function sortByMatchDateTimeDesc(a, b) {
  if (a.match_date < b.match_date) return 1;
  else if (a.match_date > b.match_date) return -1;
  else return a.match_time < b.match_time ? 1 : -1;
}

function updateFixture() {
  console.log('updateFixture');
  Promise.all(config.apiFootball.leagues.map(leagueId => {
    return apifootball.getEvents(leagueId);
  })).then((result) => {
    var fixtures = [].concat.apply([], result);
    saveFile('fixtures', fixtures);
    fixtures.forEach(fixture => {
      var fixturesRef = database.ref("/fixtures/" + fixture.match_id);
      fixturesRef.set(fixture);
    });
  });
}

function updateStanding() {
  console.log('updateStanding');
  Promise.all(config.apiFootball.leagues.map(leagueId => {
    return apifootball.getStanding(leagueId);
  })).then((result) => {
    var standings = [].concat.apply([], result);
    saveFile('standing', standings);
    standings.forEach(standing => {
      var standingsRef = database.ref("/standing/" + standing.team_name);
      standingsRef.set(standing);
    });
  });
}

function saveFile(id, data) {
  fs.writeFile(`downloaded/${id}.json`, JSON.stringify(data, null, 2), function (err) {
    if (err) { return console.log(err); }
    console.log("The file was saved!");
  });
}

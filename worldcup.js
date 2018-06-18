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
const moment = require('moment');
const firebase = require("firebase-admin");
var firebaseConfig = config.firebase;
firebaseConfig.credential = firebase.credential.cert(require(firebaseConfig.serviceAccountFile));
firebase.initializeApp(firebaseConfig);
var database = firebase.database();
var membersRef = database.ref("/members");
var relationsRef = database.ref("/members");
var fixturesRef = database.ref("/fixtures");
var standingsRef = database.ref("/standings");

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

  broadcastMessage: (text) => {
    let query = membersRef.orderByKey()
      .once("value", function (snapshot) {
        snapshot.forEach(function (snap) {
          var doc = snap.val();
          if (doc.status == 1) {
            line.pushMessage(doc.userId, [lineHelper.createTextMessage(text)]);
          }
        });
      });
  },

  sendMenuMessage: async (userId, replyToken) => {
    let bubble = _.cloneDeep(options.menuBubble);
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
    line.replyMessage(replyToken, messages)
      .then((msg) => {
        console.log('line:', msg)
      })
      .catch((err) => {
        console.log('line error:', err)
      });
  },

  sendLiveMessage: async (userId, replyToken) => {
    let bubble = [];
    let messages = [];
    let liveMatch = await getLiveMatch();
    if (liveMatch.length > 0) {
      liveMatch.forEach(match => {
        bubble.push(getMatchContentBubble('LIVE Match', match))
      });
      messages.push(lineHelper.createFlexCarouselMessage('Match Info', bubble));
    } else {
      messages.push(lineHelper.createTextMessage('No Live Match Now'));
    }
    line.replyMessage(replyToken, messages)
      .then((msg) => { console.log('line:', msg) })
      .catch((err) => { console.log('line error:', err) });
  },

  sendLastMessage: async (userId, replyToken) => {
    let bubble = [];
    let messages = [];
    let lastMatch = await getLastMatch();
    if (lastMatch.length > 0) {
      bubble.push(getMatchContentBubble('Last Match', lastMatch[0]))
      messages.push(lineHelper.createFlexCarouselMessage('Match Info', bubble));
    } else {
      messages.push(lineHelper.createTextMessage('No Last Match'));
    }
    line.replyMessage(replyToken, messages)
      .then((msg) => { console.log('line:', msg) })
      .catch((err) => { console.log('line error:', err) });
  },

  sendNextMessage: async (userId, replyToken) => {
    let bubble = [];
    let messages = [];
    let nextMatch = await getNextMatch();
    if (nextMatch.length > 0) {
      bubble.push(getMatchContentBubble('Next Match', nextMatch[0]))
      messages.push(lineHelper.createFlexCarouselMessage('Match Info', bubble));
    } else {
      messages.push(lineHelper.createTextMessage('No More Match'));
    }
    line.replyMessage(replyToken, messages)
      .then((msg) => { console.log('line:', msg) })
      .catch((err) => { console.log('line error:', err) });
  },

  sendGreetingMessage: async (userId, replyToken) => {
    let bubble = [];
    let liveMatch = await getLiveMatch();
    if (liveMatch.length > 0) {
      liveMatch.forEach(match => {
        bubble.push(getMatchContentBubble('LIVE Match', match))
      });
    } else {
      let lastMatch = await getLastMatch();
      if (lastMatch.length > 0) {
        bubble.push(getMatchContentBubble('Last Match', lastMatch[0]));
      }
    }

    let nextMatch = await getNextMatch();
    if (nextMatch.length > 0) {
      bubble.push(getMatchContentBubble('Next Match', nextMatch[0]));
    }

    let messages = [
      lineHelper.createFlexCarouselMessage('Match Info', bubble),
    ];
    line.replyMessage(replyToken, messages)
      .then((msg) => {
        console.log('line:', msg)
      })
      .catch((err) => {
        console.log('line error:', err)
      });
  },

  sendStandingMessage: async (userId, replyToken) => {
    getStanding().then((list) => {
      let groupData = config.apiFootball.leagues.map(leagueId => {
        let group = list.filter(l => l.league_id === leagueId);
        return apifootball.getStanding(leagueId);
      });
      console.log('groupData', groupData);
    });



    // let messages = [
    //   lineHelper.createFlexCarouselMessage('Last/Next Match Info', [lastMatchBubble, nextMatchBubble]),
    // ];
    // line.replyMessage(replyToken, messages)
    // .then((msg)=>{
    //   console.log('line:', msg)
    // })
    // .catch((err)=> {
    //   console.log('line error:', err)
    // });
  },

  disableMember: (userId) => {
    updateMemberData(userId, { 'status': -1 });
  }
}

function updateMemberData(userId, object) {
  object['lastActionDate'] = Date.now();
  var memberRef = database.ref("/members/" + userId);
  return memberRef.update(object);
}

function getMatchContentBubble(title, match) {
  let contents = [];
  // title
  contents.push({
    type: 'text',
    text: match.match_status || 'Next Match',
    wrap: true,
    weight: 'bold',
    gravity: 'center',
    size: 'lg'
  });
  //name vs name
  contents.push({
    type: 'box',
    layout: 'baseline',
    spacing: 'sm',
    contents: [
      {
        type: 'icon',
        url: `${config.BASE_URL}/static/flag/${match.match_hometeam_name.replace(' ', '')}.png`,
        size: 'sm',
      },
      {
        type: 'text',
        text: match.match_hometeam_name,
        flex: 3,
        align: 'start'
      },
      {
        type: 'text',
        text: `${match.match_hometeam_score} : ${match.match_awayteam_score}`,
        flex: 1,
        align: 'center'
      },
      {
        type: 'text',
        text: match.match_awayteam_name,
        flex: 3,
        align: 'end'
      },
      {
        type: 'icon',
        url: `${config.BASE_URL}/static/flag/${match.match_awayteam_name.replace(' ', '')}.png`,
        size: 'sm',
      }
    ]
  });
  // detail
  let detail = {
    type: 'box',
    layout: 'vertical',
    margin: 'lg',
    spacing: 'sm',
    contents: []
  };
  // scorer
  if (match.goalscorer) {
    detail.contents.push({
      type: 'box',
      layout: 'baseline',
      spacing: 'sm',
      contents: [
        {
          type: 'text',
          text: 'Scorer',
          color: '#aaaaaa',
          size: 'sm',
          weight: 'bold',
        }
      ]
    });
    match.goalscorer.filter(s => s.time !== '').forEach(scorer => {
      detail.contents.push({
        type: 'box',
        layout: 'baseline',
        spacing: 'sm',
        contents: [
          {
            type: 'text',
            text: scorer.time,
            color: '#aaaaaa',
            size: 'sm',
            flex: 1
          },
          {
            type: 'text',
            text: `${scorer.score}`,
            wrap: true,
            color: '#666666',
            size: 'sm',
            flex: 1
          },
          {
            type: 'icon',
            url: `${config.BASE_URL}/static/football.png`,
            size: 'sm',
          },
          {
            type: 'text',
            text: `${scorer.home_scorer + scorer.away_scorer}`,
            wrap: true,
            color: '#666666',
            size: 'sm',
            flex: 4
          },
          {
            type: 'icon',
            url: `${config.BASE_URL}/static/flag/${(scorer.home_scorer ? match.match_hometeam_name : match.match_awayteam_name).replace(' ', '')}.png`,
            size: 'sm',
          }
        ]
      });
    });
  }
  // card
  if (match.cards) {
    detail.contents.push({
      type: 'box',
      layout: 'baseline',
      spacing: 'sm',
      contents: [
        {
          type: 'text',
          text: 'Card',
          color: '#aaaaaa',
          size: 'sm',
          weight: 'bold',
        }
      ]
    });
    match.cards.filter(c => c.time !== '').forEach(card => {
      detail.contents.push({
        type: 'box',
        layout: 'baseline',
        spacing: 'sm',
        contents: [
          {
            type: 'text',
            text: card.time || '-',
            color: '#aaaaaa',
            size: 'sm',
            flex: 1
          },
          {
            type: 'icon',
            url: `${config.BASE_URL}/static/${card.card}.png`,
            size: 'sm',
          },
          {
            type: 'text',
            text: `${card.home_fault + card.away_fault}`,
            wrap: true,
            color: '#666666',
            size: 'sm',
            flex: 4
          }
        ]
      });
    });
  }
  detail.contents.push({
    "type": "separator",
    "margin": "xxl"
  });
  // group
  detail.contents.push({
    type: 'box',
    layout: 'baseline',
    spacing: 'md',
    contents: [
      {
        type: 'text',
        text: 'Group',
        color: '#aaaaaa',
        size: 'sm',
        flex: 2
      },
      {
        type: 'text',
        text: `${match.league_name.replace(' Group ', '')}`,
        wrap: true,
        color: '#666666',
        size: 'sm',
        flex: 4
      }
    ]
  });
  // datetime
  let datetime = moment(`${match.match_date} ${match.match_time}`);
  console.log(datetime);
  detail.contents.push({
    type: 'box',
    layout: 'baseline',
    spacing: 'sm',
    contents: [
      {
        type: 'text',
        text: 'Date',
        color: '#aaaaaa',
        size: 'sm',
        flex: 2
      },
      {
        type: 'text',
        text: `${match.match_date}, ${match.match_time}`,
        wrap: true,
        size: 'sm',
        color: '#666666',
        flex: 4
      }
    ]
  });

  contents.push(detail);

  let header = {
    type: 'box',
    layout: 'vertical',
    contents: [
      {
        type: 'text',
        text: title,
        size: 'xl',
        weight: 'bold'
      }
    ]
  };
  let body = {
    type: 'box',
    layout: 'vertical',
    spacing: 'md',
    contents: contents,
  };
  let footer = {
    type: 'box',
    layout: 'vertical',
    contents: [
      {
        type: 'button',
        action: {
          type: 'postback',
          label: 'Subscribe Live Result',
          data: 'SUBSCRIBE_' + match.match_id,
          displayText: 'subscribe'
        },
        style: 'primary'
      }
    ]
  };
  let container = {
    type: 'bubble',
    body: body,
  };
  if (match.match_status !== 'FT') container.footer = footer;
  return container;
}

function updateFixture() {
  console.log('updateFixture');
  Promise.all(config.apiFootball.leagues.map(leagueId => {
    return apifootball.getEvents(leagueId);
  })).then((result) => {
    var fixtures = [].concat.apply([], result);
    fs.writeFile(`fixtures.json`, JSON.stringify(fixtures, null, 2), function (err) {
      if (err) { return console.log(err); }
      console.log("The file was saved!");
    });
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
    fs.writeFile(`standing.json`, JSON.stringify(standings, null, 2), function (err) {
      if (err) { return console.log(err); }
      console.log("The file was saved!");
    });
    standings.forEach(standing => {
      var standingsRef = database.ref("/standing/" + standing.team_name);
      standingsRef.set(standing);
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

function getLiveReport() {
  console.log('getLiveReport');
  let list = [];
  fixturesRef
    .orderByChild('match_live')
    .equalTo('1')
    .on("value", function (snapshot) {
      snapshot.forEach(function (snap) {
        var doc = snap.val();
        console.log('doc', JSON.stringify(doc));
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
        doc.events = events.sort((a, b) => { return a.time < b.time });
        // console.log('live=====>', doc.events);

        // find in list
        let indexOfDoc = list.findIndex(i => i.match_id === doc.match_id);
        if (indexOfDoc >= 0) {
          let difference = doc.events.filter(x => !list[indexOfDoc].events.includes(x));
            console.log('difference', difference);
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
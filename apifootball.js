const config = require('./config.json');
var rp = require('request-promise');
const querystring = require('querystring');
const fs = require('fs');

module.exports = {
  getEvents: getEvents,
  getStanding: getStanding,
  getH2H: getH2H,
}

function getEvents(leagueId) {
  return new Promise((resolve, reject) => {
    var data = querystring.stringify({
      APIkey: config.apiFootball.apiKey,
      action: 'get_events',
      league_id: leagueId,
      from: config.apiFootball.startDate,
      to: config.apiFootball.endDate,
    });
    rp({
      method: 'GET',
      uri: `${config.apiFootball.url}?${data}`,
    })
      .then(function (body) {
        let data = JSON.parse(body);
        // fs.writeFile(`fixtures_${leagueId}.json`, JSON.stringify(data, null, 2), function (err) {
        //   if (err) { return console.log(`getEvents Error write file league : ${leagueId}`, err); }
        // });
        resolve(data);
      })
      .catch(function (err) {
        console.log(`getEvents Error get data league : ${leagueId}`);
        reject(err);
      });
  });
}

function getStanding(leagueId) {
  return new Promise((resolve, reject) => {
    var data = querystring.stringify({
      APIkey: config.apiFootball.apiKey,
      action: 'get_standings',
      league_id: leagueId,
    });
    rp({
      method: 'GET',
      uri: `${config.apiFootball.url}?${data}`,
    })
      .then(function (body) {
        let data = JSON.parse(body);
        // fs.writeFile(`standing_${leagueId}.json`, JSON.stringify(data, null, 2), function (err) {
        //   if (err) { return console.log(`getStanding Error write file league : ${leagueId}`, err); }
        // });
        resolve(data);
      })
      .catch(function (err) {
        console.log(`getStanding Error get data league : ${leagueId}`);
        reject(err);
      });
  });
}

function getH2H(firstTeam, secondTeam) {
  return new Promise((resolve, reject) => {
    var data = querystring.stringify({
      APIkey: config.apiFootball.apiKey,
      action: 'get_H2H',
      firstTeam: firstTeam,
      secondTeam: secondTeam,
    }, {
      strict: false
    });
    rp({
      method: 'GET',
      uri: `${config.apiFootball.url}?${data}`,
    })
      .then(function (body) {
        let data = JSON.parse(body);
        // fs.writeFile(`standing_${leagueId}.json`, JSON.stringify(data, null, 2), function (err) {
        //   if (err) { return console.log(`getStanding Error write file league : ${leagueId}`, err); }
        // });
        resolve({
          firstTeam: firstTeam,
          secondTeam: secondTeam,
          data: data,
        });
      })
      .catch(function (err) {
        console.log(`getH2H Error get data league : ${leagueId}`);
        reject(err);
      });
  });
}
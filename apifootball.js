const config = require('./config.json');
var rp = require('request-promise');
const querystring = require('querystring');
const fs = require('fs');

module.exports = {
 getLeageData: getLeageData,
}

function getLeageData(leagueId) {
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
        fs.writeFile(`fixtures_${leagueId}.json`, JSON.stringify(data, null, 2), function (err) {
          if (err) { return console.log(`Error write file league : ${leagueId}`, err); }
        });
        resolve(data);
      })
      .catch(function (err) {
        console.log(`Error get data league : ${leagueId}`, err);
        reject(err);
      });
  });
}
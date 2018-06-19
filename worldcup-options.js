const config = require('./config.json');
const moment = require('moment');

module.exports = {
  getMenuBubble: (replyToken) => {
    return {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'FIFA World Cup 2018',
            size: 'xl',
            weight: 'bold'
          }
        ]
      },
      hero: {
        type: 'image',
        url: 'https://sitthi.me:3807/static/fifa.jpg',
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                spacing: 'sm',
                contents: [
                  {
                    type: 'button',
                    style: 'primary',
                    action: {
                      type: 'postback',
                      label: 'Last Match',
                      displayText: 'Last Match',
                      data: 'LAST'
                    }
                  },
                  {
                    type: 'button',
                    style: 'primary',
                    action: {
                      type: 'postback',
                      label: 'Next Match',
                      displayText: 'Next Match',
                      data: 'NEXT'
                    }
                  }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                spacing: 'sm',
                contents: [
                  {
                    type: 'button',
                    style: 'primary',
                    action: {
                      type: 'postback',
                      label: 'Schedule',
                      displayText: 'Schedule',
                      data: 'SCHEDULE'
                    }
                  },
                  {
                    type: 'button',
                    style: 'primary',
                    action: {
                      type: 'postback',
                      label: 'Table',
                      displayText: 'Table',
                      data: 'TABLE'
                    }
                  }
                ]
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          getSourceButton(replyToken)
        ]
      }
    }
  },
  menuLiveBox: {
    type: 'box',
    layout: 'horizontal',
    spacing: 'sm',
    contents: [
      {
        type: 'text',
        text: 'LIVE !',
        size: 'lg',
        color: '#555555',
        weight: 'bold',
        align: 'center'
      }
    ]
  },
  getLiveMatchBox: (match) => {
    let label = `${match.match_hometeam_name}  ${match.match_hometeam_score} : ${match.match_awayteam_score}  ${match.match_awayteam_name}`;
    return {
      type: 'button',
      style: 'primary',
      action: {
        type: 'postback',
        label: label,
        displayText: 'Live Report !!',
        data: 'LIVE'
      }
    }
  },
  getStandingBubble: (teams, replyToken) => {
    let bubble = {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: teams[0].league_name,
            weight: 'bold',
            size: 'xl',
            margin: 'md'
          },
          {
            type: 'separator',
            margin: 'xl'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'md',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'Team',
                    size: 'sm',
                    color: '#555555',
                    weight: 'bold',
                    flex: 3
                  },
                  {
                    type: 'text',
                    text: 'P',
                    size: 'sm',
                    color: '#111111',
                    align: 'end',
                    weight: 'bold'
                  },
                  {
                    type: 'text',
                    text: 'W',
                    size: 'sm',
                    color: '#111111',
                    align: 'end',
                    weight: 'bold'
                  },
                  {
                    type: 'text',
                    text: 'D',
                    size: 'sm',
                    color: '#111111',
                    align: 'end',
                    weight: 'bold'
                  },
                  {
                    type: 'text',
                    text: 'L',
                    size: 'sm',
                    color: '#111111',
                    align: 'end',
                    weight: 'bold'
                  },
                  {
                    type: 'text',
                    text: 'Pt',
                    size: 'sm',
                    color: '#111111',
                    align: 'end',
                    weight: 'bold'
                  }
                ]
              },
              {
                type: 'separator',
                margin: 'md'
              },
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'postback',
              label: 'Schedule',
              data: 'SCHEDULE',
              displayText: 'Schedule'
            },
            style: 'primary'
          },
          getSourceButton(replyToken)
        ]
      }
    };
    teams.forEach(team => {
      let row = {
        type: 'box',
        layout: 'horizontal',
        margin: 'md',
        contents: [
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              {
                type: 'icon',
                url: `${config.BASE_URL}/static/flag/${team.team_name.replace(' ', '')}.png`,
                size: 'sm'
              },
              {
                type: 'text',
                text: team.team_name,
                size: 'sm',
                color: '#555555'
              }
            ],
            flex: 3
          },
          {
            type: 'text',
            text: team.overall_league_payed,
            size: 'sm',
            color: '#111111',
            align: 'end'
          },
          {
            type: 'text',
            text: team.overall_league_W,
            size: 'sm',
            color: '#00ff00',
            align: 'end'
          },
          {
            type: 'text',
            text: team.overall_league_D,
            size: 'sm',
            color: '#aaaaaa',
            align: 'end'
          },
          {
            type: 'text',
            text: team.overall_league_L,
            size: 'sm',
            color: '#ff0000',
            align: 'end'
          },
          {
            type: 'text',
            text: team.overall_league_PTS,
            size: 'sm',
            color: '#111111',
            align: 'end'
          }
        ]
      };
      bubble.body.contents[2].contents.push(row);
    });

    return bubble;
  },
  getScheduleBubble: (matchs, replyToken) => {
    let bubble = {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: matchs[0].league_name,
            weight: 'bold',
            size: 'xl',
            margin: 'md'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'postback',
              label: 'Table',
              data: 'TABLE',
              displayText: 'Table'
            },
            style: 'primary'
          },
          getSourceButton(replyToken)
        ]
      }
    };
    matchs.forEach(match => {
      let matchDateTime = moment(`${match.match_date} ${match.match_time}`).add(5, 'hours');
      let row = {
        type: 'box',
        layout: 'horizontal',
        spacing: 'sm',
        contents: [
          {
            type: 'box',
            layout: 'vertical',
            flex: 5,
            contents: [
              {
                type: 'text',
                size: 'sm',
                text: `${matchDateTime.format('YYYY-MM-DD HH:mm')}`,
                align: 'start'
              },
              {
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
                    text: `${match.match_hometeam_score || '?'}`,
                    flex: 1,
                    align: 'center'
                  },
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  {
                    type: 'icon',
                    url: `${config.BASE_URL}/static/flag/${match.match_awayteam_name.replace(' ', '')}.png`,
                    size: 'sm',
                  },
                  {
                    type: 'text',
                    text: match.match_awayteam_name,
                    flex: 3,
                    align: 'start'
                  },
                  {
                    type: 'text',
                    text: `${match.match_awayteam_score || '?'}`,
                    flex: 1,
                    align: 'center'
                  },
                ]
              }
            ]
          },
          {
            type: 'separator',
          },
          {
            type: 'button',
            flex: 3,
            height: 'sm',
            gravity: 'center',
            style: 'secondary',
            action: {
              type: 'postback',
              label: 'Detail',
              data: 'INFO_' + match.match_id,
              displayText: `${match.match_hometeam_name} VS ${match.match_awayteam_name}`
            },
          }
        ]
      };
      bubble.body.contents.push({ "type": "separator" });
      bubble.body.contents.push(row);
    });

    return bubble;
  },
  getMatchContentBubble: (title, match, replyToken) => {
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
          flex: 2,
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
    if (detail.contents.length > 0) {
      contents.push(detail);
    }

    let body = {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: contents,
    };
    let matchDateTime = moment(`${match.match_date} ${match.match_time}`).add(5, 'hours');
    let footer = {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          "type": "separator",
          "margin": "xxl"
        },
        {
          type: 'box',
          layout: 'baseline',
          margin: 'md',
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
        },
        {
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
              text: `${matchDateTime.format('YYYY-MM-DD HH:mm')}`,
              wrap: true,
              size: 'sm',
              color: '#666666',
              flex: 4
            }
          ]
        },
        {
          "type": "separator",
          "margin": "xxl"
        },
        {
          type: 'button',
          style: 'primary',
          margin: 'md',
          action: {
            type: 'postback',
            label: 'Head 2 Head',
            displayText: `${match.match_hometeam_name} VS ${match.match_awayteam_name}`,
            data: `H2H_${match.match_id}`,
          },
        }
      ]
    };
    if (match.statistics && match.statistics.length > 0) {
      footer.contents.push({
        type: 'button',
        style: 'primary',
        margin: 'md',
        action: {
          type: 'postback',
          label: 'Match Statistics',
          displayText: `${match.match_hometeam_name} VS ${match.match_awayteam_name}`,
          data: `STAT_${match.match_id}`,
        },
      });
    }
    footer.contents.push(getSourceButton(replyToken));
    let container = {
      type: 'bubble',
      body: body,
      footer: footer,
    };
    return container;
  },
  getH2HContentBubble: (title, result, replyToken) => {
    let info = result.data;
    let teamA = result.firstTeam;
    let teamB = result.secondTeam;
    console.log('team', teamA, teamB);
    // title
    let titleBlock = {
      type: 'text',
      text: title,
      wrap: true,
      weight: 'bold',
      gravity: 'center',
      size: 'lg'
    };
    // h2h
    let h2hBlock = {
      type: 'text',
      text: 'Head to head match not available!',
    };
    if (info.firstTeam_VS_secondTeam && info.firstTeam_VS_secondTeam.length > 0) {
      let h2hContent = [];
      info.firstTeam_VS_secondTeam.forEach(match => {
        h2hContent.push({
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
              flex: 2,
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
      });
      h2hBlock = {
        type: 'box',
        layout: 'vertical',
        contents: h2hContent,
      };
    }
    // last match
    let lastMatchBlock = {
      type: 'text',
      text: 'Recent match not available!',
    };
    if ((info.firstTeam_lastResults && info.firstTeam_lastResults.length > 0) ||
      (info.secondTeam_lastResults && info.secondTeam_lastResults.length > 0)) {
      let recentMatchA = [{
        type: 'text',
        text: teamA,
        weight: 'bold',
        align: 'center',
      }];
      let recentMatchB = [{
        type: 'text',
        text: teamB,
        weight: 'bold',
        align: 'center',
      }];
      if (info.firstTeam_lastResults && info.firstTeam_lastResults.length > 0) {
        info.firstTeam_lastResults.forEach(match => {
          recentMatchA.push(getRecentMatch(teamA, match));
        });
      }
      if (info.secondTeam_lastResults && info.secondTeam_lastResults.length > 0) {
        info.secondTeam_lastResults.forEach(match => {
          recentMatchB.push(getRecentMatch(teamB, match));
        });
      }
      let recentBoxA = {
        type: 'box',
        layout: 'vertical',
        contents: recentMatchA,
      };
      let recentBoxB = {
        type: 'box',
        layout: 'vertical',
        margin: 'md',
        contents: recentMatchB,
      };

      lastMatchBlock = {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'Recent Match',
            weight: 'bold',
            align: 'center',
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [recentBoxA, { type: 'separator', margin: 'md' }, recentBoxB],
          }
        ],
      };
    }

    let body = {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: [
        titleBlock,
        h2hBlock,
        {
          type: 'separator',
        },
        lastMatchBlock,
      ],
    };

    let footer = {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          "type": "separator",
          "margin": "xxl"
        },
        getSourceButton(replyToken)
      ]
    };
    let container = {
      type: 'bubble',
      body: body,
      footer: footer,
    };
    return container;
  },
  getStatContentBubble: (title, match, replyToken) => {
    let stats = match.statistics;
    // title
    let titleBlock = {
      type: 'text',
      text: 'Statistics',
      wrap: true,
      weight: 'bold',
      gravity: 'center',
      size: 'lg'
    };

    let teamBlock = {
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
          flex: 2,
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
    };

    // last match
    let statBlock = {
      type: 'text',
      text: 'Statistics not available!',
      align: 'center',
    };
    if (stats && stats.length > 0) {
      let statContents = stats.map(stat => {
        return {
          type: 'box',
          layout: 'baseline',
          contents: [
            {
              type: 'text',
              flex: 2,
              align: 'center',
              text: stat.home,
            },
            {
              type: 'text',
              flex: 5,
              align: 'center',
              text: stat.type,
            },
            {
              type: 'text',
              flex: 2,
              align: 'center',
              text: stat.away,
            },
          ],
        }
      });
      statBlock = {
        type: 'box',
        layout: 'vertical',
        contents: statContents,
      };
    }

    let body = {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: [
        titleBlock,
        teamBlock,
        {
          type: 'separator',
        },
        statBlock,
      ],
    };

    let footer = {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          "type": "separator",
          "margin": "xxl"
        },
        getSourceButton(replyToken)
      ]
    };
    let container = {
      type: 'bubble',
      body: body,
      footer: footer,
    };
    return container;
  }
}

function getSourceButton(replyToken) {
  return {
    type: 'button',
    action: {
      type: 'uri',
      label: 'View Source [dev]',
      uri: `https://sitthi.me:3807/downloaded/${replyToken}.json`
    },
    style: 'secondary'
  }
}

function getRecentMatch(team, match) {
  let isHome = (match.match_hometeam_name === team);
  let isDraw = (match.match_hometeam_score === match.match_awayteam_score);
  let isHomeWin = (+(match.match_hometeam_score) > +(match.match_awayteam_score));
  return {
    type: 'box',
    layout: 'baseline',
    contents: [
      {
        type: 'text',
        size: 'xs',
        flex: 2,
        color: '#111111',
        margin: 'md',
        text: isDraw ? 'D' : (isHome ? (isHomeWin ? 'W' : 'L') : (isHomeWin ? 'L' : 'W')),
      },
      {
        type: 'text',
        size: 'xs',
        flex: 7,
        text: isHome ? match.match_awayteam_name : match.match_hometeam_name,
      },
      {
        type: 'text',
        size: 'xs',
        flex: 1,
        text: `${match.match_hometeam_score}`,
      },
      {
        type: 'text',
        size: 'xs',
        flex: 1,
        text: '-',
      },
      {
        type: 'text',
        size: 'xs',
        flex: 1,
        text: `${match.match_awayteam_score}`,
      }
    ],
  };
}

function createPostBackOption(label, key, data) {
  let shortLabel = label.trimLeft().trimRight().substring(0, 12);
  return { label: shortLabel, type: 'postback', data: (key + (data ? ('_' + data) : '')), displayText: shortLabel };
}

function createUrlOption(label, uri) {
  return { label: label, type: 'uri', uri: uri };
}
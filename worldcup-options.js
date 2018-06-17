const config = require('./config.json');

module.exports = {
  menuBubble: {
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
                    data: 'LAST_MATCH'
                  }
                },
                {
                  type: 'button',
                  style: 'primary',
                  action: {
                    type: 'postback',
                    label: 'Next Match',
                    displayText: 'Next Match',
                    data: 'NEXT_MATCH'
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
                    label: 'Group',
                    displayText: 'Group',
                    data: 'GROUP'
                  }
                }
              ]
            }
          ]
        }
      ]
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
}

function createPostBackOption(label, key, data) {
  let shortLabel = label.trimLeft().trimRight().substring(0, 12);
  return { label: shortLabel, type: 'postback', data: (key + (data ? ('_' + data) : '')), displayText: shortLabel };
}

function createUrlOption(label, uri) {
  return { label: label, type: 'uri', uri: uri };
}
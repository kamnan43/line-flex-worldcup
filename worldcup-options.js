const config = require('./config.json');

module.exports = {
  matchContentBubble: {
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
      url: `${config.BASE_URL}/static/fifa.jpg`,
      size: 'full',
      aspectRatio: '2:1',
      aspectMode: 'cover',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: [],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          action: {
            type: 'postback',
            label: 'Subscribe Live Result',
            data: 'subscribe',
            displayText: 'subscribe'
          },
          style: 'primary'
        }
      ]
    }
  }
}

function createPostBackOption(label, key, data) {
  let shortLabel = label.trimLeft().trimRight().substring(0, 12);
  return { label: shortLabel, type: 'postback', data: (key + (data ? ('_' + data) : '')), displayText: shortLabel };
}

function createUrlOption(label, uri) {
  return { label: label, type: 'uri', uri: uri };
}
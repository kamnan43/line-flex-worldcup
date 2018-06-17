module.exports = {
  tosActions: [
    createPostBackOption('ตกลง', 'TOS_YES'),
    createPostBackOption('ยกเลิก', 'TOS_NO')
  ],
  genderActions: [
    createPostBackOption('ชาย', 'GENDER_M'),
    createPostBackOption('หญิง', 'GENDER_F'),
    // createPostBackOption('อื่นๆ', 'GENDER_X')
  ],
  ageActions: [
    createPostBackOption('18-22 ปี', 'AGE_18-22'),
    createPostBackOption('23-27 ปี', 'AGE_23-27'),
    createPostBackOption('28-32 ปี', 'AGE_28-32'),
    createPostBackOption('33 ขึ้นไป', 'AGE_33UP')
  ],
  candidateGenderActions: [
    createPostBackOption('ชาย', 'CANDIDATE-GENDER_M'),
    createPostBackOption('หญิง', 'CANDIDATE-GENDER_F'),
    // createPostBackOption('อื่นๆ', 'CANDIDATE-GENDER_X')
  ],
  candidateAgeActions: [
    createPostBackOption('18-22 ปี', 'CANDIDATE-AGE_18-22'),
    createPostBackOption('23-27 ปี', 'CANDIDATE-AGE_23-27'),
    createPostBackOption('28-32 ปี', 'CANDIDATE-AGE_28-32'),
    createPostBackOption('33 ขึ้นไป', 'CANDIDATE-AGE_33UP')
  ],
  friendActions: [
    createPostBackOption('รับ', 'FRIEND_YES'),
    createPostBackOption('ไม่รับ', 'FRIEND_NO')
  ],
  getImageAction: (extra) => {
    return createPostBackOption('ดูรูป', 'ACTION-IMAGE', extra);
  },
  getSayHiAction: (extra) => {
    return [
      createPostBackOption('ส่งเลย', 'SAYHI-YES', extra),
      createPostBackOption('ไม่ใช่ตอนนี้', 'SAYHI-NO', extra),
    ];
  },
  getCandidateProfileAction: (extra, isFriend) => {
    let options = [];
    if (isFriend) {
      options = [
        createPostBackOption('แชท', 'ACTION-CHAT', extra),
        createPostBackOption('ความคิดเห็น', 'ACTION-COMMENT', extra),
        createPostBackOption('อื่นๆ', 'ACTION-OTHER', extra),
      ];
    } else {
      options = [
        createPostBackOption('ทักทาย', 'ACTION-CHAT', extra),
        createPostBackOption('ถูกใจ', 'ACTION-LOVE', extra),
        createPostBackOption('อื่นๆ', 'ACTION-OTHER', extra),
      ]
    }
    return options;
  },
  getOtherAction: (extra, isFriend) => {
    let options = [];
    if (isFriend) {
      options = [
        createUrlOption('แนะนำให้เพื่อน', `line://msg/text/?%E0%B8%84%E0%B8%99%E0%B8%99%E0%B8%B5%E0%B9%89%E0%B8%99%E0%B9%88%E0%B8%B2%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%88%0A%E0%B9%80%E0%B8%88%E0%B8%AD%E0%B8%A1%E0%B8%B2%E0%B8%88%E0%B8%B2%E0%B8%81%20Cupid%20Dating%0A%E0%B8%A5%E0%B8%AD%E0%B8%87%E0%B9%80%E0%B8%82%E0%B9%89%E0%B8%B2%E0%B9%84%E0%B8%9B%E0%B8%AA%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B8%94%E0%B8%B9%E0%B8%AA%E0%B8%B4%20%E0%B8%97%E0%B8%B5%E0%B9%88%0Aline%3A%2F%2FoaMessage%2F%40znu7334q%2F%3F%40${extra}`),
        createPostBackOption('บล็อค', 'ACTION-BLOCK', extra),
      ];
    } else {
      options = [
        createPostBackOption('ความคิดเห็น', 'ACTION-COMMENT', extra),
        createUrlOption('แนะนำให้เพื่อน', `line://msg/text/?%E0%B8%84%E0%B8%99%E0%B8%99%E0%B8%B5%E0%B9%89%E0%B8%99%E0%B9%88%E0%B8%B2%E0%B8%AA%E0%B8%99%E0%B9%83%E0%B8%88%0A%E0%B9%80%E0%B8%88%E0%B8%AD%E0%B8%A1%E0%B8%B2%E0%B8%88%E0%B8%B2%E0%B8%81%20Cupid%20Dating%0A%E0%B8%A5%E0%B8%AD%E0%B8%87%E0%B9%80%E0%B8%82%E0%B9%89%E0%B8%B2%E0%B9%84%E0%B8%9B%E0%B8%AA%E0%B9%88%E0%B8%AD%E0%B8%87%E0%B8%94%E0%B8%B9%E0%B8%AA%E0%B8%B4%20%E0%B8%97%E0%B8%B5%E0%B9%88%0Aline%3A%2F%2FoaMessage%2F%40znu7334q%2F%3F%40${extra}`),
        createPostBackOption('บล็อค', 'ACTION-BLOCK', extra),
      ]
    }
    return options;
  },
  getCandidateImageAction: (actionText, extra) => {
    return createPostBackOption(actionText, 'ACTION-PROFILE', extra);
  },
  getMessageAction: (extra) => {
    return [
      createPostBackOption('ตอบกลับ', 'ACTION-CHAT', extra),
      createPostBackOption('ดูโปรไฟล์', 'ACTION-PROFILE', extra)
    ];
  },
  getSuggestAction: (extra) => {
    return [
      createPostBackOption('ทักทาย', 'ACTION-CHAT', extra),
      createPostBackOption('ดูโปรไฟล์', 'ACTION-PROFILE', extra)
    ];
  },
  getCommentAction: (extra) => {
    return [
      createPostBackOption('ดูความเห็น', 'ACTION-COMMENT'),
      createPostBackOption('ดูโปรไฟล์', 'ACTION-PROFILE', extra)
    ];
  },
  nextMatch: {
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
      url: 'https://cdn4.dogonews.com/images/2282917c-3f8c-4bcf-b984-72dab7ffa5c0/dp-p_3pxcaaj8wb.jpg',
      size: 'full',
      aspectRatio: '2:1',
      aspectMode: 'cover',
      action: {
        type: 'uri',
        uri: 'http://linecorp.com/'
      }
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
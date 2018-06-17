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

module.exports = {
  updateFixture: updateFixture,
  getLastMatch: getLastMatch,
  getNextMatch: getNextMatch,

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

  sendGreetingMessage: async (userId, replyToken) => {
    let lastMatch = await getLastMatch();
    let nextMatch = await getNextMatch();
    let lastMatchBubble = getMatchContentBubble('Last Match', lastMatch);
    // console.log('lastMatchBubble', JSON.stringify(lastMatchBubble));
    let nextMatchBubble = getMatchContentBubble('Next Match', nextMatch);
    // console.log('nextMatchBubble', JSON.stringify(nextMatchBubble));
    let messages = [
      lineHelper.createFlexCarouselMessage('Last/Next Match Info', [lastMatchBubble, nextMatchBubble]),
    ];
    line.replyMessage(replyToken, messages)
    .then((msg)=>{
      console.log('line:', msg)
    })
    .catch((err)=> {
      console.log('line error:', err)
    });
  },

  setPersonal: (userId, replyToken, firstTime) => {
    if (firstTime) {
      updateMemberData(userId, {
        userId: userId,
        lastActionDate: Date.now(),
        status: 0,
      });
    }
    line.getProfile(userId)
      .then((profile) => {
        let messages = [
          lineHelper.createTextMessage(`กรุณาระบุเพศ และ อายุ ของคุณ`),
          lineHelper.createButtonMessage('ระบุเพศของคุณ', options.genderActions)
        ];
        if (firstTime) messages.unshift(lineHelper.createTextMessage(`บันทึกเรียบร้อยแล้ว\nขั้นตอนต่อไป`));
        Promise.all([
          updateMemberProfilePicture(userId, profile),
          line.replyMessage(replyToken, messages)]
        );
      });
  },

  saveSpec: (userId, replyToken) => {
    line.replyMessage(
      replyToken,
      [
        lineHelper.createTextMessage(`กรุณาระบุเพศที่คุณสนใจ`),
        lineHelper.createButtonMessage('เพศที่คุณสนใจ', options.candidateGenderActions)
      ]
    );
  },

  saveGender: (userId, replyToken, gender) => {
    updateMemberData(userId, { 'gender': gender })
      .then(() => {
        line.replyMessage(
          replyToken,
          [
            lineHelper.createButtonMessage('ระบุอายุของคุณ', options.ageActions)
          ]
        );
      })
  },

  saveAge: (userId, replyToken, age) => {
    var minAge, maxAge;
    switch (age) {
      case '18-22': minAge = 18; maxAge = 22; break;
      case '23-27': minAge = 23; maxAge = 27; break;
      case '28-32': minAge = 28; maxAge = 32; break;
      case '33UP': minAge = 33; maxAge = 99; break;
    }
    updateMemberData(userId, { 'age': age, 'min_age': minAge, 'max_age': maxAge })
      .then(() => {
        return getUserInfo(userId)
      })
      .then((profile) => {
        if (!profile.candidate_age) {
          line.replyMessage(
            replyToken,
            [
              lineHelper.createTextMessage(`ขั้นตอนต่อไป กรุณาระบุเพศที่คุณสนใจ`),
              lineHelper.createButtonMessage('เพศที่คุณสนใจ', options.candidateGenderActions)
            ]
          );
        } else {
          line.replyMessage(replyToken, [lineHelper.createTextMessage(`บันทึกข้อมูลเรียบร้อย`)]);
          setTimeout(viewCandidateListAndBraodcast, 1000, userId);
        }
      });
  },

  saveCandidateGender: (userId, replyToken, candidate_gender) => {
    updateMemberData(userId, { 'candidate_gender': candidate_gender })
      .then(() => {
        line.replyMessage(
          replyToken,
          [
            lineHelper.createButtonMessage('ระบุอายุของคนที่คุณสนใจ', options.candidateAgeActions)
          ]
        );
      });
  },

  saveCandidateAge: (userId, replyToken, candidate_age) => {
    var minAge, maxAge;
    switch (candidate_age) {
      case '18-22': minAge = 18; maxAge = 22; break;
      case '23-27': minAge = 23; maxAge = 27; break;
      case '28-32': minAge = 28; maxAge = 32; break;
      case '33UP': minAge = 33; maxAge = 99; break;
    }
    updateMemberData(userId, { 'candidate_age': candidate_age, 'candidate_min_age': minAge, 'candidate_max_age': maxAge, 'status': 1 })
      .then(() => {
        line.replyMessage(replyToken, [lineHelper.createTextMessage(`บันทึกข้อมูลเรียบร้อย`)]);
      })
      .then(() => {
        setTimeout(viewCandidateListAndBraodcast, 1000, userId);
      });
  },

  sendCandidateProfile: (userId, replyToken, candidateUserId, showOtherOptions) => {
    viewCandidateProfile(userId, replyToken, candidateUserId, showOtherOptions);
  },

  sendCandidateList: (userId, replyToken) => {
    viewCandidateList(userId, replyToken);
  },

  sendFriendList: (userId, replyToken) => {
    viewFriendList(userId, replyToken, false);
  },

  // sendLoveList: (userId, replyToken) => {
  //   viewLoveList(userId, replyToken, true);
  // },

  sendCandidateProfileImage: (userId, replyToken, candidateUserId) => {
    if (!candidateUserId) sendPleaseRegisterMessage(userId, replyToken);
    line.replyMessage(
      replyToken,
      [
        lineHelper.createImageMessage(getProfileUrl(candidateUserId), getProfilePreviewUrl(candidateUserId)),
      ]
    );
  },

  sendLoveToCandidate: (userId, replyToken, candidateUserId) => {
    if (!candidateUserId) sendPleaseRegisterMessage(userId, replyToken);
    var candidateName;
    var candidateProfile;
    var obj = {};
    obj['relations/' + candidateUserId] = { 'relation': 'LOVE' };
    updateMemberData(userId, obj)
      .then(() => {
        return getUserInfo(candidateUserId)
      })
      .then((profile) => {
        candidateProfile = profile;
        delete candidateProfile.relations;
        delete candidateProfile.comments;
        delete candidateProfile.nextCandidate;
        candidateName = candidateProfile.displayName;
        return updateMemberRelationData(userId, candidateProfile);
      })
      .then(() => {
        return readCandidateRelation(candidateUserId, userId);
      })
      .then((relation) => {
        if (relation === 'LOVE') {
          updateMemberData(userId, { 'nextMessageTo': candidateUserId, 'nextCommentTo': '' })
            .then(() => {
              return line.replyMessage(replyToken, [createMatchedMessage(candidateName, candidateUserId)]);
            })
            .then(() => {
              return getUserInfo(userId)
            })
            .then((profile) => {
              profile.isFriend = true;
              line.pushMessage(candidateUserId, [createMatchedMessage(profile.displayName, userId)])
            });
        } else {
          line.replyMessage(
            replyToken,
            [
              lineHelper.createTextMessage(`ถูกใจหล่ะสิ ถ้าคุณ [${candidateName}] ถูกใจคุณเหมือนกัน เราจะบอกให้คุณรู้ทันที`),
            ]
          );
        }
      });
  },

  blockCandidate: (userId, replyToken, candidateUserId) => {
    if (!candidateUserId) sendPleaseRegisterMessage(userId, replyToken);
    var obj = {};
    obj['relations/' + candidateUserId] = { 'relation': 'BLOCK' };
    updateMemberData(userId, obj)
      .then(() => {
        line.replyMessage(
          replyToken,
          lineHelper.createTextMessage(`บล็อคเรียบร้อย จากกันชั่วนิรันดร์ '_'\nถ้าเปลี่ยนใจ ก็กลับมากด ถูกใจ ใหม่ได้นะ`),
        );
      });
  },

  chatCandidate: (userId, replyToken, candidateUserId) => {
    updateMemberData(userId, { 'nextMessageTo': candidateUserId, 'nextCommentTo': '' })
      .then(() => {
        return getUserInfo(candidateUserId)
      })
      .then((profile) => {
        line.replyMessage(
          replyToken,
          lineHelper.createTextMessage(`เริ่มส่งข้อความถึง [${profile.displayName}] ได้เลย`),
        )
      });
  },

  showComment: (userId, replyToken, candidateUserId) => {
    if (candidateUserId !== userId) updateMemberData(userId, { 'nextMessageTo': '', 'nextCommentTo': candidateUserId });
    getUserInfo(candidateUserId)
      .then((profile) => {
        let commentList = [];
        if (profile.comments) {
          Object.values(profile.comments).forEach(comment => {
            commentList.push(`[${comment.commentBy.displayName}] : ${comment.commentText}   (${moment(comment.commentDate).fromNow()})`);
          });
        }
        if (candidateUserId !== userId) commentList.push(`\nพิมพ์ความคิดเห็นถึง [${profile.displayName}] ได้เลย`);
        line.replyMessage(
          replyToken,
          lineHelper.createTextMessage(commentList.join('\n')),
        )
      });
  },

  sendMessageToFriend: (userId, replyToken, message) => {
    var senderProfile;
    getUserInfo(userId)
      .then((profile) => {
        if (profile.nextMessageTo) {
          senderProfile = profile;
          switch (message.type) {
            case 'text':
              line.pushMessage(
                senderProfile.nextMessageTo,
                [
                  lineHelper.createConfirmMessage(`ข้อความจาก [${senderProfile.displayName}] : \n` + message.text, options.getMessageAction(senderProfile.userId))
                ]
              ).then(() => {
                return line.replyMessage(replyToken, [lineHelper.createTextMessage('ส่งข้อความแล้ว')]);
              }).then(() => {
                updateMemberData(userId, { 'nextMessageTo': '' })
              })
              break;
            // return getTextMessage(message);
            //return lineHelper.createConfirmMessage(`ข้อความจาก [${senderProfile.displayName}] : \n` + message.text, options.getMessageAction(senderProfile.userId))
            // case 'image':
            //   return getImageMessage(message);
            // case 'video':
            //   return pushVideoMessage(userId, replyToken, message);
            // case 'audio':
            //   return pushAudioMessage(userId, replyToken, message);
            // case 'location':
            //   return handleLocation(message, event.replyToken);
            // case 'sticker':
            //   return handleSticker(message, event.replyToken);
            default:
              return line.replyMessage(replyToken, [lineHelper.createTextMessage('ขออภัย ระบบยังไม่รองรับข้อความประเภทนี้')]);
          }
        } else if (profile.nextCommentTo) {
          senderProfile = profile;
          switch (message.type) {
            case 'text':
              line.pushMessage(
                senderProfile.nextCommentTo,
                [
                  lineHelper.createConfirmMessage(`[${senderProfile.displayName}] ได้แสดงความคิดเห็นที่โปรไฟล์ของคุณ\n\n[${senderProfile.displayName}] : ` + message.text, options.getCommentAction(senderProfile.userId))
                ]
              ).then(() => {
                return line.replyMessage(replyToken, [lineHelper.createTextMessage('ส่งความคิดเห็นแล้ว')]);
              }).then(() => {
                updateMemberData(userId, { 'nextCommentTo': '' });
                updateMemberCommentData(senderProfile, message.text, senderProfile.nextCommentTo);
              })
              break;
            default:
              return line.replyMessage(replyToken, [lineHelper.createTextMessage('ขออภัย ระบบยังไม่รองรับข้อความประเภทนี้')]);
          }
        } else {
          return line.replyMessage(replyToken, [lineHelper.createTextMessage('ไม่เอา ไม่คุย ไม่ต้องมาพูด')]);
        }
      }).catch((error) => { console.log('sendMessageToFriend Error', error + '') });


  },

  disableMember: (userId) => {
    updateMemberData(userId, { 'status': -1 });
  }
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

// function createBlindCandidateBeforeRegisterMessage() {
//   return new Promise((resolve, reject) => {
//     try {
//       let lists = [];
//       membersRef.orderByChild('lastActionDate')
//         .limitToLast(50)
//         .once("value", function (snapshot) {
//           snapshot.forEach(function (snap) {
//             var doc = snap.val();
//             console.log(doc);
//             if (doc.status == 1) {
//               if (lists.length < lineHelper.maxCarouselColumns) lists.push(doc);
//             }
//           });
//           var columns = lists.map(element => {
//             var title = (element.displayName || 'ไม่มีชื่อ') + ' [เพศ ' + element.gender + ' อายุ ' + element.age + ' ปี]'
//             return lineHelper.createCarouselColumns(title, element.statusMessage || 'ไม่ระบุสถานะ', config.BASE_URL + `/static/cupid.png`);
//           });
//           console.log('columns', JSON.stringify(columns));
//           if (columns.length > 0) {
//             resolve(createProfileListMessage(`ตัวอย่างคนที่อาจเป็นเพื่อนใหม่ของคุณ`, columns));
//           }
//         });
//     } catch (e) {
//       reject();
//     }
//   });
// }

function viewCandidateListAndBraodcast(userId) {
  viewCandidateList(userId, undefined, true);
}

function viewCandidateProfile(userId, replyToken, candidateUserId, showOtherOptions) {
  let candidateRelation;
  let memberRelation;
  readCandidateRelation(candidateUserId, userId)
    .then((relation) => {
      candidateRelation = relation;
      return readCandidateRelation(userId, candidateUserId)
    })
    .then((relation) => {
      memberRelation = relation;
      return getUserInfo(candidateUserId)
    })
    .then((candidateInfo) => {
      candidateInfo.isFriend = (candidateRelation === 'LOVE' && memberRelation === candidateRelation);
      try {
        let ms = createProfileMessage(`เราคิดว่า คุณอาจอยากรู้จักเพื่อนใหม่เหล่านี้`, candidateInfo, showOtherOptions);
        console.log(JSON.stringify(ms));
        line.replyMessage(replyToken, [ms]);
      } catch (e) {
        console.log(e);
      }
    }).catch((error) => { console.log('viewCandidateProfile Error', error + '') });
};

function viewCandidateList(userId, replyToken, broadcast) {
  getUserInfo(userId)
    .then((userInfo) => {
      try {
        let lists = [];
        let nextCandidate = userInfo.nextCandidate;
        let query = membersRef.orderByChild('age');
        updateMemberProfilePicture(userId, userInfo);
        if (nextCandidate) {
          query = query.startAt(nextCandidate.age, nextCandidate.userId);
        }
        query.once("value", function (snapshot) {
          snapshot.forEach(function (snap) {
            var doc = snap.val();
            if (doc.userId !== userInfo.userId && doc.age === userInfo.candidate_age && doc.gender === userInfo.candidate_gender && doc.status == 1 && (!userInfo.relations || !userInfo.relations[doc.userId])) {
              // if (userInfo.age === doc.candidate_age && userInfo.gender === doc.candidate_gender && (!doc.relations || !doc.relations[userInfo.userId] || doc.relations[userInfo.userId].relation !== 'BLOCK')) {
              if (broadcast && userInfo.age === doc.candidate_age && userInfo.gender === doc.candidate_gender && (!doc.relations || !doc.relations[userInfo.userId] || doc.relations[userInfo.userId].relation !== 'BLOCK')) {
                sendNewFriendToCandidate(doc.userId, userInfo);
              }
              if (lists.length < lineHelper.maxCarouselColumns) {
                lists.push(doc);
              } else {
                if (!nextCandidate) nextCandidate = doc;
              }
              // }
            }
          });
          if (nextCandidate) {
            delete nextCandidate.relations;
            delete nextCandidate.comments;
            delete nextCandidate.nextCandidate;
            updateMemberData(userId, { 'nextCandidate': nextCandidate })
          }
          if (lists.length > 0) {
            if (replyToken) {
              line.replyMessage(replyToken, [createImageCarouselMessage(`เราคิดว่า คุณอาจอยากรู้จักเพื่อนใหม่เหล่านี้`, lists)]);
            } else {
              line.pushMessage(userId, [createImageCarouselMessage(`เราคิดว่า คุณอาจอยากรู้จักเพื่อนใหม่เหล่านี้`, lists)]);
            }
          } else {
            if (replyToken) {
              line.replyMessage(replyToken, [lineHelper.createTextMessage(`ยังไม่มีเพื่อนใหม่ที่น่าสนใจตอนนี้`)]);
            } else {
              line.pushMessage(userId, [lineHelper.createTextMessage(`ยังไม่มีเพื่อนใหม่ที่น่าสนใจตอนนี้`)]);
            }
          }
        });
      } catch (e) {
        console.log(e);
      }
    });
};

function viewFriendList(userId, replyToken) {
  lists = [];
  getMemberRelation(userId)
    .then((docLists) => {
      let promissMap = docLists.map(doc => {
        return readCandidateRelation(doc.userId, userId)
          .then((relation) => {
            if (relation !== 'BLOCK') {
              if (lists.length < lineHelper.maxCarouselColumns) {
                doc.isFriend = (relation === 'LOVE');
                lists.push(doc);
              }
            }
          });
      });
      Promise.all(promissMap)
        .then(() => {
          console.log('lists', lists);
          console.log('replyToken', replyToken);
          if (lists.length > 0) {
            let ms = createProfileListMessage(`เราคิดว่า คุณอาจอยากรู้จักเพื่อนใหม่เหล่านี้`, lists);
            console.log('ms', JSON.stringify(ms));
            line.replyMessage(replyToken, [ms]);
          } else {
            line.replyMessage(replyToken, [lineHelper.createTextMessage(`ไม่มีเจ้าค่ะ ไม่มีเลยเจ้าค่ะ`)]);
          }
        })
        .catch((err) => {
          console.error(err);
        });
    });
}

function sendNewFriendToCandidate(sendToUserId, userInfo) {
  var title = (userInfo.displayName || 'ไม่มีชื่อ') + ' [เพศ ' + userInfo.gender + ' อายุ ' + userInfo.age + ' ปี]'
  line.pushMessage(
    sendToUserId,
    [
      lineHelper.createConfirmMessage(`คุณอาจอยากรู้จักเพื่อนใหม่คนนี้\nชื่อ : ${title}\nสถานะ : ${userInfo.statusMessage}`, options.getSuggestAction(userInfo.userId))
    ]
  );
}

function readCandidateRelation(candidateUserId, userId) {
  return new Promise((resolve, reject) => {
    var candidateRelationRef = database.ref("/members/" + candidateUserId + "/relations");
    candidateRelationRef.orderByKey()
      .equalTo(userId)
      .once("value", (snapshot) => {
        if (snapshot.val() !== null) {
          snapshot.forEach(function (snap) {
            var doc = snap.val();
            resolve(doc.relation);
          });
        } else {
          resolve(false);
        }
      }, (error) => {
        console.error(error + '');
      });
  });
}

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

function getProfilePath(userId) {
  return path.join(__dirname, 'downloaded', `${userId}-profile.jpg`);
}

function getProfilePreviewPath(userId) {
  return path.join(__dirname, 'downloaded', `${userId}-profile-preview.jpg`);
}

function getProfileUrl(userId) {
  return config.BASE_URL + `/downloaded/${userId}-profile.jpg?date=${Date.now()}`;
}

function getProfilePreviewUrl(userId) {
  return config.BASE_URL + `/downloaded/${userId}-profile-preview.jpg?date=${Date.now()}`;
}

function sendPleaseRegisterMessage(userId, replyToken, text) {
  line.replyMessage(
    replyToken,
    [
      lineHelper.createConfirmMessage(`ต้องการเริ่มต้นใช้งาน เดี๋ยวนี้เลยหรือไม่`, options.tosActions)
    ]
  );
}

function updateMemberProfilePicture(userId, profile) {
  Promise.all([
    downloadProfilePicture(profile.pictureUrl, getProfilePath(userId)),
    updateMemberData(userId, profile)
  ]).then(() => {
    cp.execSync(`convert -resize 240x jpeg: ${getProfilePath(userId)} jpeg: ${getProfilePreviewPath(userId)}`);
  }).catch((error) => { console.log('updateMemberProfilePicture Error', error + '') });
}

function downloadProfilePicture(pictureUrl, downloadPath) {
  return new Promise((resolve, reject) => {
    http.get(pictureUrl, function (response) {
      const writable = fs.createWriteStream(downloadPath);
      response.pipe(writable);
      response.on('end', () => resolve(downloadPath));
      response.on('error', reject);
    });
  });
}

function updateMemberData(userId, object) {
  object['lastActionDate'] = Date.now();
  var memberRef = database.ref("/members/" + userId);
  return memberRef.update(object);
}

function updateMemberRelationData(userId, candidateProfile) {
  candidateProfile['lastActionDate'] = Date.now();
  var memberRelationRef = database.ref("/members/" + userId + "/relations/" + candidateProfile.userId);
  return memberRelationRef.update(candidateProfile);
}

function updateMemberCommentData(userProfile, commentText, candidateUserId) {
  console.log('updateMemberCommentData', userProfile, commentText, candidateUserId);
  var memberCommentRef = database.ref("/members/" + candidateUserId + "/comments/" + userProfile.userId);
  let obj = {
    commentBy: {
      userId: userProfile.userId,
      displayName: userProfile.displayName
    },
    commentText: commentText,
    commentDate: Date.now()
  };
  console.log(obj);
  return memberCommentRef.update(obj)
    .catch((error) => { console.log('updateMemberCommentData Error', error + '') });;
}

function getUserInfo(userId) {
  return new Promise((resolve, reject) => {
    membersRef.orderByKey()
      .equalTo(userId)
      .once("value", (snapshot) => {
        snapshot.forEach(function (snap) {
          let profile = snap.val();
          resolve(profile);
        });
      }, (error) => {
        console.error(error + '');
        reject();
      });
  });
}

function getMemberRelation(userId) {
  return new Promise((resolve, reject) => {
    try {
      let lists = [];
      var memberRelationRef = database.ref("/members/" + userId + "/relations");
      memberRelationRef
        .orderByKey()
        .once("value", function (snapshot) {
          snapshot.forEach(function (snap) {
            var doc = snap.val();
            if (doc.userId !== userId && doc.relation === 'LOVE' && doc.status == 1) {
              lists.push(doc);
            }
          });
          resolve(lists);
        });
    } catch (e) {
      console.log(e);
      reject();
    }
  });
}

function createMatchedMessage(candidateName, candidateId) {
  return lineHelper.createConfirmMessage(`ว้าววว ยินดีด้วย [${candidateName}] ก็ถูกใจคุณเหมือนกัน\nคุณสามารถส่งข้อความไปถึง [${candidateName}] ได้เลย`, options.getMessageAction(candidateId));
}

function createProfileListMessage(altText, lists) {
  var columns = lists.map(element => {
    var title = (element.displayName || 'ไม่มีชื่อ') + ' [เพศ ' + element.gender + ' อายุ ' + element.age + ' ปี]'
    return lineHelper.createCarouselColumns(title, element.statusMessage || 'ไม่ระบุสถานะ', getProfileUrl(element.userId), element.userId, element.isFriend);
  });
  return lineHelper.createCarouselMessage(altText, columns)
}

function createProfileMessage(altText, profile, showOtherOptions) {
  var title = (profile.displayName || 'ไม่มีชื่อ') + ' [เพศ ' + profile.gender + ' อายุ ' + profile.age + ' ปี]'
  return lineHelper.createButtonMessageWithImage(title, profile.statusMessage || 'ไม่ระบุสถานะ', getProfileUrl(profile.userId), profile.userId, profile.isFriend, showOtherOptions);
}

function createImageCarouselMessage(altText, lists) {
  var columns = lists.map(element => {
    var title = (element.displayName || 'ไม่มีชื่อ');
    return lineHelper.createImageCarouselColumns(title, getProfileUrl(element.userId), element.userId);
  });
  return lineHelper.createImageCarouselMessage(altText, columns)
}

function downloadContent(messageId, downloadPath) {
  return line.getMessageContent(messageId)
    .then((stream) => new Promise((resolve, reject) => {
      const writable = fs.createWriteStream(downloadPath);
      stream.pipe(writable);
      stream.on('end', () => resolve(downloadPath));
      stream.on('error', reject);
    }));
}

function getTextMessage(message) {
  return new Promise((resolve, reject) => {
    resolve(lineHelper.createTextMessage(message.text));
  });
}

function getImageMessage(message) {
  return new Promise((resolve, reject) => {
    const downloadPath = path.join(__dirname, 'downloaded', `${message.id}.jpg`);
    const previewPath = path.join(__dirname, 'downloaded', `${message.id}-preview.jpg`);
    return downloadContent(message.id, downloadPath)
      .then((downloadPath) => {
        cp.execSync(`convert -resize 240x jpeg:${downloadPath} jpeg:${previewPath}`);
        resolve(lineHelper.createImageMessage(baseURL + '/downloaded/' + path.basename(downloadPath), baseURL + '/downloaded/' + path.basename(previewPath)));
      });
  });
}

function getMatchContentBubble(title, match) {
  let container = _.cloneDeep(options.matchContentBubble);
  container.body.contents = [
    {
      type: 'text',
      text: title,
      wrap: true,
      weight: 'bold',
      gravity: 'center',
      size: 'lg'
    },
    {
      type: 'text',
      text: `${match.match_hometeam_name} vs ${match.match_awayteam_name}`,
      wrap: true,
      weight: 'bold',
      gravity: 'center',
      size: 'md'
    },
    {
      type: 'box',
      layout: 'vertical',
      margin: 'lg',
      spacing: 'sm',
      contents: [
        {
          type: 'box',
          layout: 'baseline',
          spacing: 'sm',
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
              text: `${match.match_date}, ${match.match_time}`,
              wrap: true,
              size: 'sm',
              color: '#666666',
              flex: 4
            }
          ]
        }
      ]
    }
  ];
  return container;
}

function updateFixture() {
  Promise.all(config.apiFootball.leagues.map(leagueId => {
    return apifootball.getLeageData(leagueId);
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
        if (list.length > 0) resolve(list[0]);
        else reject('NO LAST MATCH');
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
          if (doc.match_status !== 'FT') {
            list.push(doc);
          }
        });
        list = list.sort(sortByMatchDateTime);
        if (list.length > 0) resolve(list[0]);
        else reject('NO MORE MATCH');
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
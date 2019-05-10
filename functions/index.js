const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()

exports.pushNewMessage = functions.firestore.document('/messages/{whatever1}/{whatever2}/{msgID}').onCreate(async (snap) => {
  let receiverId = snap.data().idTo
  let senderId = snap.data().idFrom
  let timestamp = snap.data().timestamp
  let msg = snap.data().content
  let type = snap.data().type
  let senderNickname

  let senderDoc = await db.collection('users').doc(senderId).get()
  if (!senderDoc.exists) return console.log('Unable to find sender!')
  senderNickname = senderDoc.data().nickname
  console.log('User to send notification:', senderNickname)

  let fcmToken = await db.collection('fcm_tokens').doc(receiverId).get()
  fcmToken = fcmToken.data().token
  const payload = {
    notification: {
      title: senderNickname,
      body: type === 1 ? '[Image]' : msg
    },
    data: {
      type: 'newMessage',
      timestamp: timestamp,
      senderId: senderId
    }
  }
  const options = { collapseKey: senderId }
  admin.messaging().sendToDevice(fcmToken, payload, options).then(function (response) {
    let totalCount = response.successCount + response.failureCount
    console.log(response.successCount + ' of ' + totalCount + ' newMessage notification(s) pushed successfully.')
  }).catch(function (error) {
    console.log('Error when sending newMessage notification:', error)
  })
})

exports.pushNewFriend = functions.firestore.document('/users/{initializer}/friends/{receiver}').onCreate(async (snap, context) => {
  let receiverId = snap.data().id
  let senderId = context.params.initializer

  console.log('User to send notification:', senderId)

  let fcmToken = await db.collection('fcm_tokens').doc(receiverId).get()
  fcmToken = fcmToken.data().token
  const payload = {
    data: {
      type: 'newFriend',
      friendId: senderId
    }
  }
  admin.messaging().sendToDevice(fcmToken, payload).then(function (response) {
    let totalCount = response.successCount + response.failureCount
    console.log(response.successCount + ' of ' + totalCount + ' newFriend notification(s) pushed successfully.')
  }).catch(function (error) {
    console.log('Error when sending newFriend notification:', error)
  })
})

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// https://itnext.io/f917a305d4e6
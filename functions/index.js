const functions = require('firebase-functions');
// const express = require('express');
const admin = require('firebase-admin')
admin.initializeApp();
const db = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// https://itnext.io/f917a305d4e6


exports.pushNewMessage = functions.firestore.document('/messages/{whatever1}/{whatever2}/{msgID}').onCreate(async (snap, context) => {
  let receiverId = snap.data().idTo;
  let senderId = snap.data().idFrom;
  let timestamp = snap.data().timestamp;
  let msg = snap.data().content;
  let type = snap.data().type;
  let senderNickname;

  let userDoc = await db.collection('users').doc(snap.data().idFrom).get();
  if (!userDoc.exists) {
    console.log('No such document!');
  } else {
    console.log('Document data:', userDoc.data());
    senderNickname = userDoc.data().nickname;
  }
  console.log('User to send notification', senderNickname);

  let fcmToken = await db.collection('fcm_tokens').doc(receiverId).get();
  fcmToken = fcmToken.data().token;
  const payload = {
    notification: {
      title: senderNickname,
      body: type === 1 ? "[Image]" : msg
    },
    data: {
      type: "newMessage",
      timestamp: timestamp,
      senderId: senderId
    }
  };
  admin.messaging().sendToDevice(fcmToken, payload).then(function (response) {
    console.log("Notification pushed successfully with response: " + response);
  });
})

exports.pushNewFriend = functions.firestore.document('/users/{initializer}/friends/{receiver}').onCreate(async (snap, context) => {
  let receiver = snap.data().id;
  let senderId = context.params.initializer;

  console.log('User to send notification', receiver, senderId);

  let fcmToken = await db.collection('fcm_tokens').doc(receiver).get();
  fcmToken = fcmToken.data().token;
  const payload = {
    data: {
      type: "newFriend",
      friendId: senderId
    }
  };
  admin.messaging().sendToDevice(fcmToken, payload).then(function (response) {
    console.log("Notification pushed successfully with response: " + response);
  });

})
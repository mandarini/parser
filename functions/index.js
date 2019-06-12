const functions = require("firebase-functions");

const admin = require("firebase-admin");

admin.initializeApp(functions.config().firebase);

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from Firebase!");
});

exports.scheduledFunction = functions.pubsub
  .schedule("every 2 minutes")
  .onRun(context => {
    console.log("This will be run every 5 minutes!");
  });

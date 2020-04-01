const functions = require('firebase-functions')
const admin = require('firebase-admin')

exports.createRoom = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The function must be called while authenticated.'
    )
  }
  const id = admin.firestore.Timestamp.now()
  const player = data.player
  const host = context.auth.uid
  const email = context.auth.token.email

  const batch = admin.firestore().batch()

  batch.set(admin
    .firestore()
    .collection('rooms')
    .doc(`${id}`), {
    player,
    host,
    draw: 0,
    hostEmail: email
  })
  batch.set(admin
    .firestore()
    .collection('rooms')
    .doc(`${id}`)
    .collection('users')
    .doc(`${host}`), {
    email: email,
    balance: 1000
  })
  batch.set(admin
    .firestore()
    .collection('rooms')
    .doc(`${id}`)
    .doc('result'), {
    draw: 0,
    status: 0,
    winner: ''
  })

  return batch.commit()
    .then((value) => {
      return value
    })
})

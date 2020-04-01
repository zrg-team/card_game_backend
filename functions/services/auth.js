const functions = require('firebase-functions')
const admin = require('firebase-admin')

exports.createUserForAuthentication = functions.auth
  .user()
  .onCreate((user) => {
    const email = user.email // The email of the user.
    const name = user.displayName // The display name of the user.
    const batch = admin.firestore().batch()
    try {
      const userRef = admin
        .firestore()
        .collection('users')
        .doc(`${user.uid}`)
      batch.set(userRef, {
        email,
        name,
        balance: 0
      })
      const historyRef = admin
        .firestore()
        .collection('history')
        .doc(`${user.uid}`)
      batch.set(historyRef, {
        created: 0
      })
      return batch.commit()
    } catch (err) {
    }
  })

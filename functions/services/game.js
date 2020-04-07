const functions = require('firebase-functions')
const admin = require('firebase-admin')

exports.createRoom = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The function must be called while authenticated.'
    )
  }
  const id = admin.firestore.Timestamp.now().toMillis()
  const player = data.player
  const uid = context.auth.uid
  const email = context.auth.token.email
  const names = email.split('@', 2)
  const title = `${names[0]}`

  const batch = admin.firestore().batch()

  batch.set(admin
    .firestore()
    .collection('rooms')
    .doc(`${id}`), {
    player,
    draw: 0,
    title,
    host: uid,
    hostEmail: email,
    players: [uid],
    createDate: id,
    result: {
      draw: 0,
      status: 0,
      winner: ''
    }
  })
  batch.set(admin
    .firestore()
    .collection('rooms')
    .doc(`${id}`)
    .collection('users')
    .doc(`${uid}`), {
    email: email,
    name: names[0],
    online: false,
    // not need get on frontend
    balance: 0
  })

  return batch.commit()
    .then((value) => {
      return value
    })
})

exports.joinRoom = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The function must be called while authenticated.'
    )
  }
  const roomId = data.id
  const playerId = context.auth.uid
  const playerEmail = context.auth.token.email
  const name = playerEmail.split('@', 2)[0]
  const timestamp = admin.firestore.Timestamp.now().toMillis()

  return admin.firestore()
    .collection('rooms')
    .doc(`${roomId}`)
    .get()
    .then(roomDoc => {
      const room = roomDoc.data()
      if (!room) {
        throw new Error('ROOM_NOT_EXIST')
      }
      const isJoined = room.players.includes(playerId)
      if (
        !isJoined &&
        room.players.length === room.player
      ) {
        throw new Error('ROOM_FULL')
      }

      const batch = admin.firestore().batch()
      if (!isJoined) {
        batch.update(admin
          .firestore()
          .collection('rooms')
          .doc(`${roomId}`), {
          players: [...room.players, playerId]
        })

        batch.set(admin
          .firestore()
          .collection('rooms')
          .doc(`${roomId}`)
          .collection('users')
          .doc(`${playerId}`), {
          email: playerEmail,
          name: name,
          online: true,
          onlineDate: timestamp,
          // not need get on frontend
          balance: 0
        })
      } else {
        batch.update(admin
          .firestore()
          .collection('rooms')
          .doc(`${roomId}`)
          .collection('users')
          .doc(`${playerId}`), {
          online: true,
          onlineDate: timestamp,
          // not need get on frontend
          balance: 0
        })
      }

      return batch.commit()
        .then((value) => {
          return value
        })
    })
})

const randomPosition = (number) => {
  const position = Math.floor(Math.random() * number) + 1;
  return position;
}

exports.randomAllCards = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The function must be called while authenticated.'
    )
  }

  const deckNames = ["unused",
    "sA", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10", "sJ", "sQ", "sK",
    "hA", "h2", "h3", "h4", "h5", "h6", "h7", "h8", "h9", "h10", "hJ", "hQ", "hK",
    "cA", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9", "c10", "cJ", "cQ", "cK",
    "dA", "d2", "d3", "d4", "d5", "d6", "d7", "d8", "d9", "d10", "dJ", "dQ", "dK",
  ];

  const result = [];

  for (let i = 52; i > 0; i--) {
    let position = randomPosition(i);
    console.log(position);
    result.push(deckNames[position]);
    deckNames.splice(position, 1);
  }

  res.json({result: result});
});

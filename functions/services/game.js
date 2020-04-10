const functions = require('firebase-functions')
const admin = require('firebase-admin')

const GAME_STATE = ["NOT_STARTED_YET", "WAITING_FOR_RANDOM", "PLAYING", "DONE"];

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
    readyPlayers: 0,
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
    "AS", "2S", "3S", "4S", "5S", "6S", "7S", "8S", "9S", "10S", "JS", "QS", "KS",
    "AH", "2H", "3H", "4H", "5H", "6H", "7H", "8H", "9H", "10H", "JH", "QH", "KH",
    "AC", "2C", "3C", "4C", "5C", "6C", "7C", "8C", "9C", "10C", "JC", "QC", "KC",
    "AD", "2D", "3D", "4D", "5D", "6D", "7D", "8D", "9D", "10D", "JD", "QD", "KD",
  ];

  const result = [];

  for (let i = 52; i > 0; i--) {
    let position = randomPosition(i);
    console.log(position);
    result.push(deckNames[position]);
    deckNames.splice(position, 1);
  }

  return result;
});


exports.readyToPlay = functions.https.onCall(async (data, context) => {
  console.log(data);
  console.log(context);
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The function must be called while authenticated.'
    )
  }

  const roomId = data.id
  const playerId = context.auth.uid

  const batch = admin.firestore().batch()

  return admin.firestore()
    .collection('rooms')
    .doc(`${roomId}`)
    .get()
    .then(roomDoc => {
      const room = roomDoc.data()
      if (!room) {
        throw new Error('ROOM_NOT_EXIST')
      }

      if (
        room.players.length >= 2 &&
        room.players.length === room.readyPlayers + 1
      ) {
        batch.update(admin
          .firestore()
          .collection('rooms')
          .doc(`${roomId}`), {
            ...room,
            result: {
              ...room.result,
              status: "WAITING_FOR_RANDOM"
            },
            readyPlayers: 0,
        })
        return batch.commit()
        .then((value) => {
          return value
        }) 
      }

      batch.update(admin
        .firestore()
        .collection('rooms')
        .doc(`${roomId}`), {
          ...room,
          readyPlayers: room.readyPlayers + 1
      })

      return batch.commit()
        .then((value) => {
          return value
        })
    });
});

exports.endGame = functions.https.onCall(async (data, context) => {
  console.log(data);
  console.log(context);
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The function must be called while authenticated.'
    )
  }

  const roomId = data.id

  const batch = admin.firestore().batch()

  return admin.firestore()
    .collection('rooms')
    .doc(`${roomId}`)
    .get()
    .then(roomDoc => {
      const room = roomDoc.data()
      if (!room) {
        throw new Error('ROOM_NOT_EXIST')
      }

      batch.update(admin
          .firestore()
          .collection('rooms')
          .doc(`${roomId}`), {
            ...room,
            result: {
              ...room.result,
              status: "DONE"
            },
        })
        return batch.commit()
        .then((value) => {
          return value
        })
    });
});
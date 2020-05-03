const functions = require('firebase-functions')
const admin = require('firebase-admin')
const ruleModule = require('./rules')
// import { calculateResult } from './rules'

// const GAME_STATE = ['NOT_STARTED_YET', 'WAITING_FOR_RANDOM', 'PLAYING', 'DONE']

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
    playerCount: player,
    draw: 0,
    title,
    host: uid,
    hostEmail: email,
    players: [],
    playerNames: [],
    createDate: id,
    readyPlayers: [],
    randomNumber: 0,
    result: {
      draw: 0,
      status: 0,
      winner: '',
      donePlayers: []
    }
  })
  // batch.set(admin
  //   .firestore()
  //   .collection('rooms')
  //   .doc(`${id}`)
  //   .collection('users')
  //   .doc(`${uid}`), {
  //   email: email,
  //   name: names[0],
  //   online: false,
  //   // not need get on frontend
  //   balance: 0,
  //   cards: []
  // })

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
      const readyPlayers = (room.readyPlayers || []).filter(item => item !== playerId)
      const donePlayers = room.result.donePlayers || []
      const isJoined = room.players.includes(playerId)
      if (
        !isJoined &&
        room.players.length === room.player
      ) {
        throw new Error('ROOM_FULL')
      }
      console.log('isJoined', isJoined)
      console.log('playersName', room.playerNames)
      const batch = admin.firestore().batch()
      if (!isJoined) {
        batch.update(admin
          .firestore()
          .collection('rooms')
          .doc(`${roomId}`), {
          players: [...room.players, playerId],
          playerNames: [...room.playerNames, name],
          readyPlayers: readyPlayers,
          result: {
            ...room.result,
            donePlayers: donePlayers.filter(item => item !== playerId)
          }
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
          balance: 0,
          cards: []
        })
      } else {
        batch.update(admin
          .firestore()
          .collection('rooms')
          .doc(`${roomId}`), {
          readyPlayers: readyPlayers,
          result: {
            ...room.result,
            donePlayers: donePlayers.filter(item => item !== playerId)
          }
        })
        batch.update(admin
          .firestore()
          .collection('rooms')
          .doc(`${roomId}`)
          .collection('users')
          .doc(`${playerId}`), {
          online: true,
          onlineDate: timestamp,
          // not need get on frontend
          balance: 0,
          cards: []
        })
      }

      return batch.commit()
        .then((value) => {
          return value
        })
    })
})

exports.exitRoom = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The function must be called while authenticated.'
    )
  }
  const roomId = data.id
  const playerId = context.auth.uid

  return admin.firestore()
    .collection('rooms')
    .doc(`${roomId}`)
    .get()
    .then(roomDoc => {
      const room = roomDoc.data()
      if (!room || !room.players.includes(playerId)) {
        throw new Error('ROOM_NOT_EXIST')
      }
      const playerIndex = room.players.findIndex(key => key === playerId)
      const readyPlayers = (room.readyPlayers || []).filter(item => item !== playerId)
      const donePlayers = room.result.donePlayers || []
      room.players.splice(playerIndex, 1)
      room.playerNames.splice(playerIndex, 1)
      console.log(room.players)
      console.log(room.playerNames)

      const batch = admin.firestore().batch()
      batch.delete(admin
        .firestore()
        .collection('rooms')
        .doc(`${roomId}`)
        .collection('users')
        .doc(playerId)
      )

      batch.update(admin
        .firestore()
        .collection('rooms')
        .doc(`${roomId}`), {
        readyPlayers: readyPlayers,
        players: room.players,
        playerNames: room.playerNames,
        result: {
          ...room.result,
          donePlayers: donePlayers.filter(item => item !== playerId)
        }
      })

      return batch.commit()
        .then((value) => {
          return value
        })
    })
})

const randomPosition = (number) => {
  const position = Math.floor(Math.random() * number) + 1
  return position
}

exports.randomAllCards = functions.https.onCall(async (data, context) => {
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

      if (room.randomNumber !== 0) {
        return
      }

      const numberPlayers = data.readyPlayers.length

      const deckNames = ['unused',
        'AS', '2S', '3S', '4S', '5S', '6S', '7S', '8S', '9S', 'XS', 'JS', 'QS', 'KS',
        'AH', '2H', '3H', '4H', '5H', '6H', '7H', '8H', '9H', 'XH', 'JH', 'QH', 'KH',
        'AC', '2C', '3C', '4C', '5C', '6C', '7C', '8C', '9C', 'XC', 'JC', 'QC', 'KC',
        'AD', '2D', '3D', '4D', '5D', '6D', '7D', '8D', '9D', 'XD', 'JD', 'QD', 'KD'
      ]

      const orderedCards = []

      for (let i = 52; i > 0; i--) {
        const position = randomPosition(i)
        orderedCards.push(deckNames[position])
        deckNames.splice(position, 1)
      }

      const random = Math.floor(Math.random() * 10) + 1 // to be different zero

      const orderedCardsWithRandom = [...orderedCards.splice(random), ...orderedCards]

      const playerCards = [[], [], [], []]
      for (let i = 0; i < numberPlayers; i++) {
        for (let j = i; j < 13 * numberPlayers; j = j + numberPlayers) {
          playerCards[i].push(orderedCardsWithRandom[j])
        }
      }

      for (let i = 0; i < room.players.length; i++) {
        batch.update(admin
          .firestore()
          .collection('rooms')
          .doc(`${roomId}`)
          .collection('users')
          .doc(`${room.players[i]}`), {
          cards: playerCards[i]
        })
      }

      batch.update(admin
        .firestore()
        .collection('rooms')
        .doc(`${roomId}`), {
        ...room,
        randomNumber: random,
        result: {
          ...room.result,
          status: 'PLAYING'
        }
      })

      return batch.commit()
        .then((value) => {
          return value
        })
    })
})

exports.readyToPlay = functions.https.onCall(async (data, context) => {
  console.log(data)
  console.log(context)
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

      const readyPlayers = room.readyPlayers || []
      let donePlayers = room.result.readyPlayers || []
      const playerId = context.auth.uid

      if (!readyPlayers.includes(playerId)) {
        readyPlayers.push(playerId)
      }
      donePlayers = donePlayers.filter(item => item !== playerId)

      if (
        room.players.length === 4 &&
        room.players.length === room.readyPlayers.length
      ) {
        batch.update(admin
          .firestore()
          .collection('rooms')
          .doc(`${roomId}`), {
          ...room,
          result: {
            ...room.result,
            donePlayers,
            status: 'WAITING_FOR_RANDOM'
          },
          readyPlayers: readyPlayers
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
        readyPlayers: readyPlayers
      })

      return batch.commit()
        .then((value) => {
          return value
        })
    })
})

const calculateAndSetScore = (cards, room, roomId) => {
  const userRes = ruleModule.calculateResult(cards)

  console.log('userRes', userRes)

  const batch = admin.firestore().batch()

  for (let i = 0; i < room.players.length; i++) {
    batch.update(admin
      .firestore()
      .collection('rooms')
      .doc(`${roomId}`)
      .collection('users')
      .doc(`${room.players[i]}`), {
      draw: userRes[i]
    })
  }

  console.log('calculating ?')

  return batch.commit()
    .then((value) => {
      return value
    })
}

exports.submitCards = functions.https.onCall(async (data, context) => {
  console.log(data)
  console.log(context)
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'The function must be called while authenticated.'
    )
  }

  const roomId = data.id
  const cards = data.cards
  const playerId = context.auth.uid

  const batch = admin.firestore().batch()

  return admin.firestore()
    .collection('rooms')
    .doc(`${roomId}`)
    .get()
    .then(async roomDoc => {
      const room = roomDoc.data()
      if (!room) {
        throw new Error('ROOM_NOT_EXIST')
      }

      batch.update(admin
        .firestore()
        .collection('rooms')
        .doc(`${roomId}`)
        .collection('users')
        .doc(`${playerId}`), {
        cards
      })

      const donePlayers = room.result.donePlayers || []
      // let readyPlayers = [...room.readyPlayers] || []

      if (!donePlayers.includes(playerId)) {
        donePlayers.push(playerId)
        // readyPlayers = readyPlayers.filter(item => item !== playerId)
      }
      if (donePlayers.length === room.readyPlayers.length) {
        const userCards = []
        for (let i = 0; i < room.players.length; i++) {
          await admin.firestore()
            .collection('rooms')
            .doc(`${roomId}`)
            .collection('users')
            .doc(room.players[i])
            .get()
            .then(res => {
              const card =  res.data().cards
              userCards.push(card)
            })
        }
        calculateAndSetScore(userCards, room, roomId)
        // end game
        batch.update(admin
          .firestore()
          .collection('rooms')
          .doc(`${roomId}`), {
          ...room,
          randomNumber: 0,
          result: {
            ...room.result,
            donePlayers: [],
            status: 'DONE'
          },
          readyPlayers: []
        })
      } else {
        batch.update(admin
          .firestore()
          .collection('rooms')
          .doc(`${roomId}`), {
          ...room,
          result: {
            ...room.result,
            donePlayers: donePlayers,
            status: 'WAITING_FOR_RESULT'
          }
        })
      }

      return batch.commit()
        .then((value) => {
          return value
        })
    })
})

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

const randomPosition = (number) => {
  const position = Math.floor(Math.random() * number) + 1;
  return position;
}

exports.randomAllCards = functions.https.onRequest(async (req, res) => {
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
var { sortBy } = require('lodash');

const convertToNumber = (string) => {
  switch (string) {
    case "2":
      return 2;
    case "3":
      return 3;
    case "4":
      return 4;
    case "5":
      return 5;
    case "6":
      return 6;
    case "7":
      return 7;
    case "8":
      return 8;
    case "9":
      return 9;
    case "X":
      return 10;  
    case "J":
      return 11;
    case "Q":
      return 12;
    case "K":
      return 13;
    case "A":
      return 14;
    default:
      return 0;
  }
}

const rankHand = cards => {
  let result = [];

  // split card to rank
  for (let card of cards) {
      let r = convertToNumber(card[0]);
      result[r] = result[r] || [];
      result[r].push(card);
  }

  // sort high to low
  result = result.filter((rank) => !!rank).reverse();

  // FIX ME: will use this when upgrade node to v11 dueto sort of v8 is not stable
  // const result1 = result.sort((a, b) => {
  //   return a.length > b.length ? -1 : a.length < b.length ? 1 : 0;
  // });

  // pairs and sets first
  result = sortBy(result, function(item){
    return -item.length
  });

  return result;
}

// get value of one hand (back, mid or front)
const value = (ranked, primary) => {
  let str = '';

  for (let rank of ranked) {
      let r = convertToNumber(rank[0][0]);
      let v = (r < 10 ? '0' : '') + r;
      for (let i = 0; i < rank.length; i++) {
          // append value for each card
          str += v;
      }
  }

  return (primary * 10000000000) + parseInt(str);
}


// have no flush
const isHaveNoFlush = cards => {
  let SCount = 0;
  let HCount = 0;
  let DCount = 0;
  let CCount = 0;

  for (let card of cards) {
      if (card[1] === 'H')
        HCount ++;
      if (card[1] === 'S')
        SCount ++;
      if (card[1] === 'D')
        DCount ++;
      if (card[1] === 'C')
        CCount ++;

      if (HCount === 5 || SCount === 5 || DCount === 5 || CCount === 5) {
        return false
      }
  }

  return true;
}

// flush
const isFlushCards = cards => {
  // all suits match is flush
  let suit = cards[0][1];

  for (let card of cards) {
      if (card[1] != suit)
          return false;
  }

  return true;
}

// flush
const isSubFlushCards = cards => {
  // all suits match is flush
  let suit = cards[0][1];

  for (let card of cards) {
      if (card[1] != suit)
          return false;
  }

  return true;
}

// 13 cards with same color (one case of maubinh)
const is13SameColor = cards => {
  // all suits match is flush
  let suit = cards[0][1];
  let count = 0;

  if (suit === 'H' || suit === 'D') {
    for (let card of cards) {
        if (card[1] !== 'H' && card[1] !== 'D') {
          count++
          if (count > 0)
          return false;
        }
    }
  } else {
    for (let card of cards) {
      if (card[1] !== 'C' && card[1] !== 'S') {
        count++
        if (count > 0)
        return false;
      }
  }
  }

  return true;
}

// 12 cards with same color (one case of maubinh)
const is12SameColor = cards => {
  // all suits match is flush
  let suit = cards[0][1];
  let count = 0;

  if (suit === 'H' || suit === 'D') {
    for (let card of cards) {
        if (card[1] !== 'H' && card[1] !== 'D') {
          count++
          if (count > 1)
          return false;
        }
    }
  } else {
    for (let card of cards) {
      if (card[1] !== 'C' && card[1] !== 'S') {
        count++
        if (count > 1)
        return false;
      }
    }
  }

  return true;
}

// straight
const isStraightCards = ranked => {
    // must have 5 different ranks
    if (!ranked[4])
        return false;

    // could be wheel if r0 is 'ace' and r4 is '2'
    if (ranked[0][0][0] === 'A' && ranked[1] && ranked[1][0][0] == '5' && ranked[4] && ranked[4][0] &&ranked[4][0][0] == '2') {
        return true;
    }

    // run of five in row is straight
    const r0 = convertToNumber(ranked[0][0][0]);
    const r4 = convertToNumber(ranked[4] && ranked[4][0] && ranked[4][0][0]);

    return (r0 - r4) === 4;
}

// is substraight, support for front
const isSubStraight = ranked => {
  if (!ranked[2])
    return false;

  // could be wheel if r0 is 'ace' and r4 is '2'
  if (ranked[0][0][0] === 'A' && ranked[1] && ranked[1][0] && ranked[1][0][0] == '3' && ranked[2] && ranked[2][0] && ranked[2][0][0] == '2') {
    return true;
  }

  // run of five in row is straight
  const r0 = convertToNumber(ranked[0][0][0]);
  const r2 = convertToNumber(ranked[2] && ranked[2][0] && ranked[2][0][0]);

  return (r0 - r2) === 2;
}

// isHaveNoStraight
const isHaveNoStraight = hand => {
  let ranked = [];

  // split card to rank
  for (let card of hand) {
      let r = convertToNumber(card[0]);
      ranked[r] = ranked[r] || [];
      ranked[r].push(card);
  }

  // sort high to low
  ranked = ranked.filter((rank) => !!rank).reverse();

  // case ACE, X, X, X, X, X, X, 5, 4, 3, 2
  if (ranked[0][0][0] === 'A' && ranked[7] 
      && ranked[7][0][0] === '5' && ranked[8] 
      && ranked[8][0][0] === '4' && ranked[9] 
      && ranked[9][0][0] === '3' && 
      ranked[10] && ranked[10][0][0] === '2'
      ) {
    return false
  }

  let count = 0;

  for (let i = 0; i < ranked.length -1; i++) {
    if (convertToNumber(ranked[i][0][0]) - convertToNumber(ranked[i+1][0][0]) === 1) {
      count ++;
    } else {
      count = 0;
    }
    console.log(count)
    if (count === 5) return false;
  }

  return true
}

const calculate = hand => {
  const ranked = rankHand(hand);

  const isFlush = isFlushCards(hand);
  const isStraight = isStraightCards(ranked);
  console.log('calculate', ranked, isFlush, isStraight)
  if (hand.length === 5 && isStraight && isFlush && ranked[0][0][0] === 'A' && ranked[4] && ranked[4][0] && ranked[4][0][0] === 'X')
    return {
      handType: 13,
      handName: 'thung_pha_sanh_10_A',
      handRank: 14,
      value: value(ranked, 13)
    }

  else if (hand.length === 5 && isStraight && isFlush && ranked[0][0][0] === 'A' && ranked[4] && ranked[4][0] && ranked[4][0][0] === '2' && hand.length > 5)
    return {
      handType: 12,
      handName: 'thung_pha_sanh_A_5',
      handRank: 14,
      value: value(ranked, 12)
    }
  
  else if (hand.length === 5 && isStraight && isFlush && ranked[0][0][0] !== 'A')
    return {
      handType: 11,
      handName: 'thung_pha_sanh',
      handRank: convertToNumber(ranked[0][0][0]),
      value: value(ranked, 11)
    }

  else if (hand.length === 5 && ranked[0].length === 4)
    return {
      handType: 10,
      handName: 'tu_quy',
      handRank: convertToNumber(ranked[0][0][0]),
      value: value(ranked, 10)
    }

  else if (hand.length === 5 && ranked[0].length === 3 && ranked[1] && ranked[1].length === 2)
    return {
      handType: 9,
      handName: 'cu_lu',
      handRank: 1,
      value: value(ranked, 9)
    }

  else if (hand.length === 5 && isFlush)
    return {
      handType: 8,
      handName: 'thung',
      handRank: 1,
      value: value(ranked, 8)
    }

  else if (hand.length === 5 && isStraight && ranked[0][0][0] === 'A' && ranked[4] && ranked[4][0] && ranked[4][0][0] === 'X')
    return {
      handType: 7,
      handName: 'sanh_10_A',
      handRank: 1,
      value: value(ranked, 7)
    }

  else if (hand.length === 5 && isStraight && ranked[0][0][0] === 'A' && ranked[4] && ranked[4][0] && ranked[4][0][0] === '2')
    return {
      handType: 6,
      handName: 'sanh_A_5',
      handRank: 1,
      value: value(ranked, 6)
    }

  else if (hand.length === 5 && isStraight && ranked[0][0][0] !== 'A')
    return {
      handType: 5,
      handName: 'sanh',
      handRank: 1,
      value: value(ranked, 5)
    }

  else if (ranked[0].length === 3)
    return {
      handType: 4,
      handName: 'xam_chi',
      handRank: 1,
      value: value(ranked, 4)
    }

  else if (hand.length === 5 && ranked[0].length === 2 && ranked[1].length === 2)
    return {
      handType: 3,
      handName: 'hai_doi',
      handRank: 1,
      value: value(ranked, 3)
    }

  else if (ranked[0].length === 2)
    return {
      handType: 2,
      handName: 'mot_doi',
      handRank: 1,
      value: value(ranked, 2)
    }
  else
    return {
      handType: 1,
      handName: 'roi_rac',
      handRank: 1,
      value: value(ranked, 1)
    }
}

const evalFront = (hand1, hand2) => {
  if (!Array.isArray(hand1) || !Array.isArray(hand2)) {
      throw new Error('hand not an array')
  }

  if (hand1.length !== 3 || hand2.length !== 3) {
      throw new Error('hand must have three cards')
  }

  const res1 = calculate(hand1)

  const res2 = calculate(hand2)

  if (res1.handName === 'xam_chi' && res2.handName !== 'xam_chi')
    return Number(hand1[0][0])

  if (res1.handName !== 'xam_chi' && res2.handName === 'xam_chi')
    return -Number(hand1[0][0])

  if (res1.handType > res2.handType) return res1.handRank;

  if (res1.handType < res2.handType) return -res2.handRank;

  if (res1.handType === res2.handType && res1.value > res2.value) return res1.handRank;;

  if (res1.handType === res2.handType && res1.value < res2.value) return -res2.handRank;;

  return 0
}

const evalMid = (hand1, hand2) => {
  if (!Array.isArray(hand1) || !Array.isArray(hand2)) {
    throw new Error('hand not an array')
  }

  if (hand1.length !== 5 || hand2.length !== 5) {
    throw new Error('hand must have five cards')
  }

  const res1 = calculate(hand1)

  const res2 = calculate(hand2)

  if (res1.handName === 'cu_lu' && res2.handName !== 'cu_lu')
    return 2

  if (res1.handName !== 'cu_lu' && res2.handName === 'cu_lu')
    return -2

  if (res1.handType > res2.handType) return res1.handRank;

  if (res1.handType < res2.handType) return -res2.handRank;

  if (res1.handType === res2.handType && res1.value > res2.value) return res1.handRank;

  if (res1.handType === res2.handType && res1.value < res2.value) return -res2.handRank;

  return 0
}

const evalBack = (hand1, hand2) => {
  if (!Array.isArray(hand1) || !Array.isArray(hand2)) {
    throw new Error('hand not an array')
  }

  if (hand1.length !== 5 || hand2.length !== 5) {
      throw new Error('hand must have five cards')
  }

  const res1 = calculate(hand1)

  const res2 = calculate(hand2)

  if (res1.handType > res2.handType) return res1.handRank;

  if (res1.handType < res2.handType) return -res2.handRank;

  if (res1.handType === res2.handType && res1.value > res2.value) return res1.handRank;

  if (res1.handType === res2.handType && res1.value < res2.value) return -res2.handRank;

  return 0
}

const superWin = hand => {
  const front = hand.slice(0,3)
  const mid = hand.slice(3,8)
  const back = hand.slice(8,13)

  const ranked = rankHand(hand);
  console.log('superWin', ranked);

  if (ranked[0][0][0] === 'A' && ranked[12] && ranked[12][0] && ranked[12][0][0] === '2')
    return {
      handType: 1,
      handName: 'sanh_rong',
      handRank: 36
    }
  
  else if (is13SameColor(hand))
    return {
      handType: 8,
      handName: '13_la_cung_mau',
      handRank: 26
    }

  else if (ranked[0].length === 3 && ranked.length === 11 && isHaveNoFlush(hand) && isHaveNoStraight(hand))
    return {
      handType: 7,
      handName: 'chi_mot_xam_chi',
      handRank: 22
    }
  
  else if (ranked[0].length === 2 && ranked[1].length === 2 && ranked.length === 11 && isHaveNoFlush(hand) && isHaveNoStraight(hand))
    return {
      handType: 6,
      handName: 'chi_co_2_doi',
      handRank: 16
    }

  else if (is12SameColor(hand))
    return {
      handType: 5,
      handName: '12_la_cung_mau',
      handRank: 12
    }
      
  else if (ranked[0].length === 3 && ranked[1].length === 2 && ranked[2].length === 2 && ranked[3].length === 2 && ranked[4].length === 2 && ranked[5].length === 2)
    return {
      handType: 4,
      handName: '5_doi_va_1_xam_chi',
      handRank: 9
    }   
  
  else if (ranked[0].length === 2 && ranked[1].length === 2 && ranked[2].length === 2 && ranked[3].length === 2 && ranked[4].length === 2 && ranked[5].length === 2)
    return {
      handType: 3,
      handName: 'sau_doi',
      handRank: 6
    }     
  
  else if (isFlushCards(back) && isFlushCards(mid) && isSubFlushCards(front))
    return {
      handType: 2,
      handName: '3_chi_thung',
      handRank: 6
    }    
  
  else if (isStraightCards(rankHand(back)) && isStraightCards(rankHand(mid)) && isSubStraight(rankHand(front)))
    return {
      handType: 1,
      handName: '3_chi_sanh',
      handRank: 6
    }
  return {
    handType: 0,
    handName: 'nothing',
    handRank: 0
  }
}

const countACE = hand => {
  count = -1;

  for (let card of hand) {
    if (card[0] === 'A') {
      count++;
    }
  }

  return 4 * count
}

const isFoul = (back, mid, front) => {
  console.log('isFoul', back, mid, front)
  const resBack = calculate(back)
  const resMid = calculate(mid)
  const resFront = calculate(front)
  console.log('isFoul', resBack)
  console.log('isFoul', resMid)
  console.log('isFoul', resFront)
  if (resFront.handType > resMid.handType || resFront.handType > resBack.handType)
    return true;

  if (resFront.handType === resMid.handType && resFront.handRank > resMid.handRank) 
    return true

  if (resFront.handType === resBack.handType && resFront.handRank > resBack.handRank) 
    return true

  if (resMid.handType > resBack.handType)
    return true;

  if (resMid.handType === resBack.handType && resMid.handRank > resBack.handRank)
    return true;

  return false;
}

const compare = (hand1, hand2) => {
  console.log('compare', hand1)
  console.log('compare', hand2)
  const res1 = superWin(hand1)
  const res2 = superWin(hand2)

  let result = {
    isMaubinh: false,
    maubinh: 0,
    front: 0,
    mid: 0,
    back: 0,
    foul: 0,
  }
  console.log('compare', res1);
  console.log('compare', res2);

  if (res1.handType > 0 && res2.handType > 0) return {...result, isMaubinh: true, maubinh: 0}

  if (res1.handType > 0 && res2.handType === 0) return {...result, isMaubinh: true, maubinh: res1.handRank}

  if (res1.handType === 0 && res2.handType > 0) return {...result, isMaubinh: false, maubinh: -res2.handRank}

  const front1 = hand1.slice(0,3)
  const front2 = hand2.slice(0,3)

  const mid1 = hand1.slice(3,8)
  const mid2 = hand2.slice(3,8)

  const back1 = hand1.slice(8,13)
  const back2 = hand2.slice(8,13)

  // TODO: check if binh lung
  // if (isFoul(back1, mid1, front1) && res1.handType === 0)
  //   return {...result, foul: -30}
  
  // if (isFoul(back2, mid2, front2) && res2.handType === 0)
  //   return {...result, foul: +30}

  const resBack = evalBack(back1, back2)

  const resMid = evalMid(mid1, mid2)

  const resFront = evalFront(front1, front2)

  console.log('compare 3 chi back, mid, front', resBack, resMid, resFront)

  if (resBack < 0 && resMid < 0 && resFront < 0) {
    console.log('thua ca 3 chi')
    return {
      ...result,
      front: resFront * 2,
      mid: resMid * 2,
      back: resBack * 2,
    }
  }

  if (resBack > 0 && resMid > 0 && resFront > 0) {
    console.log('thang ca 3 chi')
    return {
      ...result,
      front: resFront * 2,
      mid: resMid * 2,
      back: resBack * 2,
    }
  }

  return {
    ...result,
    front: resFront,
    mid: resMid,
    back: resBack,
  }
}

exports.calculateResult = (userCards) => {
  const length = userCards.length;
  const userRes = [];
  console.log('calculateResult', userCards, length);

  for (let i = 0; i < length; i++) {
    for (let j = 0; j < length; j++) {
      if (j === i) continue

      const res = compare(userCards[i], userCards[j]);
      console.log('calculateResult', i, j, res)
      
      if (!userRes[i]) {
        userRes[i] = res;
        continue
      }

      userRes[i] = {
        isMaubinh: res.isMaubinh,
        maubinh: userRes[i].maubinh + res.maubinh,
        front: userRes[i].front + res.front,
        mid: userRes[i].mid + res.mid,
        back: userRes[i].back + res.back,
        foul: userRes[i].foul + res.foul,
      }
    }

    const winACE = countACE(userCards[i]);
    userRes[i].winACE = winACE
  }
  console.log(userRes)
  return userRes;
}

// calculateResult([
//   ['AC','5C','5D','XC','XH','3S','KC','3C','9D','QC','QS','JS','JS'],
//   ['7C','9H','4C','JD','7S','7D','6C','8C','XD','8S','4D','8D','6D'],
//   ['4H','4S','5S','6H','7H','8H','KS','KD','9C','2S','3H','AS','JC'],
//   ['AH','AD','KH','2H','2D','2C','QH','QD','6S','9S','5H','3D','XS']]);


// calculateResult([["JH", "JD", "3D", "QH", "QC", "9S", "9C", "3H", "2S", "3C", "4D", "5C", "6H"],
// ["JS", "7H", "7D", "KH", "KS", "4S", "4C", "XH", "AC", "AH", "6D", "6S", "5S"],
// ["AD", "AS", "9H", "8S", "8H", "XC", "XD", "5H", "2H", "2D", "6C", "KC", "KD"],
// ["XS", "QS", "QD", "8C", "8D", "7C", "7S", "3S", "4H", "JC", "5D", "2C", "9D"]])

// ["5S", "5D", "5C", "JC", "4H", "4D", "4C", "9C", "XH", "XD", "2S", "7C", "QH"]
// ["5S", "5D", "5C", "JC", "4H", "4D", "4C", "9C", "XH", "XD", "2S", "7C", "QH"]
// 1: (13) ["KD", "KH", "6C", "QS", "QD", "2D", "2H", "2C", "KC", "8C", "8D", "AS", "5H"]
// 2: (13) ["4S", "KS", "6D", "7H", "7D", "3C", "JD", "3D", "9D", "9S", "9H", "8S", "8H"]
// 3: (13) ["QC", "JH", "XC", "JS", "3S", "6S", "7S", "XS", "AD", "AC", "AH", "3H", "6H"]

// ["XD", "4C", "7C", "8C", "QD", "JC", "9D", "4S", "2H", "QC", "5C", "8D", "3S"]
// 1: (13) ["7S", "7D", "4H", "AH", "AC", "XS", "6S", "8S", "XH", "9C", "AS", "9H", "KD"]
// 2: (13) ["5H", "3H", "3C", "6H", "6D", "JH", "2C", "2S", "KS", "KC", "QH", "QS", "AD"]
// 3: (13) ["KH", "JD", "5S", "8H", "JS", "XC", "9S", "7H", "2D", "4D", "3D", "5D", "6C"]
// expect to equal
calculateResult([["KS","KD","9D","3H","8H","KS","KD","9D","3H","8H","9D","3H","8H"],["KS","KD","9D","3H","8H","KS","KD","9D","3H","8H","9D","3H","8H"]]);

// expect: user 1 is sanh rong
calculateResult([["AS","KD","QS","JH","XH","9S","8D","7D","6H","5H","4D","3H","2H"],
["KS","KD","9D","3H","8H","KS","KD","9D","3H","8H","9D","3H","8H"],
["KS","KD","9D","3H","8H","KS","KD","9D","3H","8H","9D","3H","8H"],
["KS","KD","9D","3H","8H","KS","KD","9D","3H","8H","9D","3H","8H"]]);

// expect: 12 la cung mau
calculateResult([["AS","AS","QS","JC","9S","8S","8C","7S","6S","5C","4S","3S","2S"],
["KS","KD","9D","3H","8H","KS","KD","9D","3H","8H","9D","3H","8H"]]);

// expect: chi co 1 xam chi
calculateResult([["AS","AH","AD","JC","9S","8S","8C","7S","6S","5C","4S","3S","2S"],
["KS","KD","9D","3H","8H","KS","KD","9D","3H","8H","9D","3H","8H"]]);

// expect chi co 2 doi
calculateResult([["AS","AH","JD","JC","9S","8S","XC","7S","6S","5C","4S","3S","2S"],
["KS","KD","9D","3H","8H","KS","KD","9D","3H","8H","9D","3H","8H"]]);
calculateResult([[ 'JC',
  '2S',
  'XH',
  '7C',
  '4S',
  '6D',
  'JD',
  'AS',
  'QS',
  '9D',
  '3H',
  '7D',
  'KH' ],['9S',
'2S',
'KS',
'7D',
'2D',
'4C',
'9H',
'5D',
'9C',
'XD',
'3D',
'JS',
'QS']]);


// expect 12 la cung mau
calculateResult([["AS","AC","JC","XC","9H","8S","KS","7S","6S","5C","4S","3S","2S"],
["KS","KD","9D","3H","8H","KS","KD","9D","3H","8H","9D","3H","8H"]]);

// expect 5 doi va 1 xam chi
calculateResult([["AS","AC","JC","JC","9H","9S","7D","7D","6S","6C","4S","4S","4S"],
["KS","KD","9D","3H","8H","KS","KD","9D","3H","8H","9D","3H","8H"]]);

// expect 6 doi
calculateResult([["AS","AC","JC","JC","9H","9S","7D","7D","6S","6C","4S","4S","3S"],
["KS","KD","9D","3H","8H","KS","KD","9D","3H","8H","9D","3H","8H"]]);

// expect 3 chi deu la thung
calculateResult([["AH","KH","JH","JH","9H","9C","7C","7C","6C","6C","4S","4S","3S"],
["KS","KD","9D","3H","8H","KS","KD","9D","3H","8H","9D","3H","8H"]]);

// expect 3 chi sanh
calculateResult([["AH","KS","JH","QH","XH","XC","9C","JC","8C","QC","3S","2H","AS"],
["KS","KD","9D","3H","8H","KS","KD","9D","3H","8H","9D","3H","8H"]]);

// expect chi co 1 chi va co sanh
calculateResult([['JC','3D','QD','7H','5H','6H','9H','AH','8C','8H','8D','KD','10C'],['XC','KC','QH','XS','2S','4D','3S','5S','XH','AD','AD','6D','8C']]);

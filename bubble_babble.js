
var map_index = function(memo, letter, index) {
  memo[letter] = index;
  return memo;
};

var vowels = 'aeiouy';
var vowel_map = vowels.split('').reduce(map_index, {});

var consonants = 'bcdfghklmnprstvzx';
var consonant_map = consonants.split('').reduce(map_index, {});

var tuple_re = new RegExp('([' + vowels + '][' + consonants + '][' + vowels + '][' + consonants + ']-[' + consonants + '])', 'g');

var encrypt = function(input, encoding) {

  if (typeof input === 'string') {

    // encoding defaults to 'utf8' if left undefined
    input = new Buffer(input, encoding);
  }

  var result = 'x',
      seed = 1,
      reached_end = false,
      len = input.length,
      i = 0,
      byte1, byte2,
      a, b, c, d, e;

  while (!reached_end) {
    if (i >= len) {
      a = Math.floor(seed % 6);
      b = 16 ;
      c = Math.floor(seed / 6);
      reached_end = true;
    } else {
      byte1 = input.readInt8(i);
      a = (((byte1 >> 6) & 3) + seed) % 6;
      b = (byte1 >> 2) & 15;
      c = ((byte1 & 3) + Math.floor(seed / 6)) % 6;
    }

    if (i + 1 >= len) {
      reached_end = true;
    } else {
      byte2 = input.readInt8(i + 1);
      d = (byte2 >> 4) & 15;
      e = byte2 & 15;
    }
    seed = ((seed * 5) + (byte1 * 7) + byte2) % 36;

    result += vowels.charAt(a) + consonants.charAt(b) + vowels.charAt(c);

    if (!reached_end) {
      result += consonants.charAt(d) + '-' + consonants.charAt(e);
    }

    i += 2;
  }

  result += 'x';
  return result;
};

var decrypt = function(input) {
  var tuples = input.match(tuple_re),
      len = tuples.length,
      char_codes = new Buffer(len * 2),
      seed = 1,
      byte1, byte2,
      a_bits, b_bits,
      c_bits, d_bits,
      e_bits, i,
      tuple;

  for (i = 0; i < len; ++i) {
    tuple = tuples[i];

    a_bits = (Math.max(vowel_map[tuple.charAt(0)] - seed, 0) & 3) << 6;
    b_bits = ((consonant_map[tuple.charAt(1)] & 15)) << 2;
    c_bits = Math.max(vowel_map[tuple.charAt(2)] - Math.floor(seed / 6), 0) & 3;

    if ((a_bits - seed) % 6 >= 4 ||
        (c_bits - seed) % 6 >= 4) {
      return null;
    }

    d_bits = (consonant_map[tuple.charAt(3)] & 15) << 4;
    e_bits = consonant_map[tuple.charAt(5)] & 15;

    byte1 = a_bits | b_bits | c_bits;
    byte2 = d_bits | e_bits;

    seed = ((seed * 5) + (byte1 * 7) + byte2) % 36;
    char_codes[i * 2] = byte1;
    char_codes[(i * 2) + 1] = byte2;
  }

  return char_codes;
};

var input = 'xesef-disof-gytuf-katof-movif-baxux';

console.log(decrypt(input).toString());

console.log(encrypt(new Buffer('1234567890')));
console.log(encrypt('1234567890', 'utf8'));

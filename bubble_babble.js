
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

  if (!Buffer.isBuffer(input)) {
    input = new Buffer(input, encoding);
  }

  var result = 'x',
      checksum = 1,
      len = input.length,
      byte1, byte2,
      d, e, i;

  // create full tuples
  for (i = 0; i + 1 < len; i += 2) {
    byte1 = input.readInt8(i);
    result += odd_partial(byte1, checksum);

    byte2 = input.readInt8(i + 1);
    d = (byte2 >> 4) & 15;
    e = byte2 & 15;

    result += consonants.charAt(d) + '-' + consonants.charAt(e);

    checksum = next_checksum(checksum, byte1, byte2);
  }

  // handle partial tuple
  if (i < len) {
    byte1 = input.readInt8(i);
    result += odd_partial(byte1, checksum);
  } else {
    result += even_partial(checksum);
  }

  result += 'x';
  return result;
};

var odd_partial = function(raw_byte, checksum) {
  var a = (((raw_byte >> 6) & 3) + checksum) % 6,
      b = (raw_byte >> 2) & 15,
      c = ((raw_byte & 3) + Math.floor(checksum / 6)) % 6;

  return vowels.charAt(a) + consonants.charAt(b) + vowels.charAt(c);
}

var even_partial = function(checksum) {
  var a = checksum % 6,
      b = 16,
      c = Math.floor(checksum / 6);

  return vowels.charAt(a) + consonants.charAt(b) + vowels.charAt(c);
};

var decrypt = function(input) {
  var tuples = input.match(tuple_re),
      len = tuples ? tuples.length : 0,
      char_codes = new Buffer(len * 2),
      checksum = 1,
      byte1, byte2,
      a_bits, b_bits,
      c_bits, d_bits,
      e_bits, i,
      tuple;

  for (i = 0; i < len; ++i) {
    tuple = tuples[i];

    a_bits = (Math.max(vowel_map[tuple.charAt(0)] - checksum, 0) & 3) << 6;
    b_bits = ((consonant_map[tuple.charAt(1)] & 15)) << 2;
    c_bits = Math.max(vowel_map[tuple.charAt(2)] - Math.floor(checksum / 6), 0) & 3;

    if (mod(a_bits - checksum, 6) >= 4 ||
        mod(c_bits - checksum, 6) >= 4) {
      return null;
    }

    d_bits = (consonant_map[tuple.charAt(3)] & 15) << 4;
    e_bits = consonant_map[tuple.charAt(5)] & 15;

    byte1 = a_bits | b_bits | c_bits;
    byte2 = d_bits | e_bits;

    checksum = next_checksum(checksum, byte1, byte2);
    char_codes[i * 2] = byte1;
    char_codes[(i * 2) + 1] = byte2;
  }

  return char_codes;
};

var next_checksum = function(checksum, byte1, byte2) {
  return ((checksum * 5) + (byte1 * 7) + byte2) % 36;
}

var mod = function(n, m) {
  return ((m % n) + n) % n;
}

var input = 'xesef-disof-gytuf-katof-movif-baxux';

var decrypted = decrypt(input);

if (decrypted) {
  console.log(decrypted.toString());
} else {
  console.log('Corrupted bubble babble');
}

console.log(encrypt(new Buffer('1234567890')));
console.log(encrypt('Pineapple', 'utf8'));
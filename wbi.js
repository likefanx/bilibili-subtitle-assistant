/**
 * WBI 签名算法 — JavaScript 移植
 * 源自 batch_bilibili_subtitles.py 的 WBI 逻辑
 */

// B站 WBI Mixin Key 置换表 (64位)
var BILIBILI_MIXIN_KEY_ENC_TAB = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35,
  27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13,
  37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4,
  22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52
];

/**
 * 从 img_key + sub_key 计算 mixin_key
 * @param {string} imgKey - img URL 的文件名(无扩展名)
 * @param {string} subKey - sub URL 的文件名(无扩展名)
 * @returns {string} 32位 mixin key
 */
function getMixinKey(imgKey, subKey) {
  var raw = imgKey + subKey;
  var result = '';
  for (var i = 0; i < BILIBILI_MIXIN_KEY_ENC_TAB.length; i++) {
    if (BILIBILI_MIXIN_KEY_ENC_TAB[i] < raw.length) {
      result += raw.charAt(BILIBILI_MIXIN_KEY_ENC_TAB[i]);
    }
  }
  return result;
}

/**
 * 轻量 MD5 实现 (用于 WBI 签名，Web Crypto 不支持 MD5)
 * https://github.com/blueimp/JavaScript-MD5
 */
function md5(str) {
  function rotateLeft(n, s) { return (n << s) | (n >>> (32 - s)); }
  function addUnsigned(x, y) {
    var lsw = (x & 0xffff) + (y & 0xffff);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function md5Raw(x, y) { return (x & 0x7fffffff) | (y & 0x80000000); }
  function md5ExclusiveOr(x, y, z) { return (x ^ y ^ z); }
  function md5AndNot(x, y, z) { return (x & y) | ((~x) & z); }
  function md5OrNot(x, y, z) { return (x & z) | (y & (~z)); }
  function md5AndNot2(x, y, z) { return (x ^ y) | (y ^ z); }

  function md5Transform(f, a, b, c, d, x, s, t) {
    return rotateLeft(addUnsigned(addUnsigned(a, f(b, c, d)), addUnsigned(x, t)), s) + b;
  }

  var FF = md5AndNot;
  var GG = md5OrNot;
  var HH = md5ExclusiveOr;
  var II = md5AndNot2;

  var S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  var T = [];
  for (var i = 0; i < 64; i++) {
    T[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000);
  }

  var msgBytes = [];
  for (var i = 0; i < str.length; i++) {
    msgBytes.push(str.charCodeAt(i) & 0xff);
  }

  var msgLen = msgBytes.length;
  msgBytes.push(0x80);
  while ((msgBytes.length % 64) !== 56) {
    msgBytes.push(0);
  }

  var bitLen = msgLen * 8;
  for (var i = 0; i < 8; i++) {
    msgBytes.push((bitLen >>> (i * 8)) & 0xff);
  }

  var a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  for (var block = 0; block < msgBytes.length; block += 64) {
    var X = [];
    for (var i = 0; i < 16; i++) {
      var offset = block + i * 4;
      X[i] = msgBytes[offset] | (msgBytes[offset + 1] << 8) |
             (msgBytes[offset + 2] << 16) | (msgBytes[offset + 3] << 24);
    }

    var A = a0, B = b0, C = c0, D = d0;

    // Round 1
    for (var i = 0; i < 16; i++) {
      var temp = md5Transform(FF, A, B, C, D, X[i], S[i % 4], T[i]);
      A = D; D = C; C = B; B = addUnsigned(B, temp);
    }
    // Round 2
    for (var i = 0; i < 16; i++) {
      var idx = (5 * i + 1) % 16;
      var temp = md5Transform(GG, A, B, C, D, X[idx], S[4 + (i % 4)], T[16 + i]);
      A = D; D = C; C = B; B = addUnsigned(B, temp);
    }
    // Round 3
    for (var i = 0; i < 16; i++) {
      var idx = (3 * i + 5) % 16;
      var temp = md5Transform(HH, A, B, C, D, X[idx], S[8 + (i % 4)], T[32 + i]);
      A = D; D = C; C = B; B = addUnsigned(B, temp);
    }
    // Round 4
    for (var i = 0; i < 16; i++) {
      var idx = (7 * i) % 16;
      var temp = md5Transform(II, A, B, C, D, X[idx], S[12 + (i % 4)], T[48 + i]);
      A = D; D = C; C = B; B = addUnsigned(B, temp);
    }

    a0 = addUnsigned(a0, A);
    b0 = addUnsigned(b0, B);
    c0 = addUnsigned(c0, C);
    d0 = addUnsigned(d0, D);
  }

  function toHex(num) {
    var s = '';
    for (var i = 0; i < 4; i++) {
      var byteVal = (num >>> (i * 8)) & 0xff;
      s += ('0' + byteVal.toString(16)).slice(-2);
    }
    return s;
  }

  return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
}

/**
 * WBI 签名参数
 * @param {Object} params - 待签名参数字典
 * @param {string} imgKey - WBI img key
 * @param {string} subKey - WBI sub key
 * @returns {Object} 添加了 wts 和 w_rid 后的参数
 */
function signWBI(params, imgKey, subKey) {
  var mixinKey = getMixinKey(imgKey, subKey);
  params.wts = Math.floor(Date.now() / 1000);

  // 按 key 字母序排序
  var sortedKeys = Object.keys(params).sort();
  var query = [];
  for (var i = 0; i < sortedKeys.length; i++) {
    var k = sortedKeys[i];
    query.push(k + '=' + params[k]);
  }
  var queryStr = query.join('&');

  // MD5(query + mixinKey)
  params.w_rid = md5(queryStr + mixinKey);
  return params;
}

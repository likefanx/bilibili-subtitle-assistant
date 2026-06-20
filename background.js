/**
 * Background Service Worker
 * Handles chrome.scripting.executeScript from content script requests
 * NOTE: mainWorldFetch must be fully self-contained — executeScript serializes only the function body
 */

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type === 'fetchSubtitles') {
    var tabId = sender.tab.id;
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      world: 'MAIN',
      func: mainWorldFetch,
      args: [request.aid, request.cid]
    }).then(function(results) {
      sendResponse({ success: true, data: results[0].result });
    }).catch(function(err) {
      sendResponse({ success: false, error: err.message });
    });
    return true; // async response
  }
});

/**
 * ALL helper functions and constants MUST be defined INSIDE this function
 * because chrome.scripting.executeScript serializes only the function body.
 */
function mainWorldFetch(aid, cid) {
  // ---- MD5 (self-contained) ----
  function md5(str) {
    function rotateLeft(n, s) { return (n << s) | (n >>> (32 - s)); }
    function addUnsigned(x, y) {
      var lsw = (x & 0xffff) + (y & 0xffff);
      var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xffff);
    }
    function F(x, y, z) { return (x & y) | ((~x) & z); }
    function G(x, y, z) { return (x & z) | (y & (~z)); }
    function H(x, y, z) { return (x ^ y ^ z); }
    function I(x, y, z) { return (x ^ y) | (y ^ z); }
    function FF(a, b, c, d, x, s, t) { return rotateLeft(addUnsigned(addUnsigned(a, F(b, c, d)), addUnsigned(x, t)), s) + b; }
    var S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
    var T = [];
    for (var i = 0; i < 64; i++) T[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000);
    var bytes = [];
    for (var i = 0; i < str.length; i++) bytes.push(str.charCodeAt(i) & 0xff);
    var len = bytes.length;
    bytes.push(0x80);
    while ((bytes.length % 64) !== 56) bytes.push(0);
    var bitLen = len * 8;
    for (var i = 0; i < 8; i++) bytes.push((bitLen >>> (i * 8)) & 0xff);
    var a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    for (var blk = 0; blk < bytes.length; blk += 64) {
      var X = [];
      for (var i = 0; i < 16; i++) { var o = blk + i * 4; X[i] = bytes[o] | (bytes[o + 1] << 8) | (bytes[o + 2] << 16) | (bytes[o + 3] << 24); }
      var A = a0, B = b0, C = c0, D = d0;
      for (var i = 0; i < 16; i++) { var t1 = FF(A, B, C, D, X[i], S[i % 4], T[i]); A = D; D = C; C = B; B = addUnsigned(B, t1); }
      for (var i = 0; i < 16; i++) { var idx = (5 * i + 1) % 16; var q = G(A, B, C, D); var t2 = rotateLeft(addUnsigned(addUnsigned(A, q), addUnsigned(X[idx], T[16 + i])), S[4 + (i % 4)]) + B; A = D; D = C; C = B; B = addUnsigned(B, t2); }
      for (var i = 0; i < 16; i++) { var idx = (3 * i + 5) % 16; var t3 = rotateLeft(addUnsigned(addUnsigned(A, H(A, B, C, D)), addUnsigned(X[idx], T[32 + i])), S[8 + (i % 4)]) + B; A = D; D = C; C = B; B = addUnsigned(B, t3); }
      for (var i = 0; i < 16; i++) { var idx = (7 * i) % 16; var t4 = rotateLeft(addUnsigned(addUnsigned(A, I(A, B, C, D)), addUnsigned(X[idx], T[48 + i])), S[12 + (i % 4)]) + B; A = D; D = C; C = B; B = addUnsigned(B, t4); }
      a0 = addUnsigned(a0, A); b0 = addUnsigned(b0, B); c0 = addUnsigned(c0, C); d0 = addUnsigned(d0, D);
    }
    function toHex(n) { var s = ''; for (var i = 0; i < 4; i++) { var b = (n >>> (i * 8)) & 0xff; s += ('0' + b.toString(16)).slice(-2); } return s; }
    return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
  }

  // ---- WBI Constants & Logic ----
  var MIXIN_TAB = [46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36, 20, 34, 44, 52];

  function getMixinKey(img, sub) {
    var raw = img + sub;
    var result = '';
    for (var i = 0; i < MIXIN_TAB.length; i++) { var idx = MIXIN_TAB[i]; if (idx < raw.length) result += raw.charAt(idx); }
    return result;
  }

  var HDR = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.bilibili.com/',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Origin': 'https://www.bilibili.com'
  };

  return (async function() {
    try {
      // Step 1: Fetch WBI keys
      var navResp = await fetch('https://api.bilibili.com/x/web-interface/nav', { headers: HDR, credentials: 'include' }).then(function(r) { return r.json(); });
      if (navResp.code !== 0) throw new Error('Nav API failed: ' + (navResp.message || 'unknown'));

      var imgUrl = navResp.data.wbi_img.img_url;
      var subUrl = navResp.data.wbi_img.sub_url;
      var imgKey = imgUrl.split('/').pop().split('.')[0];
      var subKey = subUrl.split('/').pop().split('.')[0];

      // Step 2: WBI-signed subtitle API
      var mixinKey = getMixinKey(imgKey, subKey);
      var params = { aid: aid, cid: cid, wts: Math.floor(Date.now() / 1000) };
      var sortedKeys = Object.keys(params).sort();
      var query = sortedKeys.map(function(k) { return k + '=' + params[k]; }).join('&');
      params.w_rid = md5(query + mixinKey);
      var wbiQuery = sortedKeys.map(function(k) { return k + '=' + params[k]; }).join('&') + '&w_rid=' + params.w_rid;

      var subResp = await fetch('https://api.bilibili.com/x/player/wbi/v2?' + wbiQuery, { headers: HDR, credentials: 'include' }).then(function(r) { return r.json(); });

      if (subResp.code !== 0) {
        var fbResp = await fetch('https://api.bilibili.com/x/player/v2?cid=' + cid + '&aid=' + aid, { headers: HDR, credentials: 'include' }).then(function(r) { return r.json(); });
        if (fbResp.code !== 0) throw new Error('Subtitle API failed: ' + (fbResp.message || 'unknown'));
        subResp = fbResp;
      }

      var subtitles = ((subResp.data || {}).subtitle || {}).subtitles || [];
      if (!subtitles.length) return { error: '该视频没有可用字幕' };

      // Prefer AI → Chinese → first
      var aiSubs = subtitles.filter(function(s) {
        return s.ai_status === 1 || (s.lan || '').toLowerCase().indexOf('ai') !== -1 ||
          (s.lan_doc || '').toLowerCase().indexOf('ai') !== -1 || (s.lan_doc || '').indexOf('自动') !== -1;
      });
      var zhSubs = subtitles.filter(function(s) { return (s.lan || '').toLowerCase().indexOf('zh') !== -1; });
      var chosen = aiSubs.length ? aiSubs[0] : (zhSubs.length ? zhSubs[0] : subtitles[0]);

      var subUrl = chosen.subtitle_url || '';
      if (subUrl.indexOf('//') === 0) subUrl = 'https:' + subUrl;
      if (!subUrl) return { error: '未能获取字幕URL' };

      // Step 3: Download & parse subtitle JSON
      var subData = await fetch(subUrl, { headers: Object.assign({}, HDR, { Referer: 'https://www.bilibili.com/' }) }).then(function(r) { return r.json(); });

      var body = subData.body || [];
      var lines = [];
      for (var i = 0; i < body.length; i++) {
        var from = body[i].from || 0;
        var content = (body[i].content || '').replace(/\n/g, ' ');
        lines.push('[' + from.toFixed(1) + 's] ' + content);
      }

      return { text: lines.join('\n'), language: chosen.lan_doc || chosen.lan || 'unknown' };
    } catch (e) {
      return { error: e.message || 'Unknown error' };
    }
  })();
}

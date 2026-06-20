/**
 * 字幕获取模块
 * 通过 background service worker 调用 chrome.scripting.executeScript
 * 在页面主上下文中执行 WBI API 调用
 */

var SUBTITLE_FETCHER = (function() {
  'use strict';

  /**
   * @param {number} aid
   * @param {number} cid
   * @returns {Promise<{text: string, language: string}>}
   */
  function fetchSubtitles(aid, cid) {
    return new Promise(function(resolve, reject) {
      chrome.runtime.sendMessage({
        type: 'fetchSubtitles',
        aid: aid,
        cid: cid
      }, function(response) {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error((response && response.error) || 'Unknown error'));
        }
      });
    });
  }

  return { fetchSubtitles: fetchSubtitles };
})();

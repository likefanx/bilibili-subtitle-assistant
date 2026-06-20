/**
 * 入口模块 — 通过 B站公开 API 获取 aid/cid，初始化 UI + 字幕提取
 */

(function() {
  'use strict';

  var BV_REGEX = /\/video\/(BV[a-zA-Z0-9]+)/;
  var match = location.pathname.match(BV_REGEX);
  if (!match) return;

  var bvid = match[1];
  var videoIds = null;

  function fetchVideoInfo() {
    return fetch('https://api.bilibili.com/x/web-interface/view?bvid=' + bvid, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.bilibili.com/', 'Accept': 'application/json' }
    }).then(function(r) { return r.json(); });
  }

  function getCurrentPage() {
    var pm = location.search.match(/[?&]p=(\d+)/);
    return pm ? parseInt(pm[1]) : 1;
  }

  function init() {
    fetchVideoInfo().then(function(resp) {
      if (resp.code !== 0) throw new Error('View API failed: ' + (resp.message || ''));
      var data = resp.data;
      var pages = data.pages || [];
      var currentPage = getCurrentPage();
      var cid = null;
      for (var i = 0; i < pages.length; i++) {
        if (pages[i].page === currentPage) { cid = pages[i].cid; break; }
      }
      if (!cid && pages.length > 0) cid = pages[0].cid;
      if (!data.aid || !cid) throw new Error('Failed to get aid/cid');

      videoIds = { aid: data.aid, cid: cid, bvid: bvid };
      onReady();
    }).catch(function(err) {
      console.warn('[B站字幕助手] 初始化失败:', err.message);
      setTimeout(function() {
        fetchVideoInfo().then(function(resp) {
          if (resp.code === 0) {
            var data = resp.data, pages = data.pages || [], cp = getCurrentPage(), cid = null;
            for (var i = 0; i < pages.length; i++) { if (pages[i].page === cp) { cid = pages[i].cid; break; } }
            if (!cid && pages.length > 0) cid = pages[0].cid;
            if (data.aid && cid) { videoIds = { aid: data.aid, cid: cid, bvid: bvid }; onReady(); return; }
          }
          console.warn('[B站字幕助手] 重试后仍未能获取视频信息');
        }).catch(function() { console.warn('[B站字幕助手] 重试后仍未能获取视频信息'); });
      }, 3000);
    });
  }

  function onReady() {
    if (BILIBILI_SUBTITLE_UI._initialized) return;
    BILIBILI_SUBTITLE_UI._initialized = true;

    BILIBILI_SUBTITLE_UI.init();
    var ids = videoIds;

    // Set up auto-extraction handler — ui.js togglePanel calls this when panel opens
    window.__bilibiliSubtitleExtract = function() {
      BILIBILI_SUBTITLE_UI.setSubtitleLoading();
      BILIBILI_SUBTITLE_UI.showPanel();
      BILIBILI_SUBTITLE_UI.getState().subtitleLoading = true;

      SUBTITLE_FETCHER.fetchSubtitles(ids.aid, ids.cid).then(function(data) {
        if (data && data.text && !data.error) {
          BILIBILI_SUBTITLE_UI.setSubtitleText(data.text);
        } else if (data && data.error) {
          BILIBILI_SUBTITLE_UI.setSubtitleError(data.error);
        } else {
          BILIBILI_SUBTITLE_UI.setSubtitleEmpty();
        }
      }).catch(function(err) {
        console.error('[B站字幕助手] 字幕提取失败:', err);
        BILIBILI_SUBTITLE_UI.setSubtitleError(err.message || '未知错误');
      });
    };

    console.log('[B站字幕助手] 初始化完成 — aid=' + ids.aid + ' cid=' + ids.cid);
  }

  init();
})();

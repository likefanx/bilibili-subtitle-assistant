/**
 * UI 模块
 * 注入按钮到 B站播放器、创建浮动字幕面板、Prompt 管理、一键复制
 */

var BILIBILI_SUBTITLE_UI = (function() {
  'use strict';

  var STYLE_ID = '__bilibili_subtitle_ext_styles__';
  var PANEL_ID = '__bilibili_subtitle_panel__';
  var BTN_ID = '__bilibili_subtitle_btn__';
  var STORAGE_KEY = 'savedPrompts';

  var state = {
    subtitleText: '',
    subtitleLoading: false,
    panelVisible: false,
    savedPrompts: [],
    currentPromptId: null
  };

  // ==================== CSS 注入 ====================

  var CSS = [
    '#' + PANEL_ID + ' {',
    '  position: fixed;',
    '  top: 80px;',
    '  right: 20px;',
    '  width: 420px;',
    '  max-height: 75vh;',
    '  background: #1a1a2e;',
    '  border: 1px solid #333;',
    '  border-radius: 12px;',
    '  box-shadow: 0 8px 32px rgba(0,0,0,0.6);',
    '  z-index: 99999;',
    '  display: flex;',
    '  flex-direction: column;',
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;',
    '  color: #e0e0e0;',
    '  font-size: 13px;',
    '  user-select: none;',
    '  overflow: hidden;',
    '}',
    '#' + PANEL_ID + '.hidden { display: none; }',
    '#' + PANEL_ID + '.minimized { max-height: 44px; }',
    '#' + PANEL_ID + ' .panel-header {',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: space-between;',
    '  padding: 10px 14px;',
    '  background: #16213e;',
    '  border-bottom: 1px solid #333;',
    '  cursor: move;',
    '  border-radius: 12px 12px 0 0;',
    '  flex-shrink: 0;',
    '}',
    '#' + PANEL_ID + ' .panel-header .title {',
    '  font-size: 14px;',
    '  font-weight: 600;',
    '  color: #fff;',
    '}',
    '#' + PANEL_ID + ' .panel-header .header-btns {',
    '  display: flex;',
    '  gap: 6px;',
    '}',
    '#' + PANEL_ID + ' .panel-header .header-btns button {',
    '  background: none;',
    '  border: none;',
    '  color: #aaa;',
    '  cursor: pointer;',
    '  font-size: 14px;',
    '  padding: 2px 6px;',
    '  border-radius: 4px;',
    '  line-height: 1;',
    '}',
    '#' + PANEL_ID + ' .panel-header .header-btns button:hover {',
    '  color: #fff;',
    '  background: rgba(255,255,255,0.1);',
    '}',
    '#' + PANEL_ID + ' .panel-content {',
    '  display: flex;',
    '  flex-direction: column;',
    '  flex: 1;',
    '  overflow: hidden;',
    '  min-height: 0;',
    '}',
    '#' + PANEL_ID + ' .subtitle-area {',
    '  flex: 1;',
    '  overflow-y: auto;',
    '  padding: 12px;',
    '  font-size: 12px;',
    '  line-height: 1.7;',
    '  font-family: "SF Mono", "Fira Code", "Consolas", monospace;',
    '  white-space: pre-wrap;',
    '  word-break: break-all;',
    '  max-height: 35vh;',
    '  min-height: 80px;',
    '  background: #0f0f23;',
    '  color: #b8c5d6;',
    '  border-bottom: 1px solid #2a2a4a;',
    '}',
    '#' + PANEL_ID + ' .subtitle-area .loading {',
    '  text-align: center;',
    '  color: #888;',
    '  padding: 30px 0;',
    '  font-style: italic;',
    '}',
    '#' + PANEL_ID + ' .subtitle-area .empty {',
    '  text-align: center;',
    '  color: #666;',
    '  padding: 20px 0;',
    '}',
    '#' + PANEL_ID + ' .subtitle-area::-webkit-scrollbar { width: 6px; }',
    '#' + PANEL_ID + ' .subtitle-area::-webkit-scrollbar-track { background: #0f0f23; }',
    '#' + PANEL_ID + ' .subtitle-area::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }',
    '#' + PANEL_ID + ' .prompt-section {',
    '  padding: 10px 14px;',
    '  flex-shrink: 0;',
    '}',
    '#' + PANEL_ID + ' .prompt-section label {',
    '  display: block;',
    '  font-size: 12px;',
    '  color: #999;',
    '  margin-bottom: 6px;',
    '  font-weight: 500;',
    '}',
    '#' + PANEL_ID + ' .prompt-section textarea {',
    '  width: 100%;',
    '  box-sizing: border-box;',
    '  height: 60px;',
    '  background: #0f0f23;',
    '  border: 1px solid #444;',
    '  border-radius: 6px;',
    '  color: #e0e0e0;',
    '  padding: 8px;',
    '  font-size: 12px;',
    '  font-family: inherit;',
    '  resize: vertical;',
    '  outline: none;',
    '}',
    '#' + PANEL_ID + ' .prompt-section textarea:focus {',
    '  border-color: #00a1d6;',
    '}',
    '#' + PANEL_ID + ' .prompt-actions {',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 8px;',
    '  margin-top: 8px;',
    '}',
    '#' + PANEL_ID + ' .prompt-actions select {',
    '  flex: 1;',
    '  background: #0f0f23;',
    '  border: 1px solid #444;',
    '  border-radius: 6px;',
    '  color: #e0e0e0;',
    '  padding: 5px 8px;',
    '  font-size: 12px;',
    '  font-family: inherit;',
    '  outline: none;',
    '  cursor: pointer;',
    '  max-width: 140px;',
    '}',
    '#' + PANEL_ID + ' .prompt-actions button {',
    '  background: #2a2a4a;',
    '  border: 1px solid #444;',
    '  border-radius: 6px;',
    '  color: #ccc;',
    '  padding: 5px 10px;',
    '  font-size: 11px;',
    '  cursor: pointer;',
    '  white-space: nowrap;',
    '  font-family: inherit;',
    '}',
    '#' + PANEL_ID + ' .prompt-actions button:hover {',
    '  background: #3a3a5a;',
    '  color: #fff;',
    '}',
    '#' + PANEL_ID + ' .prompt-actions button.copy-btn {',
    '  background: #00a1d6;',
    '  border-color: #00a1d6;',
    '  color: #fff;',
    '  font-weight: 600;',
    '  padding: 5px 14px;',
    '  font-size: 12px;',
    '  flex-shrink: 0;',
    '}',
    '#' + PANEL_ID + ' .prompt-actions button.copy-btn:hover {',
    '  background: #00b5e5;',
    '}',
    '#' + PANEL_ID + ' .prompt-actions button.copy-btn.copied {',
    '  background: #52c41a;',
    '  border-color: #52c41a;',
    '}',

    // Save prompt modal
    '#__bilibili_save_prompt_modal__ {',
    '  position: fixed; inset: 0; z-index: 999999;',
    '  background: rgba(0,0,0,0.6);',
    '  display: flex; align-items: center; justify-content: center;',
    '}',
    '#__bilibili_save_prompt_modal__ .modal-content {',
    '  background: #1a1a2e; border: 1px solid #333; border-radius: 10px;',
    '  padding: 20px; width: 300px;',
    '  color: #e0e0e0; font-size: 13px;',
    '  font-family: -apple-system, BlinkMacSystemFont, sans-serif;',
    '}',
    '#__bilibili_save_prompt_modal__ .modal-content h3 {',
    '  margin: 0 0 12px; font-size: 15px; color: #fff;',
    '}',
    '#__bilibili_save_prompt_modal__ .modal-content input {',
    '  width: 100%; box-sizing: border-box;',
    '  background: #0f0f23; border: 1px solid #444; border-radius: 6px;',
    '  color: #e0e0e0; padding: 8px; font-size: 12px; margin-bottom: 12px;',
    '  outline: none;',
    '}',
    '#__bilibili_save_prompt_modal__ .modal-content input:focus { border-color: #00a1d6; }',
    '#__bilibili_save_prompt_modal__ .modal-btns {',
    '  display: flex; gap: 8px; justify-content: flex-end;',
    '}',
    '#__bilibili_save_prompt_modal__ .modal-btns button {',
    '  padding: 6px 14px; border-radius: 6px; border: 1px solid #444;',
    '  cursor: pointer; font-size: 12px; font-family: inherit;',
    '}',
    '#__bilibili_save_prompt_modal__ .modal-btns .btn-cancel {',
    '  background: #2a2a4a; color: #ccc;',
    '}',
    '#__bilibili_save_prompt_modal__ .modal-btns .btn-save {',
    '  background: #00a1d6; border-color: #00a1d6; color: #fff; font-weight: 600;',
    '}',

    // Player button
    '#' + BTN_ID + ' {',
    '  display: inline-flex !important;',
    '  align-items: center;',
    '  justify-content: center;',
    '  gap: 4px;',
    '  background: rgba(255,255,255,0.08);',
    '  border: 1px solid rgba(255,255,255,0.15);',
    '  border-radius: 5px;',
    '  color: #ccc;',
    '  padding: 4px 10px;',
    '  font-size: 12px;',
    '  cursor: pointer;',
    '  line-height: 20px;',
    '  font-family: -apple-system, BlinkMacSystemFont, sans-serif;',
    '}',
    '#' + BTN_ID + ':hover {',
    '  color: #fff;',
    '  background: rgba(255,255,255,0.15);',
    '}',
    '#' + BTN_ID + ' .subtitle-btn-icon {',
    '  font-size: 14px;',
    '  line-height: 1;',
    '}',
    '#' + BTN_ID + '.active {',
    '  color: #00a1d6;',
    '  border-color: #00a1d6;',
    '}'
  ].join('\n');

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  // ==================== Panel ====================

  function createPanel() {
    if (document.getElementById(PANEL_ID)) return;

    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.className = 'hidden';

    panel.innerHTML = [
      '<div class="panel-header">',
      '  <span class="title">📝 B站字幕助手</span>',
      '  <div class="header-btns">',
      '    <button class="btn-minimize" title="最小化">─</button>',
      '    <button class="btn-close" title="关闭">×</button>',
      '  </div>',
      '</div>',
      '<div class="panel-content">',
      '  <div class="subtitle-area">',
      '    <div class="empty">点击"提取字幕"按钮获取当前视频字幕</div>',
      '  </div>',
      '  <div class="prompt-section">',
      '    <label>💬 额外 Prompt（可选）</label>',
      '    <textarea id="__subtitle_prompt_input__" placeholder="输入额外的 prompt，将会拼接在字幕前方一起复制..."></textarea>',
      '    <div class="prompt-actions">',
      '      <select id="__subtitle_prompt_select__"><option value="">📋 常用Prompt ▼</option></select>',
      '      <button class="btn-save-prompt" title="保存当前Prompt">💾 保存</button>',
      '      <button class="btn-delete-prompt" title="删除选中Prompt">🗑 删除</button>',
      '      <button class="copy-btn" title="一键复制字幕+Prompt">📋 一键复制</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');

    document.body.appendChild(panel);
    bindPanelEvents(panel);
  }

  function bindPanelEvents(panel) {
    // Close
    panel.querySelector('.btn-close').addEventListener('click', function() {
      hidePanel();
    });

    // Minimize
    var content = panel.querySelector('.panel-content');
    panel.querySelector('.btn-minimize').addEventListener('click', function() {
      panel.classList.toggle('minimized');
      var btn = panel.querySelector('.btn-minimize');
      btn.textContent = panel.classList.contains('minimized') ? '☰' : '─';
    });

    // Drag
    var header = panel.querySelector('.panel-header');
    var isDragging = false;
    var startX, startY, origLeft, origTop;

    header.addEventListener('mousedown', function(e) {
      if (e.target.tagName === 'BUTTON') return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      var rect = panel.getBoundingClientRect();
      origLeft = rect.left;
      origTop = rect.top;
      header.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      panel.style.right = 'auto';
      panel.style.top = (origTop + dy) + 'px';
      panel.style.left = (origLeft + dx) + 'px';
    });

    document.addEventListener('mouseup', function() {
      if (isDragging) {
        isDragging = false;
        header.style.cursor = 'move';
      }
    });

    // Prompt select change
    var select = panel.querySelector('#__subtitle_prompt_select__');
    var textarea = panel.querySelector('#__subtitle_prompt_input__');

    select.addEventListener('change', function() {
      var id = select.value;
      if (!id) { textarea.value = ''; state.currentPromptId = null; return; }
      var prompt = state.savedPrompts.find(function(p) { return p.id === id; });
      if (prompt) {
        textarea.value = prompt.text;
        state.currentPromptId = id;
      }
    });

    // Save prompt
    panel.querySelector('.btn-save-prompt').addEventListener('click', function() {
      var text = textarea.value.trim();
      if (!text) { showToast('请先输入 Prompt 内容'); return; }
      showSaveModal(text);
    });

    // Delete prompt
    panel.querySelector('.btn-delete-prompt').addEventListener('click', function() {
      var id = select.value;
      if (!id) { showToast('请先选择要删除的 Prompt'); return; }
      deletePrompt(id);
      select.value = '';
      textarea.value = '';
      state.currentPromptId = null;
    });

    // Copy button
    panel.querySelector('.copy-btn').addEventListener('click', function() {
      if (!state.subtitleText) {
        showToast('请先提取字幕');
        return;
      }
      var prompt = textarea.value.trim();
      var clipboardText = buildClipboardText(state.subtitleText, prompt);
      navigator.clipboard.writeText(clipboardText).then(function() {
        var btn = panel.querySelector('.copy-btn');
        btn.textContent = '✅ 已复制!';
        btn.classList.add('copied');
        setTimeout(function() {
          btn.textContent = '📋 一键复制';
          btn.classList.remove('copied');
        }, 2000);
      }).catch(function() {
        showToast('复制失败，请手动选择复制');
      });
    });
  }

  function showPanel() {
    var panel = document.getElementById(PANEL_ID);
    if (panel) panel.classList.remove('hidden');
    state.panelVisible = true;
  }

  function hidePanel() {
    var panel = document.getElementById(PANEL_ID);
    if (panel) panel.classList.add('hidden');
    state.panelVisible = false;
  }

  function togglePanel() {
    if (state.panelVisible) {
      hidePanel();
    } else {
      showPanel();
      // Call external handler if set (e.g., to auto-extract subtitles)
      if (typeof window.__bilibiliSubtitleExtract === 'function') {
        window.__bilibiliSubtitleExtract();
      }
    }
  }

  // ==================== Subtitle Display ====================

  function setSubtitleText(text) {
    state.subtitleText = text;
    state.subtitleLoading = false;
    var area = document.querySelector('#' + PANEL_ID + ' .subtitle-area');
    if (area) {
      area.textContent = text;
      area.classList.remove('loading', 'empty');
    }
  }

  function setSubtitleLoading() {
    state.subtitleLoading = true;
    state.subtitleText = '';
    var area = document.querySelector('#' + PANEL_ID + ' .subtitle-area');
    if (area) {
      area.innerHTML = '<div class="loading">⏳ 正在提取字幕...</div>';
      area.classList.add('loading');
    }
  }

  function setSubtitleEmpty() {
    state.subtitleLoading = false;
    state.subtitleText = '';
    var area = document.querySelector('#' + PANEL_ID + ' .subtitle-area');
    if (area) {
      area.innerHTML = '<div class="empty">该视频没有可用字幕</div>';
      area.classList.add('empty');
    }
  }

  function setSubtitleError(msg) {
    state.subtitleLoading = false;
    state.subtitleText = '';
    var area = document.querySelector('#' + PANEL_ID + ' .subtitle-area');
    if (area) {
      area.innerHTML = '<div class="empty">❌ 提取失败: ' + escapeHtml(msg) + '</div>';
      area.classList.add('empty');
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ==================== Button ====================

  function injectButton() {
    if (document.getElementById(BTN_ID)) return;

    // Try to find B站 player control bar
    var targetSelectors = [
      '.bpx-player-control-wrap',           // B站 new player (primary)
      '.bpx-player-ctrl-bottom',            // B站 old player
      '.bilibili-player-video-control',     // B站 legacy
      '[class*="player-ctrl"]'              // Generic fallback
    ];

    var container = null;
    for (var i = 0; i < targetSelectors.length; i++) {
      container = document.querySelector(targetSelectors[i]);
      if (container) break;
    }

    var btn = document.createElement('div');
    btn.id = BTN_ID;
    btn.innerHTML = '<span class="subtitle-btn-icon">📝</span><span>字幕</span>';
    btn.title = '提取B站字幕';
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      e.preventDefault();
      togglePanel();
    });

    if (container) {
      // Insert before last element or append
      var lastChild = container.lastElementChild;
      if (lastChild && lastChild.tagName === 'DIV' && lastChild.className.indexOf('bpx-player-ctrl-btn') >= 0) {
        container.insertBefore(btn, lastChild);
      } else {
        container.appendChild(btn);
      }
    } else {
      // Fallback: inject floating button near the player
      btn.style.cssText = 'position:absolute;top:10px;right:10px;z-index:9999;';
      var playerArea = document.querySelector('#bilibiliPlayer, .bpx-player-video-area, .bilibili-player-video');
      if (playerArea) {
        playerArea.style.position = playerArea.style.position || 'relative';
        playerArea.appendChild(btn);
      }
    }
  }

  function updateButtonState(active) {
    var btn = document.getElementById(BTN_ID);
    if (!btn) return;
    if (active) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  }

  // ==================== Prompt Storage ====================

  function loadPrompts() {
    return new Promise(function(resolve) {
      chrome.storage.sync.get([STORAGE_KEY], function(result) {
        state.savedPrompts = result[STORAGE_KEY] || [];
        resolve(state.savedPrompts);
      });
    });
  }

  function savePrompts() {
    return new Promise(function(resolve) {
      chrome.storage.sync.set({ savedPrompts: state.savedPrompts }, function() {
        resolve();
      });
    });
  }

  function savePrompt(name, text) {
    var id = 'prompt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    state.savedPrompts.push({
      id: id,
      name: name,
      text: text,
      createdAt: new Date().toISOString()
    });
    return savePrompts().then(function() {
      refreshPromptSelect();
      return id;
    });
  }

  function deletePrompt(id) {
    state.savedPrompts = state.savedPrompts.filter(function(p) { return p.id !== id; });
    return savePrompts().then(function() {
      refreshPromptSelect();
    });
  }

  function refreshPromptSelect() {
    var select = document.getElementById('__subtitle_prompt_select__');
    if (!select) return;
    select.innerHTML = '<option value="">📋 常用Prompt ▼</option>';
    state.savedPrompts.forEach(function(p) {
      var option = document.createElement('option');
      option.value = p.id;
      option.textContent = p.name;
      select.appendChild(option);
    });
  }

  function showSaveModal(defaultText) {
    // Remove existing modal
    var oldModal = document.getElementById('__bilibili_save_prompt_modal__');
    if (oldModal) oldModal.remove();

    var modal = document.createElement('div');
    modal.id = '__bilibili_save_prompt_modal__';
    modal.innerHTML = [
      '<div class="modal-content">',
      '  <h3>保存 Prompt</h3>',
      '  <input id="__save_prompt_name__" type="text" placeholder="输入 Prompt 名称...">',
      '  <div class="modal-btns">',
      '    <button class="btn-cancel">取消</button>',
      '    <button class="btn-save">保存</button>',
      '  </div>',
      '</div>'
    ].join('');

    document.body.appendChild(modal);

    var nameInput = modal.querySelector('#__save_prompt_name__');
    nameInput.focus();

    modal.querySelector('.btn-save').addEventListener('click', function() {
      var name = nameInput.value.trim();
      if (!name) { showToast('请输入名称'); return; }
      savePrompt(name, defaultText).then(function() {
        modal.remove();
        var select = document.getElementById('__subtitle_prompt_select__');
        // Select the newly saved prompt
        var last = state.savedPrompts[state.savedPrompts.length - 1];
        if (last && select) {
          select.value = last.id;
          state.currentPromptId = last.id;
        }
        showToast('已保存: ' + name);
      });
    });

    modal.querySelector('.btn-cancel').addEventListener('click', function() {
      modal.remove();
    });

    // Click outside to close
    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.remove();
    });
  }

  // ==================== Clipboard ====================

  function buildClipboardText(subtitleText, promptText) {
    if (promptText) {
      return promptText + '\n\n---\n\n' + subtitleText;
    }
    return subtitleText;
  }

  // ==================== Toast ====================

  function showToast(msg) {
    var toast = document.createElement('div');
    toast.textContent = msg;
    toast.style.cssText = [
      'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:9999999;',
      'background:#1a1a2e;color:#fff;padding:10px 20px;border-radius:8px;',
      'font-size:13px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;',
      'box-shadow:0 4px 16px rgba(0,0,0,0.5);opacity:0;transition:opacity 0.3s;'
    ].join('');
    document.body.appendChild(toast);
    requestAnimationFrame(function() {
      toast.style.opacity = '1';
    });
    setTimeout(function() {
      toast.style.opacity = '0';
      setTimeout(function() { toast.remove(); }, 300);
    }, 2000);
  }

  // ==================== Init ====================

  function init() {
    injectStyles();
    createPanel();
    injectButton();
    loadPrompts().then(function() {
      refreshPromptSelect();
    });
  }

  return {
    init: init,
    setSubtitleText: setSubtitleText,
    setSubtitleLoading: setSubtitleLoading,
    setSubtitleEmpty: setSubtitleEmpty,
    setSubtitleError: setSubtitleError,
    showPanel: showPanel,
    hidePanel: hidePanel,
    togglePanel: togglePanel,
    showToast: showToast,
    getState: function() { return state; }
  };
})();

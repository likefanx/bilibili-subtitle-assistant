# B站字幕助手

提取B站视频字幕到浏览器侧边栏，支持自定义Prompt，一键复制给AI总结。

## 功能

- 📝 自动检测B站视频页面，在播放器控制栏注入"字幕"按钮
- 🔓 **无需配置** — 自动复用浏览器B站登录态，无需填Cookie或Token
- ⚡ WBI签名 API 提取字幕，智能优选AI字幕→中文字幕
- 💬 **自定义Prompt** — 输入额外提示词，一键复制"Prompt + 字幕"到剪贴板
- 💾 **Prompt管理** — 保存常用Prompt（支持Chrome跨设备同步）
- 🎨 浮动暗色面板，可拖拽、可最小化

## 安装

1. 下载本仓库或 `git clone`
2. Chrome → `chrome://extensions` → 打开"开发者模式"
3. "加载未打包的扩展程序" → 选择本目录
4. 打开任意B站视频页面（`https://www.bilibili.com/video/BV...`）

## 使用

1. 打开B站视频页面，等待播放器加载
2. 点击播放器控制栏的 **📝 字幕** 按钮
3. 浮窗显示带时间戳的字幕
4. （可选）输入额外Prompt → 保存常用Prompt
5. 点击 **📋 一键复制** → 粘贴到任意AI工具

## 技术架构

- Chrome Extension Manifest V3
- Content Script + Background Service Worker
- `chrome.scripting.executeScript({world: 'MAIN'})` 绕过B站CSP
- WBI签名算法（JavaScript移植）
- Chrome Storage Sync（Prompt跨设备同步）

## 文件说明

| 文件 | 用途 |
|------|------|
| `background.js` | Service Worker，在页面主世界执行API调用 |
| `content.js` | 入口，获取aid/cid，初始化编排 |
| `subtitle-fetcher.js` | 与background通信的消息模块 |
| `ui.js` | 按钮注入、字幕面板、Prompt管理、拖拽、复制 |
| `styles.css` | 注入样式（暗色面板） |
| `wbi.js` | WBI签名算法参考实现 |

## 隐私

- **不收集、不存储任何账户信息**
- 登录态完全由浏览器自动管理（`credentials: 'include'`）
- WBI密钥每session动态获取，不持久化
- Prompt保存在Chrome Storage Sync中，仅用户可访问

## License

MIT

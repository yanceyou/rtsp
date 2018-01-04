# RTSP Middleware

Use node.js as middleware to translate RTSP into WebSocket

## 运行环境

- [ffmpeg](https://www.ffmpeg.org/download.html)
- [node.js](https://nodejs.org/en/download/)

## 使用

```bash
git clone <repo>
cd <repo>
npm install
```

## 参考资料

- [ffmpeg in html5](https://gist.github.com/yellowled/1439610)

## 解决思路

### 方案1：直接连接 IP摄像头 ---> 浏览器

1. 目前浏览器并不直接支持 RTSP 协议

- [chrome 并不直接支持 RTSP 协议](https://stackoverflow.com/questions/41965793/rtsp-h-264-in-google-chrome-browser)
- [chrome 最近没有计划实现 RTSP 协议](https://bugs.chromium.org/p/chromium/issues/detail?id=676347&can=1&q=rtsp&colspec=ID%20Pri%20M%20Stars%20ReleaseBlock%20Component%20Status%20Owner%20Summary%20OS%20Modified)

2. 使用浏览器插件 VLC WebPlugin 存在兼容性问题

- [VLC WebPlugin Browsers support](https://wiki.videolan.org/Documentation:WebPlugin/)
- [chrome, Mozilla将不再支持 NPAPI](https://www.zhihu.com/question/31227185)

3. 使用 javascript/webassembly 直接实现对 RTSP 协议的支持

- \(^o^)/~
- \(^o^)/~

### 方案2：间接连接 IP摄像头 ---> 服务器 ---> 浏览器

1. 通过 FFmpeg 将 RTSP 协议转换成 HTTP 协议，浏览器直接读取 HTTP 协议
2. 通过 FFmpeg 将 RTSP 协议进行转换，然后通过进程间通信的方式，将转换的结果通过websocket传到浏览器

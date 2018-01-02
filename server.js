// const Stream = require('node-rtsp-stream-es6')

// const stream = new Stream({
//     name: 'RtspStreamTest',
//     url: 'rtsp://localhost:8554/vlc',
//     port: 10086
// })


const Stream = require('node-rtsp-stream');

const stream = new Stream({
    name: 'name',
    streamUrl: 'rtsp://192.168.1.104:8554/vlc',
    wsPort: 10086
});

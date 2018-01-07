const Stream = require('./src/videoStream')

const stream = new Stream({
    name: 'RtspStreamTest',
    url: 'rtsp://192.168.1.104:8554/',
    port: 10086
})

stream.start()

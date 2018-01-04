const Stream = require('./src/videoStream')

const stream = new Stream({
    name: 'RtspStreamTest',
    url: 'rtsp://localhost:8554/',
    port: 10086
})

stream.start()

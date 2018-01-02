const child_process = require('child_process')
const EventEmitter = require('events')

class ProtocolConversion extends EventEmitter {
    constructor(options) {
        super(options)

        this.url = options.url

        const ffmpegArgus = `-i ${this.url} -rtsp_transport tcp -b:v 180k -r 30 -`;
        // const ffmpegArgus = `-i ${this.url} -rtsp_transport tcp -f mpeg1video -b:v 180k -r 30 -`;
        this.stream = child_process.spawn("ffmpeg", ffmpegArgus.split(' '), {
            detached: false
        })

        this.inputStreamStarted = true
        this.stream.stdout.on('data', (data) => { return this.emit('mpeg1data', data) })
        this.stream.stderr.on('data', (data) => { return this.emit('ffmpegError', data) })
    }
}

module.exports = ProtocolConversion

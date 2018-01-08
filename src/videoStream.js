// @see: https://github.com/kyriesent/node-rtsp-stream

// The MIT License (MIT)

// Copyright (c) 2014 David Jsa

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

const WebSocket = require('ws')
const EventEmitter = require('events')
const STREAM_MAGIC_BYTES = "jsmp"
const ProtocolConversion = require('./ProtocolConversion')

class VideoStream extends EventEmitter {

    constructor(options) {
        super(options)
        this.name = options.name
        this.url = options.url
        this.width = options.width
        this.height = options.height
        this.port = options.port
        this.stream = void 0
        this.stream2Socket()
    }

    stream2Socket() {
        const server = new WebSocket.Server({ port: this.port })
        server.on('connection', (socket) => {

            console.log(`New connection: ${this.name}`)

            let streamHeader = new Buffer(8)
            streamHeader.write(STREAM_MAGIC_BYTES)
            streamHeader.writeUInt16BE(this.width, 4)
            streamHeader.writeUInt16BE(this.height, 6)
            socket.send(streamHeader)

            this.on('camdata', (data) => {
                server.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) { client.send(data) }
                })
            })

            socket.on('close', () => { console.log(`${this.name} disconnected !`) })
        })
    }

    onSocketConnect(socket) {
        let streamHeader = new Buffer(8)
        streamHeader.write(STREAM_MAGIC_BYTES)
        streamHeader.writeUInt16BE(this.width, 4)
        streamHeader.writeUInt16BE(this.height, 6)
        socket.send(streamHeader, { binary: true })
        console.log(`New connection: ${this.name} - ${this.wsServer.clients.length} total`)
        return socket.on("close", function (code, message) {
            return console.log(`${this.name} disconnected - ${this.wsServer.clients.length} total`)
        })
    }

    start() {
        this.mpeg1Muxer = new ProtocolConversion({ url: this.url })
        this.mpeg1Muxer.on('streamData', (data) => { return this.emit('camdata', data) })

        let gettingInputData = false
        let gettingOutputData = false
        let inputData = []
        let outputData = []

        this.mpeg1Muxer.on('ffmpegError', (data) => {
            data = data.toString()
            if (data.indexOf('Input #') !== -1) { gettingInputData = true }
            if (data.indexOf('Output #') !== -1) {
                gettingInputData = false
                gettingOutputData = true
            }
            if (data.indexOf('frame') === 0) { gettingOutputData = false }
            if (gettingInputData) {
                inputData.push(data.toString())
                let size = data.match(/\d+x\d+/)
                if (size != null) {
                    size = size[0].split('x')
                    if (this.width == null) { this.width = parseInt(size[0], 10) }
                    if (this.height == null) { return this.height = parseInt(size[1], 10) }
                }
            }
        })
        this.mpeg1Muxer.on('ffmpegError', (data) => { return global.process.stderr.write(data) })
        return this
    }
}

module.exports = VideoStream

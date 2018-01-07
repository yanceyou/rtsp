'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('../events');

var _events2 = _interopRequireDefault(_events);

var _eventHandler = require('../event-handler');

var _eventHandler2 = _interopRequireDefault(_eventHandler);

var _h264Demuxer = require('../demux/h264-demuxer');

var _h264Demuxer2 = _interopRequireDefault(_h264Demuxer);

var _crc = require('./crc.js');

var _crc2 = _interopRequireDefault(_crc);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Websocket Loader
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */

var WebsocketLoader = function (_EventHandler) {
  _inherits(WebsocketLoader, _EventHandler);

  function WebsocketLoader(wfs) {
    _classCallCheck(this, WebsocketLoader);

    var _this = _possibleConstructorReturn(this, (WebsocketLoader.__proto__ || Object.getPrototypeOf(WebsocketLoader)).call(this, wfs, _events2.default.WEBSOCKET_ATTACHING, _events2.default.WEBSOCKET_DATA_UPLOADING, _events2.default.WEBSOCKET_MESSAGE_SENDING));

    _this.buf = null;
    _this.h264Demuxer = new _h264Demuxer2.default(wfs);
    _this.mediaType = undefined;
    _this.channelName = undefined;
    return _this;
  }

  _createClass(WebsocketLoader, [{
    key: 'destroy',
    value: function destroy() {
      _eventHandler2.default.prototype.destroy.call(this);
    }
  }, {
    key: 'onWebsocketAttaching',
    value: function onWebsocketAttaching(data) {
      this.mediaType = data.mediaType;
      this.channelName = data.channelName;
      if (data.websocket instanceof WebSocket) {
        this.client = data.websocket;
        this.client.onopen = this.initSocketClient.bind(this);
        this.client.onclose = function (e) {
          console.log('Websocket Disconnected!');
        };
      }
    }
  }, {
    key: 'initSocketClient',
    value: function initSocketClient(client) {
      this.client.binaryType = 'arraybuffer';
      this.client.onmessage = this.receiveSocketMessage.bind(this);
      this.wfs.trigger(_events2.default.WEBSOCKET_MESSAGE_SENDING, { commandType: "open", channelName: this.channelName, commandValue: "NA" });
      console.log('Websocket Open!');
    }
  }, {
    key: 'receiveSocketMessage',
    value: function receiveSocketMessage(event) {
      var buffer = new Uint8Array(event.data);
      console.log(buffer.length);
      var newBuffer;
      if (this.buf) {
        newBuffer = new Uint8Array(this.buf.byteLength + buffer.byteLength);
        newBuffer.set(this.buf);
        newBuffer.set(buffer, this.buf.byteLength);
        console.log(newBuffer.length);
      } else newBuffer = new Uint8Array(buffer);
      //get len
      var offset = 0;
      var lenView = new DataView(newBuffer.buffer);
      var len = lenView.getUint32(0);
      while (len < newBuffer.byteLength - 4) {
        console.log("frames, len:" + len);
        var copy = newBuffer.subarray(4, len + 4);
        this.wfs.trigger(_events2.default.H264_DATA_PARSING, { data: copy });
        //var copy2 = new Uint8Array(0);
        //this.wfs.trigger(Event.H264_DATA_PARSING, {data: copy2});
        //this.wfs.trigger(Event.H264_DATA_PARSING, {data: copy2});
        newBuffer = newBuffer.subarray(len + 4);
        offset += len + 4;
        len = lenView.getUint32(offset);
        //get len
      }
      if (len === newBuffer.byteLength - 4) {
        var copy = newBuffer.subarray(4, len + 4);
        this.wfs.trigger(_events2.default.H264_DATA_PARSING, { data: copy });
        //var copy2 = new Uint8Array(0);
        //this.wfs.trigger(Event.H264_DATA_PARSING,{data:copy2});
        //this.wfs.trigger(Event.H264_DATA_PARSING,{data:copy2});
        this.buf = null;
      } else this.buf = new Uint8Array(newBuffer);
      /*
          this.buf = new Uint8Array(event.data, 4);
          //this.buf = new Uint8Array(event.data);
          var buf_crc = new Uint8Array(event.data, 0, 4);
          var copy = new Uint8Array(this.buf);  
          
          if (this.mediaType ==='FMp4'){
            this.wfs.trigger(Event.WEBSOCKET_ATTACHED, {payload: copy });
          } 
          if (this.mediaType === 'H264Raw'){
            console.log(copy.length);
            var crc16 = crc.crc16;
            var crc32 = crc.crc32;
            var crc_s = crc16(copy);
            var buf_crc_s =  (buf_crc.map(String.fromCharCode)).join("");
            if(String.fromCharCode(buf_crc[0]) == crc_s[0] &&
      	 String.fromCharCode(buf_crc[1]) == crc_s[1] &&
      	 String.fromCharCode(buf_crc[2]) == crc_s[2] &&
      	 String.fromCharCode(buf_crc[3]) == crc_s[3]){
      	//		console.log("equal");	
            }
            else
      	console.log("not equal");
           // console.log(crc_s);
            this.wfs.trigger(Event.H264_DATA_PARSING, {data: copy });
          }
      */
    }
  }, {
    key: 'onWebsocketDataUploading',
    value: function onWebsocketDataUploading(event) {
      this.client.send(event.data);
    }
  }, {
    key: 'onWebsocketMessageSending',
    value: function onWebsocketMessageSending(event) {
      this.client.send(JSON.stringify({ t: event.commandType, c: event.channelName, v: event.commandValue }));
    }
  }]);

  return WebsocketLoader;
}(_eventHandler2.default);

exports.default = WebsocketLoader;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('../events');

var _events2 = _interopRequireDefault(_events);

var _eventHandler = require('../event-handler');

var _eventHandler2 = _interopRequireDefault(_eventHandler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /*
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Flow Controller
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */

var FlowController = function (_EventHandler) {
  _inherits(FlowController, _EventHandler);

  function FlowController(wfs) {
    _classCallCheck(this, FlowController);

    var _this = _possibleConstructorReturn(this, (FlowController.__proto__ || Object.getPrototypeOf(FlowController)).call(this, wfs, _events2.default.MEDIA_ATTACHED, _events2.default.BUFFER_CREATED, _events2.default.FILE_PARSING_DATA, _events2.default.FILE_HEAD_LOADED, _events2.default.FILE_DATA_LOADED, _events2.default.WEBSOCKET_ATTACHED, _events2.default.FRAG_PARSING_DATA, _events2.default.FRAG_PARSING_INIT_SEGMENT));

    _this.fileStart = 0;
    _this.fileEnd = 0;
    _this.pendingAppending = 0;
    _this.mediaType = undefined;
    channelName: _this.channelName;
    return _this;
  }

  _createClass(FlowController, [{
    key: 'destroy',
    value: function destroy() {
      _eventHandler2.default.prototype.destroy.call(this);
    }
  }, {
    key: 'onMediaAttached',
    value: function onMediaAttached(data) {
      if (data.websocketName != undefined) {
        //var client = new WebSocket( 'ws://' + window.location.host + '/' +  data.websocketName );
        var uri = 'ws://' + '192.168.2.51:10010';
        var protocol = 'binary';
        var client = new WebSocket(uri, protocol);
        this.wfs.attachWebsocket(client, data.channelName);
      } else {
        console.log('websocketName ERROE!!!');
      }
    }
  }, {
    key: 'onBufferCreated',
    value: function onBufferCreated(data) {
      this.mediaType = data.mediaType;
    }
  }, {
    key: 'onFileHeadLoaded',
    value: function onFileHeadLoaded(data) {}
  }, {
    key: 'onFileDataLoaded',
    value: function onFileDataLoaded(data) {}
  }, {
    key: 'onFileParsingData',
    value: function onFileParsingData(data) {}
  }, {
    key: 'onWebsocketAttached',
    value: function onWebsocketAttached(data) {
      this.wfs.trigger(_events2.default.BUFFER_APPENDING, { type: 'video', data: data.payload, parent: 'main' });
    }
  }, {
    key: 'onFragParsingInitSegment',
    value: function onFragParsingInitSegment(data) {
      var tracks = data.tracks,
          trackName,
          track;

      track = tracks.video;
      if (track) {
        track.id = data.id;
      }

      for (trackName in tracks) {
        track = tracks[trackName];
        var initSegment = track.initSegment;
        if (initSegment) {
          this.pendingAppending++;
          this.wfs.trigger(_events2.default.BUFFER_APPENDING, { type: trackName, data: initSegment, parent: 'main' });
        }
      }
    }
  }, {
    key: 'onFragParsingData',
    value: function onFragParsingData(data) {
      var _this2 = this;

      if (data.type === 'video') {}

      [data.data1, data.data2].forEach(function (buffer) {
        if (buffer) {
          _this2.pendingAppending++;
          _this2.wfs.trigger(_events2.default.BUFFER_APPENDING, { type: data.type, data: buffer, parent: 'main' });
        }
      });
    }
  }]);

  return FlowController;
}(_eventHandler2.default);

exports.default = FlowController;
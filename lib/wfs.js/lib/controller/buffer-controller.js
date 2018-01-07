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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * Buffer Controller
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */

var BufferController = function (_EventHandler) {
  _inherits(BufferController, _EventHandler);

  function BufferController(wfs) {
    _classCallCheck(this, BufferController);

    var _this = _possibleConstructorReturn(this, (BufferController.__proto__ || Object.getPrototypeOf(BufferController)).call(this, wfs, _events2.default.MEDIA_ATTACHING, _events2.default.BUFFER_APPENDING, _events2.default.BUFFER_RESET));

    _this.mediaSource = null;
    _this.media = null;
    _this.pendingTracks = {};
    _this.sourceBuffer = {};
    _this.segments = [];

    _this.appended = 0;
    _this._msDuration = null;

    // Source Buffer listeners
    _this.onsbue = _this.onSBUpdateEnd.bind(_this);

    _this.browserType = 0;
    if (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
      _this.browserType = 1;
    }
    _this.mediaType = 'H264Raw';

    _this.websocketName = undefined;
    _this.channelName = undefined;
    return _this;
  }

  _createClass(BufferController, [{
    key: 'destroy',
    value: function destroy() {
      _eventHandler2.default.prototype.destroy.call(this);
    }
  }, {
    key: 'onMediaAttaching',
    value: function onMediaAttaching(data) {
      var media = this.media = data.media;
      this.mediaType = data.mediaType;
      this.websocketName = data.websocketName;
      this.channelName = data.channelName;
      if (media) {
        // setup the media source
        var ms = this.mediaSource = new MediaSource();
        //Media Source listeners
        this.onmso = this.onMediaSourceOpen.bind(this);
        this.onmse = this.onMediaSourceEnded.bind(this);
        this.onmsc = this.onMediaSourceClose.bind(this);
        ms.addEventListener('sourceopen', this.onmso);
        ms.addEventListener('sourceended', this.onmse);
        ms.addEventListener('sourceclose', this.onmsc);
        // link video and media Source
        media.src = URL.createObjectURL(ms);
      }
    }
  }, {
    key: 'onMediaDetaching',
    value: function onMediaDetaching() {}
  }, {
    key: 'onBufferAppending',
    value: function onBufferAppending(data) {
      if (!this.segments) {
        this.segments = [data];
      } else {
        this.segments.push(data);
      }
      this.doAppending();
    }
  }, {
    key: 'onMediaSourceClose',
    value: function onMediaSourceClose() {
      console.log('media source closed');
    }
  }, {
    key: 'onMediaSourceEnded',
    value: function onMediaSourceEnded() {
      console.log('media source ended');
    }
  }, {
    key: 'onSBUpdateEnd',
    value: function onSBUpdateEnd(event) {
      // Firefox
      if (this.browserType === 1) {
        this.mediaSource.endOfStream();
        this.media.play();
      }

      console.log("currentTime: " + this.media.currentTime);
      var buffered = this.sourceBuffer['video'].buffered;
      var played = this.media.played;
      for (var j = 0; j < played.length; j++) {
        console.log("played start: " + played.start(j));
        console.log("played end: " + played.end(j));
      }
      console.log("readystate: " + this.media.readyState);
      for (var i = 0; i < buffered.length; i++) {
        console.log("start: " + buffered.start(i));
        console.log("end: " + buffered.end(i));
        //this.media.currentTime = buffered.end(i); 
      }

      this.appending = false;
      this.doAppending();
      this.updateMediaElementDuration();
    }
  }, {
    key: 'updateMediaElementDuration',
    value: function updateMediaElementDuration() {}
  }, {
    key: 'onMediaSourceOpen',
    value: function onMediaSourceOpen() {
      var mediaSource = this.mediaSource;
      if (mediaSource) {
        // once received, don't listen anymore to sourceopen event
        mediaSource.removeEventListener('sourceopen', this.onmso);
      }

      if (this.mediaType === 'FMp4') {
        this.checkPendingTracks();
      }

      this.wfs.trigger(_events2.default.MEDIA_ATTACHED, { media: this.media, channelName: this.channelName, mediaType: this.mediaType, websocketName: this.websocketName });
    }
  }, {
    key: 'checkPendingTracks',
    value: function checkPendingTracks() {
      this.createSourceBuffers({ tracks: 'video', mimeType: '' });
      this.pendingTracks = {};
    }
  }, {
    key: 'onBufferReset',
    value: function onBufferReset(data) {
      if (this.mediaType === 'H264Raw') {
        this.createSourceBuffers({ tracks: 'video', mimeType: data.mimeType });
      }
    }
  }, {
    key: 'createSourceBuffers',
    value: function createSourceBuffers(tracks) {
      var sourceBuffer = this.sourceBuffer,
          mediaSource = this.mediaSource;
      var mimeType = void 0;
      if (tracks.mimeType === '') {
        mimeType = 'video/mp4;codecs=avc1.420028'; // avc1.42c01f avc1.42801e avc1.640028 avc1.420028
      } else {
        mimeType = 'video/mp4;codecs=' + tracks.mimeType;
      }

      try {
        var sb = sourceBuffer['video'] = mediaSource.addSourceBuffer(mimeType);
        sb.addEventListener('updateend', this.onsbue);
        track.buffer = sb;
      } catch (err) {}
      this.wfs.trigger(_events2.default.BUFFER_CREATED, { tracks: tracks });
      this.media.play();
    }
  }, {
    key: 'doAppending',
    value: function doAppending() {

      var wfs = this.wfs,
          sourceBuffer = this.sourceBuffer,
          segments = this.segments;
      if (Object.keys(sourceBuffer).length) {

        if (this.media.error) {
          this.segments = [];
          console.log('trying to append although a media error occured, flush segment and abort');
          return;
        }
        if (this.appending) {
          return;
        }

        if (segments && segments.length) {
          var segment = segments.shift();
          //console.log("segments len: " + segments.length + " segment len: " + segment.data.length);
          try {
            if (sourceBuffer[segment.type]) {
              this.parent = segment.parent;
              sourceBuffer[segment.type].appendBuffer(segment.data);
              this.appendError = 0;
              this.appended++;
              this.appending = true;
            } else {}
          } catch (err) {
            // in case any error occured while appending, put back segment in segments table 
            segments.unshift(segment);
            var event = { type: ErrorTypes.MEDIA_ERROR };
            if (err.code !== 22) {
              if (this.appendError) {
                this.appendError++;
              } else {
                this.appendError = 1;
              }
              event.details = ErrorDetails.BUFFER_APPEND_ERROR;
              event.frag = this.fragCurrent;
              if (this.appendError > wfs.config.appendErrorMaxRetry) {
                segments = [];
                event.fatal = true;
                return;
              } else {
                event.fatal = false;
              }
            } else {
              this.segments = [];
              event.details = ErrorDetails.BUFFER_FULL_ERROR;
              return;
            }
          }
        }
      }
    }
  }]);

  return BufferController;
}(_eventHandler2.default);

exports.default = BufferController;
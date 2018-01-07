'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _errors = require('../errors');

var _events = require('../events');

var _events2 = _interopRequireDefault(_events);

var _expGolomb = require('./exp-golomb');

var _expGolomb2 = _interopRequireDefault(_expGolomb);

var _eventHandler = require('../event-handler');

var _eventHandler2 = _interopRequireDefault(_eventHandler);

var _mp4Remuxer = require('../remux/mp4-remuxer');

var _mp4Remuxer2 = _interopRequireDefault(_mp4Remuxer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */


var h264Demuxer = function (_EventHandler) {
  _inherits(h264Demuxer, _EventHandler);

  function h264Demuxer(wfs) {
    var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    _classCallCheck(this, h264Demuxer);

    var _this = _possibleConstructorReturn(this, (h264Demuxer.__proto__ || Object.getPrototypeOf(h264Demuxer)).call(this, wfs, _events2.default.H264_DATA_PARSING));

    _this.config = _this.wfs.config || config;
    _this.wfs = wfs;
    _this.id = 'main';
    var typeSupported = {
      mp4: MediaSource.isTypeSupported('video/mp4') //,
      // mp2t : wfs.config.enableMP2TPassThrough && MediaSource.isTypeSupported('video/mp2t')
    };

    _this.remuxer = new _mp4Remuxer2.default(_this.wfs, _this.id, _this.config);
    _this.contiguous = true;
    _this.timeOffset = 1;
    _this.sn = 0;
    _this.TIMESCALE = 90000;
    _this.timestamp = 0;
    _this.scaleFactor = _this.TIMESCALE / 1000;
    _this.H264_TIMEBASE = 3000;
    _this._avcTrack = { container: 'video/mp4', type: 'video', id: 1, sequenceNumber: 0,
      //this._avcTrack = {container : 'video/mp4', type: 'video', id :1, sequenceNumber: 0,
      samples: [], len: 0, nbNalu: 0, dropped: 0, count: 0 };
    _this.browserType = 0;
    if (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
      _this.browserType = 1;
    }
    return _this;
  }

  _createClass(h264Demuxer, [{
    key: 'destroy',
    value: function destroy() {
      _eventHandler2.default.prototype.destroy.call(this);
    }
  }, {
    key: 'getTimestampM',
    value: function getTimestampM() {
      this.timestamp += this.H264_TIMEBASE;
      return this.timestamp;
    }
  }, {
    key: 'onH264DataParsing',
    value: function onH264DataParsing(event) {
      this._parseAVCTrack(event.data);
      if (this.browserType === 1) {
        // Firefox
        this.remuxer.pushVideo(0, this.sn, this._avcTrack, this.timeOffset, this.contiguous);
        this.sn += 1;
      } else {
        this.remuxer.pushVideo(0, this.sn, this._avcTrack, this.timeOffset, this.contiguous);
        this.sn += 1;
      }
    }
  }, {
    key: '_parseAVCTrack',
    value: function _parseAVCTrack(array) {
      var _this2 = this;

      var track = this._avcTrack,
          samples = track.samples,
          units = this._parseAVCNALu(array),
          units2 = [],
          debug = false,
          key = false,
          length = 0,
          expGolombDecoder,
          avcSample,
          push,
          i;
      var debugString = '';
      var pushAccesUnit = function () {
        if (units2.length) {
          if (!this.config.forceKeyFrameOnDiscontinuity || key === true || track.sps && (samples.length || this.contiguous)) {
            var tss = this.getTimestampM();
            avcSample = { units: { units: units2, length: length }, pts: tss, dts: tss, key: key };
            samples.push(avcSample);
            track.len += length;
            track.nbNalu += units2.length;
          } else {
            track.dropped++;
          }
          units2 = [];
          length = 0;
        }
      }.bind(this);

      units.forEach(function (unit) {
        switch (unit.type) {
          //NDR
          case 1:
            push = true;
            if (debug) {
              debugString += 'NDR ';
            }
            break;
          //IDR
          case 5:
            push = true;
            if (debug) {
              debugString += 'IDR ';
            }
            key = true;
            break;
          //SEI
          case 6:
            unit.data = _this2.discardEPB(unit.data);
            expGolombDecoder = new _expGolomb2.default(unit.data);
            // skip frameType
            expGolombDecoder.readUByte();
            break;
          //SPS
          case 7:
            push = false;
            if (debug) {
              debugString += 'SPS ';
            }
            if (!track.sps) {
              expGolombDecoder = new _expGolomb2.default(unit.data);
              var config = expGolombDecoder.readSPS();
              track.width = config.width;
              track.height = config.height;
              track.sps = [unit.data];
              track.duration = 0;
              var codecarray = unit.data.subarray(1, 4);
              var codecstring = 'avc1.';
              for (i = 0; i < 3; i++) {
                var h = codecarray[i].toString(16);
                if (h.length < 2) {
                  h = '0' + h;
                }
                codecstring += h;
              }
              track.codec = codecstring;
              _this2.wfs.trigger(_events2.default.BUFFER_RESET, { mimeType: track.codec });
              push = true;
            }
            break;
          //PPS
          case 8:
            push = false;
            if (debug) {
              debugString += 'PPS ';
            }
            if (!track.pps) {
              track.pps = [unit.data];
              push = true;
            }
            break;
          case 9:
            push = false;
            if (debug) {
              debugString += 'AUD ';
            }
            pushAccesUnit();
            break;
          default:
            push = false;
            debugString += 'unknown NAL ' + unit.type + ' ';
            break;
        }

        if (push) {
          units2.push(unit);
          length += unit.data.byteLength;
        }
      });

      if (debug || debugString.length) {
        logger.log(debugString);
      }

      pushAccesUnit();
    }
  }, {
    key: '_parseAVCNALu',
    value: function _parseAVCNALu(array) {
      var i = 0,
          len = array.byteLength,
          value,
          overflow,
          state = 0; //state = this.avcNaluState;
      var units = [],
          unit,
          unitType,
          lastUnitStart,
          lastUnitType;
      while (i < len) {
        value = array[i++];
        // finding 3 or 4-byte start codes (00 00 01 OR 00 00 00 01)
        switch (state) {
          case 0:
            if (value === 0) {
              state = 1;
            }
            break;
          case 1:
            if (value === 0) {
              state = 2;
            } else {
              state = 0;
            }
            break;
          case 2:
          case 3:
            if (value === 0) {
              state = 3;
            } else if (value === 1 && i < len) {
              unitType = array[i] & 0x1f;
              if (lastUnitStart) {
                unit = { data: array.subarray(lastUnitStart, i - state - 1), type: lastUnitType };
                units.push(unit);
              } else {}
              lastUnitStart = i;
              lastUnitType = unitType;
              state = 0;
            } else {
              state = 0;
            }
            break;
          default:
            break;
        }
      }

      if (lastUnitStart) {
        unit = { data: array.subarray(lastUnitStart, len), type: lastUnitType, state: state };
        units.push(unit);
      }

      return units;
    }

    /**
     * remove Emulation Prevention bytes from a RBSP
     */

  }, {
    key: 'discardEPB',
    value: function discardEPB(data) {
      var length = data.byteLength,
          EPBPositions = [],
          i = 1,
          newLength,
          newData;
      // Find all `Emulation Prevention Bytes`
      while (i < length - 2) {
        if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0x03) {
          EPBPositions.push(i + 2);
          i += 2;
        } else {
          i++;
        }
      }
      // If no Emulation Prevention Bytes were found just return the original
      // array
      if (EPBPositions.length === 0) {
        return data;
      }
      // Create a new array to hold the NAL unit data
      newLength = length - EPBPositions.length;
      newData = new Uint8Array(newLength);
      var sourceIndex = 0;

      for (i = 0; i < newLength; sourceIndex++, i++) {
        if (sourceIndex === EPBPositions[0]) {
          // Skip this byte
          sourceIndex++;
          // Remove this position index
          EPBPositions.shift();
        }
        newData[i] = data[sourceIndex];
      }
      return newData;
    }
  }]);

  return h264Demuxer;
}(_eventHandler2.default);

exports.default = h264Demuxer;
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * dummy remuxer
*/

var DummyRemuxer = function () {
  function DummyRemuxer(observer, id) {
    _classCallCheck(this, DummyRemuxer);

    this.observer = observer;
    this.id = id;
  }

  _createClass(DummyRemuxer, [{
    key: "destroy",
    value: function destroy() {}
  }, {
    key: "insertDiscontinuity",
    value: function insertDiscontinuity() {}
  }, {
    key: "remux",
    value: function remux(audioTrack, videoTrack, id3Track, textTrack, timeOffset) {
      this._remuxAACSamples(audioTrack, timeOffset);
      this._remuxAVCSamples(videoTrack, timeOffset);
      this._remuxID3Samples(id3Track, timeOffset);
      this._remuxTextSamples(textTrack, timeOffset);
    }
  }, {
    key: "_remuxAVCSamples",
    value: function _remuxAVCSamples(track, timeOffset) {
      var avcSample, unit;
      // loop through track.samples
      while (track.samples.length) {
        avcSample = track.samples.shift();
        // loop through AVC sample NALUs
        while (avcSample.units.units.length) {
          unit = avcSample.units.units.shift();
        }
      }
      //please lint
      timeOffset = timeOffset;
    }
  }, {
    key: "_remuxAACSamples",
    value: function _remuxAACSamples(track, timeOffset) {
      var aacSample, unit;
      // loop through track.samples
      while (track.samples.length) {
        aacSample = track.samples.shift();
        unit = aacSample.unit;
      }
      //please lint
      timeOffset = timeOffset;
    }
  }, {
    key: "_remuxID3Samples",
    value: function _remuxID3Samples(track, timeOffset) {
      var id3Sample, unit;
      // loop through track.samples
      while (track.samples.length) {
        id3Sample = track.samples.shift();
        unit = id3Sample.unit;
      }
      //please lint
      timeOffset = timeOffset;
    }
  }, {
    key: "_remuxTextSamples",
    value: function _remuxTextSamples(track, timeOffset) {
      var textSample, bytes;
      // loop through track.samples
      while (track.samples.length) {
        textSample = track.samples.shift();
        bytes = textSample.bytes;
      }
      //please lint
      timeOffset = timeOffset;
    }
  }, {
    key: "passthrough",
    get: function get() {
      return false;
    }
  }]);

  return DummyRemuxer;
}();

exports.default = DummyRemuxer;
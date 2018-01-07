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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                * File Loader
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */


var FileLoader = function (_EventHandler) {
  _inherits(FileLoader, _EventHandler);

  function FileLoader(wfs) {
    _classCallCheck(this, FileLoader);

    var _this = _possibleConstructorReturn(this, (FileLoader.__proto__ || Object.getPrototypeOf(FileLoader)).call(this, wfs, _events2.default.FRAG_LOADING, _events2.default.FILE_HEAD_LOADING, _events2.default.FILE_DATA_LOADING));

    _this.loaders = {};
    return _this;
  }

  _createClass(FileLoader, [{
    key: 'destroy',
    value: function destroy() {
      for (var loaderName in this.loaders) {
        var loader = this.loaders[loaderName];
        if (loader) {
          loader.destroy();
        }
      }
      this.loaders = {};
      _eventHandler2.default.prototype.destroy.call(this);
    }
  }, {
    key: 'onFileHeadLoading',
    value: function onFileHeadLoading(data) {
      var config = this.wfs.config;
      var loader = new config.loader(config);
      var loaderContext = void 0,
          loaderConfig = void 0,
          loaderCallbacks = void 0;
      loaderContext = { url: config.fmp4FileUrl };
      loaderConfig = { maxRetry: 0, retryDelay: 0 };
      loaderCallbacks = { onSuccess: this.fileloadheadsuccess.bind(this) };
      loader.loadHead(loaderContext, loaderConfig, loaderCallbacks);
    }
  }, {
    key: 'fileloadheadsuccess',
    value: function fileloadheadsuccess(response) {
      this.wfs.trigger(_events2.default.FILE_HEAD_LOADED, { size: response });
    }
  }, {
    key: 'onFileDataLoading',
    value: function onFileDataLoading(data) {
      var config = this.wfs.config;
      var loader = new config.loader(config);
      var loaderContext = void 0,
          loaderConfig = void 0,
          loaderCallbacks = void 0;
      loaderContext = { url: config.fmp4FileUrl, responseType: 'arraybuffer', progressData: false };
      var start = data.fileStart,
          end = data.fileEnd;
      if (!isNaN(start) && !isNaN(end)) {
        loaderContext.rangeStart = start;
        loaderContext.rangeEnd = end;
      }
      loaderConfig = { timeout: config.fragLoadingTimeOut, maxRetry: 0, retryDelay: 0, maxRetryDelay: config.fragLoadingMaxRetryTimeout };
      loaderCallbacks = { onSuccess: this.fileloaddatasuccess.bind(this) };
      loader.load(loaderContext, loaderConfig, loaderCallbacks);
    }
  }, {
    key: 'fileloaddatasuccess',
    value: function fileloaddatasuccess(response, stats, context) {
      this.wfs.trigger(_events2.default.FILE_DATA_LOADED, { payload: response.data, stats: stats });
    }
  }, {
    key: 'loaderror',
    value: function loaderror(response, context) {
      var loader = context.loader;
      if (loader) {
        loader.abort();
      }
      this.loaders[context.type] = undefined;
    }
  }, {
    key: 'loadtimeout',
    value: function loadtimeout(stats, context) {
      var loader = context.loader;
      if (loader) {
        loader.abort();
      }
      this.loaders[context.type] = undefined;
    }
  }, {
    key: 'loadprogress',
    value: function loadprogress(stats, context, data) {
      var frag = context.frag;
      frag.loaded = stats.loaded;
    }
  }]);

  return FileLoader;
}(_eventHandler2.default);

exports.default = FileLoader;
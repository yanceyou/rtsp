'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * XHR based logger
*/

var XhrLoader = function () {
  function XhrLoader(config) {
    _classCallCheck(this, XhrLoader);

    if (config && config.xhrSetup) {
      this.xhrSetup = config.xhrSetup;
    }
  }

  _createClass(XhrLoader, [{
    key: 'destroy',
    value: function destroy() {
      this.abort();
      this.loader = null;
    }
  }, {
    key: 'abort',
    value: function abort() {
      var loader = this.loader;
      if (loader && loader.readyState !== 4) {
        this.stats.aborted = true;
        loader.abort();
      }

      window.clearTimeout(this.requestTimeout);
      this.requestTimeout = null;
      window.clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }, {
    key: 'loadHead',
    value: function loadHead(context, config, callbacks) {
      this.context = context;
      this.config = config;
      this.callbacks = callbacks;
      this.stats = { trequest: performance.now(), retry: 0 };
      this.retryDelay = config.retryDelay;
      var xhr = new XMLHttpRequest();
      xhr.open('head', context.url);
      xhr.onload = function () {
        callbacks.onSuccess(xhr.getResponseHeader('content-length'));
      };
      xhr.send();
    }
  }, {
    key: 'load',
    value: function load(context, config, callbacks) {
      this.context = context;
      this.config = config;
      this.callbacks = callbacks;
      this.stats = { trequest: performance.now(), retry: 0 };
      this.retryDelay = config.retryDelay;
      this.loadInternal();
    }
  }, {
    key: 'loadInternal',
    value: function loadInternal() {
      var xhr,
          context = this.context;
      if (typeof XDomainRequest !== 'undefined') {
        xhr = this.loader = new XDomainRequest();
      } else {
        xhr = this.loader = new XMLHttpRequest();
      }
      xhr.onloadend = this.loadend.bind(this);
      xhr.onprogress = this.loadprogress.bind(this);
      xhr.open('GET', context.url, true);
      if (context.rangeEnd) {
        xhr.setRequestHeader('Range', 'bytes=' + context.rangeStart + '-' + (context.rangeEnd - 1));
      }
      xhr.responseType = context.responseType;
      var stats = this.stats;
      stats.tfirst = 0;
      stats.loaded = 0;
      if (this.xhrSetup) {
        this.xhrSetup(xhr, context.url);
      }
      // setup timeout before we perform request
      this.requestTimeout = window.setTimeout(this.loadtimeout.bind(this), this.config.timeout);
      xhr.send();
    }
  }, {
    key: 'loadend',
    value: function loadend(event) {
      var xhr = event.currentTarget,
          status = xhr.status,
          stats = this.stats,
          context = this.context,
          config = this.config;
      // don't proceed if xhr has been aborted
      if (stats.aborted) {
        return;
      }
      // in any case clear the current xhrs timeout
      window.clearTimeout(this.requestTimeout);

      // http status between 200 to 299 are all successful
      if (status >= 200 && status < 300) {
        stats.tload = Math.max(stats.tfirst, performance.now());
        var data = void 0,
            len = void 0;
        if (context.responseType === 'arraybuffer') {
          data = xhr.response;
          len = data.byteLength;
        } else {
          data = xhr.responseText;
          len = data.length;
        }
        stats.loaded = stats.total = len;
        var response = { url: xhr.responseURL, data: data };
        this.callbacks.onSuccess(response, stats, context);
      } else {
        // if max nb of retries reached or if http status between 400 and 499 (such error cannot be recovered, retrying is useless), return error
        if (stats.retry >= config.maxRetry || status >= 400 && status < 499) {
          //  logger.error(`${status} while loading ${context.url}` );
          this.callbacks.onError({ code: status, text: xhr.statusText }, context);
        } else {
          // retry
          //  logger.warn(`${status} while loading ${context.url}, retrying in ${this.retryDelay}...`);
          // aborts and resets internal state
          this.destroy();
          // schedule retry
          this.retryTimeout = window.setTimeout(this.loadInternal.bind(this), this.retryDelay);
          // set exponential backoff
          this.retryDelay = Math.min(2 * this.retryDelay, config.maxRetryDelay);
          stats.retry++;
        }
      }
    }
  }, {
    key: 'loadtimeout',
    value: function loadtimeout() {
      //  logger.warn(`timeout while loading ${this.context.url}` );
      this.callbacks.onTimeout(this.stats, this.context);
    }
  }, {
    key: 'loadprogress',
    value: function loadprogress(event) {
      var stats = this.stats;
      if (stats.tfirst === 0) {
        stats.tfirst = Math.max(performance.now(), stats.trequest);
      }
      stats.loaded = event.loaded;
      if (event.lengthComputable) {
        stats.total = event.total;
      }
      var onProgress = this.callbacks.onProgress;
      if (onProgress) {
        // last args is to provide on progress data
        onProgress(stats, this.context, null);
      }
    }
  }]);

  return XhrLoader;
}();

exports.default = XhrLoader;
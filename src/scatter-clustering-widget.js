(function () {
  'use strict';

  var ECHARTS_CDN = 'https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js';
  var ECSTAT_CDN  = 'https://cdn.jsdelivr.net/npm/echarts-stat@1/dist/ecStat.min.js';

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve(); return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Konnte nicht laden: ' + src)); };
      document.head.appendChild(s);
    });
  }

  var _libsReady = loadScript(ECHARTS_CDN).then(function () {
    return loadScript(ECSTAT_CDN);
  });

  var tmpl = document.createElement('template');
  tmpl.innerHTML = '<div style="width:100%;height:100%;position:relative;">'
    + '<div class="chart-root" style="width:100%;height:100%;"></div>'
    + '<div class="error-msg" style="display:none;position:absolute;top:50%;left:50%;'
    + 'transform:translate(-50%,-50%);text-align:center;color:#999;font-size:14px;'
    + 'font-family:sans-serif;padding:20px;"></div>'
    + '</div>';

  class ScatterClusteringWidget extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(tmpl.content.cloneNode(true));
      this._chartRoot = this.shadowRoot.querySelector('.chart-root');
      this._errorMsg  = this.shadowRoot.querySelector('.error-msg');
      this._chart     = null;
      this._dataBinding = null;
      this._props     = { clusterCount: 5, xAxisLabel: '', yAxisLabel: '', opacity: 0.6 };

      _libsReady.then(function () {
        this._chart = window.echarts.init(this._chartRoot, null, { renderer: 'canvas' });
        this._resizeObserver = new ResizeObserver(function () {
          if (this._chart) this._chart.resize();
        }.bind(this));
        this._resizeObserver.observe(this._chartRoot);
        if (this._dataBinding) this._render();
      }.bind(this)).catch(function (err) {
        this._showError('Bibliotheken konnten nicht geladen werden: ' + err.message);
      }.bind(this));
    }

    disconnectedCallback() {
      if (this._resizeObserver) this._resizeObserver.disconnect();
      if (this._chart) { this._chart.dispose(); this._chart = null; }
    }

    _showError(msg) {
      this._errorMsg.textContent = msg;
      this._errorMsg.style.display = 'block';
    }

    _hideError() {
      this._errorMsg.style.display = 'none';
    }

    _extractPoints(dataBinding) {
      if (!dataBinding || !dataBinding.data || dataBinding.data.length === 0) return [];
      return dataBinding.data.map(function (row) {
        return {
          label: String(row.label || ''),
          x:     Number(row.x)    || 0,
          y:     Number(row.y)    || 0,
          size:  Number(row.size) || 0,
        };
      });
    }

    _render() {
      // wird in Task 5 implementiert
    }

    onCustomWidgetBeforeUpdate(changedProps) {
      Object.assign(this._props, changedProps);
    }

    onCustomWidgetAfterUpdate(dataBinding) {
      this._dataBinding = dataBinding;
      if (this._chart) this._render();
    }

    onCustomWidgetResize() {
      if (this._chart) this._chart.resize();
    }

    refresh() {
      if (this._chart) this._render();
    }
  }

  customElements.define('com-custom-scatterclustering', ScatterClusteringWidget);
}());

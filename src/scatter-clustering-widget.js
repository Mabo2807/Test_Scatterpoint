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

  function scaleSize(value, minVal, maxVal, minPx, maxPx) {
    if (maxVal === minVal) return (minPx + maxPx) / 2;
    return minPx + ((value - minVal) / (maxVal - minVal)) * (maxPx - minPx);
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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
          size:  Math.max(0, Number(row.size) || 0),
        };
      });
    }

    _render() {
      var points = this._extractPoints(this._dataBinding);

      if (points.length === 0) {
        this._showError('Keine Daten verfügbar');
        return;
      }

      if (!window.ecStat || !window.echarts) {
        this._showError('Bibliotheken nicht verfügbar');
        return;
      }

      this._hideError();

      var clusterCount = Math.min(this._props.clusterCount || 5, points.length);
      var opacity      = Number(this._props.opacity) || 0.6;
      var xLabel       = this._props.xAxisLabel || '';
      var yLabel       = this._props.yAxisLabel || '';

      var xyData = points.map(function (p) { return [p.x, p.y]; });

      var result = window.ecStat.clustering.hierarchicalKMeans(xyData, {
        clusterCount: clusterCount,
        stepByStep:   false,
      });

      var clusters = [];
      for (var c = 0; c < clusterCount; c++) { clusters.push([]); }
      points.forEach(function (p, i) {
        var cid = result.clusterAssment[i][0];
        clusters[cid].push(p);
      });

      var allSizes = points.map(function (p) { return p.size; });
      var minSize  = Math.min.apply(null, allSizes);
      var maxSize  = Math.max.apply(null, allSizes);

      var colors = ['#5470c6','#ee6666','#91cc75','#fac858','#9b59b6',
                    '#3ba272','#fc8452','#73c0de','#ea7ccc','#d14a61'];

      var series = clusters.map(function (clusterPoints, ci) {
        return {
          name: 'Cluster ' + (ci + 1),
          type: 'scatter',
          data: clusterPoints.map(function (p) {
            return {
              value:      [p.x, p.y],
              symbolSize: scaleSize(p.size, minSize, maxSize, 18, 60),
              itemStyle:  { color: colors[ci % colors.length], opacity: opacity },
              label_data: p,
            };
          }),
        };
      });

      this._chart.setOption({
        backgroundColor: '#ffffff',
        legend: {
          top: 8,
          data: series.map(function (s) { return s.name; }),
          textStyle: { color: '#555' },
        },
        grid: { left: 60, right: 20, top: 50, bottom: 50 },
        xAxis: {
          type: 'value',
          name: xLabel,
          nameLocation: 'middle',
          nameGap: 30,
          nameTextStyle: { color: '#555', fontSize: 11 },
          axisLine:  { lineStyle: { color: '#ddd' } },
          splitLine: { lineStyle: { color: '#f0f0f0' } },
          axisLabel: { color: '#999', fontSize: 10 },
        },
        yAxis: {
          type: 'value',
          name: yLabel,
          nameLocation: 'middle',
          nameGap: 45,
          nameTextStyle: { color: '#555', fontSize: 11 },
          axisLine:  { lineStyle: { color: '#ddd' } },
          splitLine: { lineStyle: { color: '#f0f0f0' } },
          axisLabel: { color: '#999', fontSize: 10 },
        },
        tooltip: {
          trigger: 'item',
          formatter: function (params) {
            var d = params.data.label_data;
            return '<b>' + escHtml(d.label) + '</b><br/>'
              + escHtml(xLabel || 'X') + ': ' + d.x.toLocaleString('de-DE') + '<br/>'
              + escHtml(yLabel || 'Y') + ': ' + d.y.toLocaleString('de-DE') + '<br/>'
              + 'Größe: ' + d.size.toLocaleString('de-DE');
          },
        },
        series: series,
      }, true);

      this._chart.off('click');
      this._chart.on('click', function (params) {
        if (!params.data || !params.data.label_data) return;
        var d = params.data.label_data;
        this.dispatchEvent(new CustomEvent('onPointClick', {
          bubbles: true,
          detail: { label: d.label, x: d.x, y: d.y, size: d.size },
        }));
      }.bind(this));
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

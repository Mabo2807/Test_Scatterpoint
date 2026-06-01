# Scatter Clustering Widget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Einen SAP Analytics Cloud Custom Widget bauen, der Datenpunkte aus SAC als Bubble Chart darstellt und automatisch per K-Means (echarts-stat) in Cluster einteilt.

**Architecture:** Ein einzelnes Web Component (`scatter-clustering-widget.js`) lädt ECharts und echarts-stat dynamisch per CDN, empfängt vier SAC-Feeds (Label, X, Y, Size), führt K-Means-Clustering durch und rendert das Ergebnis. Das SAC-Manifest (`scatter-clustering.json`) registriert Properties, Methods, Events und Data Bindings.

**Tech Stack:** ECharts 5 (CDN), echarts-stat 1 (CDN), Vanilla JS Web Components, SAC Custom Widget API

---

## Dateistruktur

| Datei | Verantwortlichkeit |
|---|---|
| `scatter-clustering.json` | SAC Manifest: Widget-Metadaten, Properties, Methods, Events, Data Bindings |
| `src/scatter-clustering-widget.js` | Web Component: CDN-Loader, SAC-Hooks, K-Means, ECharts-Render, Fehlerbehandlung |
| `test/index.html` | Standalone-Testpage mit Beispieldaten (ohne SAC-Verbindung) |

---

## Task 1: Projektstruktur anlegen

**Files:**
- Create: `scatter-clustering.json`
- Create: `src/scatter-clustering-widget.js` (leeres Gerüst)
- Create: `test/index.html` (leeres Gerüst)
- Create: `.gitignore`

- [ ] **Schritt 1: Ordnerstruktur anlegen**

```bash
cd C:\Users\P10100739\Development\SAPDevelopSAC\Test_Scatterpoint
mkdir src
mkdir test
```

- [ ] **Schritt 2: `.gitignore` anlegen**

Inhalt von `.gitignore`:
```
.superpowers/
node_modules/
```

- [ ] **Schritt 3: Leeres Widget-JS anlegen**

Inhalt von `src/scatter-clustering-widget.js`:
```js
(function () {
  'use strict';
  // TODO: implementiert in folgenden Tasks
})();
```

- [ ] **Schritt 4: Leere Testpage anlegen**

Inhalt von `test/index.html`:
```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Scatter Clustering – Test</title>
  <style>body{margin:0;padding:16px;font-family:sans-serif;background:#f5f5f5;}</style>
</head>
<body>
  <h2>Scatter Clustering Widget – Lokaler Test</h2>
  <div id="widget-container" style="width:700px;height:450px;background:#fff;border:1px solid #ddd;">
    <!-- Widget wird hier eingebunden -->
  </div>
  <script src="../src/scatter-clustering-widget.js"></script>
</body>
</html>
```

- [ ] **Schritt 5: Commit**

```bash
git add .gitignore src/scatter-clustering-widget.js test/index.html
git commit -m "chore: project scaffold"
```

---

## Task 2: SAC Manifest erstellen

**Files:**
- Create: `scatter-clustering.json`

- [ ] **Schritt 1: Manifest anlegen**

Inhalt von `scatter-clustering.json`:
```json
{
  "id": "com.custom.scatterclustering",
  "version": "1.0.0",
  "name": "ScatterClustering",
  "description": "Bubble Chart mit automatischem K-Means Clustering fuer SAP Analytics Cloud",
  "newInstancePrefix": "ScatterClustering",
  "vendor": "",
  "icon": "",
  "webcomponents": [
    {
      "kind": "main",
      "tag": "com-custom-scatterclustering",
      "url": "http://localhost:8080/src/scatter-clustering-widget.js",
      "integrity": "",
      "ignoreIntegrity": true
    }
  ],
  "properties": {
    "clusterCount": {
      "type": "integer",
      "description": "Anzahl der K-Means Cluster",
      "default": 5
    },
    "xAxisLabel": {
      "type": "string",
      "description": "Beschriftung der X-Achse",
      "default": ""
    },
    "yAxisLabel": {
      "type": "string",
      "description": "Beschriftung der Y-Achse",
      "default": ""
    },
    "opacity": {
      "type": "number",
      "description": "Bubble-Transparenz (0.1 bis 1.0)",
      "default": 0.6
    }
  },
  "methods": {
    "refresh": {
      "description": "Daten neu laden und Chart neu rendern"
    }
  },
  "events": {
    "onPointClick": {
      "description": "Gefeuert wenn ein Datenpunkt angeklickt wird"
    }
  },
  "dataBindings": {
    "dataBinding": {
      "feeds": [
        {
          "id": "labelDimension",
          "description": "Label der Datenpunkte (z.B. Kunde, Region, Produkt)",
          "type": "dimension"
        },
        {
          "id": "measureX",
          "description": "X-Achse (z.B. Umsatz AJ)",
          "type": "mainStructureMember"
        },
        {
          "id": "measureY",
          "description": "Y-Achse (z.B. DB AJ)",
          "type": "mainStructureMember"
        },
        {
          "id": "measureSize",
          "description": "Bubble-Groesse (z.B. Anzahl Bestellungen)",
          "type": "mainStructureMember"
        }
      ]
    }
  }
}
```

- [ ] **Schritt 2: Manifest in SAC testweise importieren**

In SAC: Menü → Analytic Applications → Custom Widgets → Upload `.json` → prüfen ob Widget ohne Fehler erscheint (Daten-Binding noch leer, das ist OK).

- [ ] **Schritt 3: Commit**

```bash
git add scatter-clustering.json
git commit -m "feat: add SAC manifest"
```

---

## Task 3: Web Component Grundgerüst + CDN-Loader

**Files:**
- Modify: `src/scatter-clustering-widget.js`

Das Widget muss ECharts und echarts-stat per CDN laden, bevor es rendern kann. Beide Bibliotheken werden einmalig als `<script>`-Tags in den Document-Head injiziert.

- [ ] **Schritt 1: Testpage erweitern — prüft ob CDN-Skripte laden**

Ergänze in `test/index.html` vor dem schließenden `</body>`:
```html
<script>
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (window.echarts && window.ecStat) {
        document.body.insertAdjacentHTML('beforeend',
          '<p style="color:green">✓ ECharts und echarts-stat geladen</p>');
      } else {
        document.body.insertAdjacentHTML('beforeend',
          '<p style="color:red">✗ Bibliotheken nicht geladen</p>');
      }
    }, 2000);
  });
</script>
```

Testpage im Browser öffnen → erwarte roten Fehler (Widget lädt noch nichts).

- [ ] **Schritt 2: CDN-Loader implementieren**

Ersetze den Inhalt von `src/scatter-clustering-widget.js`:
```js
(function () {
  'use strict';

  const ECHARTS_CDN = 'https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js';
  const ECSTAT_CDN  = 'https://cdn.jsdelivr.net/npm/echarts-stat@1/dist/ecStat.min.js';

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
  tmpl.innerHTML = '<div style="width:100%;height:100%;position:relative;"><div class="chart-root" style="width:100%;height:100%;"></div><div class="error-msg" style="display:none;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#999;font-size:14px;font-family:sans-serif;"></div></div>';

  class ScatterClusteringWidget extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(tmpl.content.cloneNode(true));
      this._chartRoot = this.shadowRoot.querySelector('.chart-root');
      this._errorMsg  = this.shadowRoot.querySelector('.error-msg');
      this._chart = null;
      this._data  = null;
      this._props = { clusterCount: 5, xAxisLabel: '', yAxisLabel: '', opacity: 0.6 };

      _libsReady.then(function () {
        this._chart = window.echarts.init(this._chartRoot, null, { renderer: 'canvas' });
        if (this._data) this._render();
      }.bind(this)).catch(function (err) {
        this._showError('Bibliotheken konnten nicht geladen werden: ' + err.message);
      }.bind(this));
    }

    _showError(msg) {
      this._errorMsg.textContent = msg;
      this._errorMsg.style.display = 'block';
    }

    _hideError() {
      this._errorMsg.style.display = 'none';
    }

    _render() {
      // wird in Task 5 implementiert
    }

    onCustomWidgetBeforeUpdate(changedProps) {
      Object.assign(this._props, changedProps);
    }

    onCustomWidgetAfterUpdate() {
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
```

- [ ] **Schritt 3: Testpage im Browser öffnen**

`test/index.html` im Browser öffnen (Datei direkt, kein Server nötig). Nach 2 Sekunden muss die grüne Meldung erscheinen: `✓ ECharts und echarts-stat geladen`.

- [ ] **Schritt 4: Commit**

```bash
git add src/scatter-clustering-widget.js test/index.html
git commit -m "feat: web component shell with CDN loader"
```

---

## Task 4: SAC Data Binding & Datentransformation

**Files:**
- Modify: `src/scatter-clustering-widget.js`
- Modify: `test/index.html`

SAC übergibt Daten über `dataBinding`. Die Methode `onCustomWidgetAfterUpdate` erhält ein `dataBinding`-Objekt. Aus diesem werden Zeilen extrahiert und in das interne Format `{ label, x, y, size }` umgewandelt.

- [ ] **Schritt 1: Testpage mit simulierten SAC-Daten erweitern**

Füge in `test/index.html` nach dem `<script src=...>` ein:
```html
<script>
  window.addEventListener('load', function () {
    setTimeout(function () {
      var widget = document.querySelector('com-custom-scatterclustering');
      if (!widget) return;

      // Simuliert SAC dataBinding-Objekt
      var mockDataBinding = {
        data: [
          { label: 'Kunde A', x: 12000000, y: 2500000, size: 340 },
          { label: 'Kunde B', x: 8000000,  y: 1800000, size: 210 },
          { label: 'Kunde C', x: 45000000, y: 11000000, size: 890 },
          { label: 'Kunde D', x: 50000000, y: 12500000, size: 1100 },
          { label: 'Kunde E', x: 78000000, y: 15500000, size: 1500 },
          { label: 'Kunde F', x: 5000000,  y: 800000,  size: 120 },
          { label: 'Kunde G', x: 38000000, y: 9000000, size: 700 },
          { label: 'Kunde H', x: 22000000, y: 4000000, size: 450 },
        ]
      };

      widget.onCustomWidgetBeforeUpdate({ clusterCount: 3 });
      widget._dataBinding = mockDataBinding;
      widget.onCustomWidgetAfterUpdate(mockDataBinding);
    }, 1500);
  });
</script>
```

Testpage öffnen → Widget zeigt noch nichts (render ist leer), aber keine JS-Fehler in der Konsole.

- [ ] **Schritt 2: Datentransformation implementieren**

Füge in der Klasse `ScatterClusteringWidget` folgende Methode ein (vor `_render`):

```js
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
```

Ändere `onCustomWidgetAfterUpdate` zu:
```js
onCustomWidgetAfterUpdate(dataBinding) {
  this._dataBinding = dataBinding;
  if (this._chart) this._render();
}
```

- [ ] **Schritt 3: Sicherstellen dass Transformation keine Fehler wirft**

In `test/index.html` Konsole öffnen (F12) und prüfen: Kein Fehler beim `onCustomWidgetAfterUpdate`-Aufruf.

- [ ] **Schritt 4: Commit**

```bash
git add src/scatter-clustering-widget.js test/index.html
git commit -m "feat: SAC data binding extraction"
```

---

## Task 5: K-Means Clustering + ECharts Render

**Files:**
- Modify: `src/scatter-clustering-widget.js`

Das ist der Kern des Widgets. K-Means via `ecStat.clustering.hierarchicalKMeans()` teilt die Punkte in Gruppen ein; ECharts rendert je Cluster eine eigene `scatter`-Series.

- [ ] **Schritt 1: Hilfsfunktion für Bubble-Größen-Skalierung hinzufügen**

Füge vor der Klassendefinition ein:
```js
function scaleSize(value, minVal, maxVal, minPx, maxPx) {
  if (maxVal === minVal) return (minPx + maxPx) / 2;
  return minPx + ((value - minVal) / (maxVal - minVal)) * (maxPx - minPx);
}
```

- [ ] **Schritt 2: `_render`-Methode implementieren**

Ersetze die leere `_render`-Methode durch:
```js
_render() {
  var points = this._extractPoints(this._dataBinding);

  if (points.length === 0) {
    this._showError('Keine Daten verfügbar');
    return;
  }
  this._hideError();

  var clusterCount = Math.min(this._props.clusterCount || 5, points.length);
  var opacity      = Number(this._props.opacity) || 0.6;
  var xLabel       = this._props.xAxisLabel || '';
  var yLabel       = this._props.yAxisLabel || '';

  // K-Means Input: [[x, y], ...]
  var xyData = points.map(function (p) { return [p.x, p.y]; });

  var result = window.ecStat.clustering.hierarchicalKMeans(xyData, {
    clusterCount: clusterCount,
    stepByStep:   false,
  });
  // result.clusterAssment[i] = [clusterId, distanceToCenter]

  // Punkte nach Cluster gruppieren
  var clusters = [];
  for (var c = 0; c < clusterCount; c++) { clusters.push([]); }
  points.forEach(function (p, i) {
    var cid = result.clusterAssment[i][0];
    clusters[cid].push(p);
  });

  // Bubble-Größen skalieren (min/max über alle Punkte)
  var allSizes = points.map(function (p) { return p.size; });
  var minSize  = Math.min.apply(null, allSizes);
  var maxSize  = Math.max.apply(null, allSizes);

  // ECharts Farben
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
        return '<b>' + d.label + '</b><br/>'
          + (xLabel || 'X') + ': ' + d.x.toLocaleString('de-DE') + '<br/>'
          + (yLabel || 'Y') + ': ' + d.y.toLocaleString('de-DE') + '<br/>'
          + 'Größe: ' + d.size.toLocaleString('de-DE');
      },
    },
    series: series,
  }, true);
}
```

- [ ] **Schritt 3: Testpage im Browser öffnen**

`test/index.html` öffnen. Nach ~1,5 Sekunden muss der Bubble Chart mit 3 farbigen Cluster-Gruppen erscheinen. Hover über einen Bubble → Tooltip mit Label + Werten.

- [ ] **Schritt 4: Commit**

```bash
git add src/scatter-clustering-widget.js
git commit -m "feat: K-Means clustering + ECharts bubble render"
```

---

## Task 6: Properties aus Builder Panel korrekt anwenden

**Files:**
- Modify: `src/scatter-clustering-widget.js`
- Modify: `test/index.html`

Properties (`clusterCount`, `xAxisLabel`, `yAxisLabel`, `opacity`) werden in SAC über den Builder Panel gesetzt. Lokal testen wir sie manuell.

- [ ] **Schritt 1: Testpage um Property-Test erweitern**

Füge in `test/index.html` nach dem bestehenden `<script>`-Block ein:
```html
<button onclick="testProps()" style="margin-top:12px">Test: 5 Cluster + Achsenlabels</button>
<script>
  function testProps() {
    var widget = document.querySelector('com-custom-scatterclustering');
    widget.onCustomWidgetBeforeUpdate({
      clusterCount: 5,
      xAxisLabel:   'Umsatz AJ',
      yAxisLabel:   'DB AJ',
      opacity:      0.55,
    });
    widget.onCustomWidgetAfterUpdate(widget._dataBinding);
  }
</script>
```

Button klicken → erwarte 5 Cluster, Achsenbeschriftungen "Umsatz AJ" / "DB AJ", etwas transparentere Bubbles.

- [ ] **Schritt 2: Sicherstellen dass Default-Props greifen wenn nichts gesetzt**

`onCustomWidgetBeforeUpdate({})` aufrufen → Chart rendert weiterhin mit Defaults (5 Cluster, opacity 0.6, keine Achslabels).

- [ ] **Schritt 3: Commit**

```bash
git add src/scatter-clustering-widget.js test/index.html
git commit -m "feat: builder panel properties wired up"
```

---

## Task 7: Fehlerbehandlung

**Files:**
- Modify: `src/scatter-clustering-widget.js`
- Modify: `test/index.html`

- [ ] **Schritt 1: Test für leere Daten**

Füge in `test/index.html` einen Button ein:
```html
<button onclick="testEmpty()" style="margin-top:8px">Test: Leere Daten</button>
<script>
  function testEmpty() {
    var widget = document.querySelector('com-custom-scatterclustering');
    widget._dataBinding = { data: [] };
    widget.onCustomWidgetAfterUpdate({ data: [] });
  }
</script>
```

Button klicken → erwarte zentrierten Text "Keine Daten verfügbar" im Widget.

- [ ] **Schritt 2: Test für clusterCount > Datenpunktanzahl**

```html
<button onclick="testFewPoints()" style="margin-top:8px">Test: 2 Punkte, 5 Cluster</button>
<script>
  function testFewPoints() {
    var widget = document.querySelector('com-custom-scatterclustering');
    widget.onCustomWidgetBeforeUpdate({ clusterCount: 5 });
    widget._dataBinding = { data: [
      { label: 'A', x: 100, y: 200, size: 10 },
      { label: 'B', x: 300, y: 400, size: 20 },
    ]};
    widget.onCustomWidgetAfterUpdate(widget._dataBinding);
  }
</script>
```

Button klicken → kein JS-Fehler, Chart zeigt 2 Cluster (clusterCount wird auf Datenpunktanzahl reduziert — das macht `Math.min` in `_render` bereits).

- [ ] **Schritt 3: Fehlertext-Styling im Shadow DOM sicherstellen**

Prüfe in der Browser-Konsole dass der Fehlertext korrekt zentriert erscheint. Wenn nicht, passe den `error-msg`-Style im Template an:
```js
// In tmpl.innerHTML den style für .error-msg auf:
'text-align:center;color:#999;font-size:14px;font-family:sans-serif;padding:20px;'
```

- [ ] **Schritt 4: Commit**

```bash
git add src/scatter-clustering-widget.js test/index.html
git commit -m "feat: error handling for empty data and cluster edge cases"
```

---

## Task 8: onPointClick Event

**Files:**
- Modify: `src/scatter-clustering-widget.js`
- Modify: `test/index.html`

- [ ] **Schritt 1: Test für Click-Event**

Füge in `test/index.html` ein:
```html
<div id="click-log" style="margin-top:12px;font-size:13px;color:#333;"></div>
<script>
  document.addEventListener('onPointClick', function (e) {
    document.getElementById('click-log').textContent =
      'Geklickt: ' + JSON.stringify(e.detail);
  });
</script>
```

Auf einen Bubble klicken → erwarte noch keine Ausgabe (Event noch nicht implementiert).

- [ ] **Schritt 2: Click-Handler in `_render` registrieren**

Füge am Ende der `_render`-Methode (nach `this._chart.setOption(...)`) ein:
```js
this._chart.off('click');
this._chart.on('click', function (params) {
  if (!params.data || !params.data.label_data) return;
  var d = params.data.label_data;
  this.dispatchEvent(new CustomEvent('onPointClick', {
    bubbles: true,
    detail: { label: d.label, x: d.x, y: d.y, size: d.size },
  }));
}.bind(this));
```

- [ ] **Schritt 3: Click testen**

Testpage neu laden, auf Bubble klicken → `#click-log` zeigt `Geklickt: {"label":"Kunde A","x":12000000,...}`.

- [ ] **Schritt 4: Commit**

```bash
git add src/scatter-clustering-widget.js test/index.html
git commit -m "feat: onPointClick event dispatch"
```

---

## Task 9: ResizeObserver + `refresh`-Methode

**Files:**
- Modify: `src/scatter-clustering-widget.js`
- Modify: `test/index.html`

- [ ] **Schritt 1: ResizeObserver in `connectedCallback` verdrahten**

Füge am Ende der `.then`-Callback in `connectedCallback` (nach `this._chart = ...`) ein:
```js
this._resizeObserver = new ResizeObserver(function () {
  if (this._chart) this._chart.resize();
}.bind(this));
this._resizeObserver.observe(this._chartRoot);
```

- [ ] **Schritt 2: ResizeObserver in `disconnectedCallback` stoppen**

Füge in der Klasse ein:
```js
disconnectedCallback() {
  if (this._resizeObserver) this._resizeObserver.disconnect();
  if (this._chart) { this._chart.dispose(); this._chart = null; }
}
```

- [ ] **Schritt 3: `refresh`-Methode sicherstellen**

Die Methode existiert bereits:
```js
refresh() {
  if (this._chart) this._render();
}
```
Prüfen: Button in Testpage anklicken → Chart neu gerendert, keine Fehler.

- [ ] **Schritt 4: Resize manuell testen**

Browser-DevTools → Responsive Mode → Widget-Container-Breite ändern → Chart passt sich an.

- [ ] **Schritt 5: Commit**

```bash
git add src/scatter-clustering-widget.js
git commit -m "feat: ResizeObserver and disconnectedCallback cleanup"
```

---

## Task 10: Finaler Integrationstest & SAC Upload

**Files:**
- Modify: `scatter-clustering.json` (URL auf finale CDN-URL setzen)

- [ ] **Schritt 1: Alle Testpage-Szenarien durchgehen**

| Szenario | Erwartetes Ergebnis |
|---|---|
| Normaldaten (8 Punkte, 3 Cluster) | Bubble Chart mit 3 Farben, Legende, Tooltip |
| Button "5 Cluster + Achsenlabels" | 5 Cluster, "Umsatz AJ" / "DB AJ" auf Achsen |
| Button "Leere Daten" | Grauer Text "Keine Daten verfügbar" |
| Button "2 Punkte, 5 Cluster" | Kein Fehler, 2 Cluster |
| Klick auf Bubble | Click-Log zeigt Label + Werte |
| Browser-Fenster verkleinern | Chart passt sich an |

- [ ] **Schritt 2: Finale URL in Manifest eintragen (nach GitHub Pages Deployment)**

In `scatter-clustering.json` die `url` anpassen:
```json
"url": "https://Mabo2807.github.io/Test_Scatterpoint/src/scatter-clustering-widget.js"
```

- [ ] **Schritt 3: Widget in SAC importieren und mit echten Daten testen**

SAC → Custom Widgets → Upload `scatter-clustering.json` → Widget in Story einfügen → Data Binding konfigurieren (labelDimension, measureX, measureY, measureSize) → Chart erscheint.

- [ ] **Schritt 4: Finaler Commit + GitHub Push**

```bash
git add scatter-clustering.json
git commit -m "chore: update manifest URL for GitHub Pages"
git push origin main
```

# SAC Custom Widget: Scatter Clustering — Design Spec

**Datum:** 2026-06-01  
**Ordner:** `C:\Users\P10100739\Development\SAPDevelopSAC\Test_Scatterpoint`  
**Referenz:** https://echarts.apache.org/examples/en/editor.html?c=scatter-clustering

---

## Überblick

Ein SAP Analytics Cloud Custom Widget, das Datenpunkte aus SAC als Bubble Chart darstellt und automatisch per K-Means (via echarts-stat) in Cluster einteilt. Optik orientiert sich am SAC Light Theme: weißer Hintergrund, große semi-transparente Bubbles, SAC-Farbpalette.

---

## Dateistruktur

```
Test_Scatterpoint/
├── scatter-clustering.json           ← SAC Manifest
├── src/
│   └── scatter-clustering-widget.js  ← Web Component (alles in einer Datei)
├── test/
│   └── index.html                    ← Lokaler Testpage
├── icon.png
└── docs/superpowers/specs/
    └── 2026-06-01-scatter-clustering-design.md
```

---

## SAC Manifest (`scatter-clustering.json`)

- **id:** `com.custom.scatterclustering`
- **version:** `1.0.0`
- **name:** `ScatterClustering`
- **tag:** `com-custom-scatterclustering`
- **webcomponent kind:** `main`
- **url:** GitHub Pages URL (nach Deployment)
- **ignoreIntegrity:** `true` (während Entwicklung)

### Properties (Builder Panel)

| Property | Typ | Default | Beschreibung |
|---|---|---|---|
| `clusterCount` | number | 5 | Anzahl K-Means Cluster |
| `xAxisLabel` | string | `""` | Achsenbeschriftung X |
| `yAxisLabel` | string | `""` | Achsenbeschriftung Y |
| `opacity` | number | 0.6 | Bubble-Transparenz (0.1–1.0) |

### Methods

| Method | Parameter | Beschreibung |
|---|---|---|
| `refresh` | — | Daten neu laden und Chart neu rendern |

### Events

| Event | Beschreibung |
|---|---|
| `onPointClick` | Gefeuert bei Klick auf einen Datenpunkt |

### Data Binding — 4 Feeds

| Feed-ID | Typ | Beschreibung |
|---|---|---|
| `labelDimension` | dimension | Label der Punkte (z.B. Kunde, Region, Produkt) |
| `measureX` | mainStructureMember | X-Achse (z.B. Umsatz AJ) |
| `measureY` | mainStructureMember | Y-Achse (z.B. DB AJ) |
| `measureSize` | mainStructureMember | Bubble-Größe (z.B. Anzahl Bestellungen) |

---

## Web Component (`scatter-clustering-widget.js`)

### Abhängigkeiten (CDN)

```
https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js
https://cdn.jsdelivr.net/npm/echarts-stat@1/dist/ecStat.min.js
```

Beide werden dynamisch per `<script>`-Tag in `connectedCallback` geladen. Widget wartet mit Rendering bis beide Bibliotheken verfügbar sind (Promise-Chain).

### Lifecycle

| Hook | Aktion |
|---|---|
| `connectedCallback` | Shadow DOM aufbauen, ECharts + echarts-stat laden, Chart-Container erstellen |
| `onCustomWidgetBeforeUpdate` | SAC-Daten empfangen |
| `onCustomWidgetAfterUpdate` | Daten transformieren → K-Means → ECharts rendern |
| `onCustomWidgetResize` | `chart.resize()` aufrufen |

### Daten-Flow

1. SAC liefert Zeilen mit `labelDimension`, `measureX`, `measureY`, `measureSize`
2. Widget baut Array: `[[x, y], [x, y], ...]` für K-Means
3. `ecStat.clustering.hierarchicalKMeans(data, { clusterCount: N })` → Cluster-ID je Punkt
4. Punkte werden nach Cluster-ID gruppiert → je Cluster eine ECharts `scatter`-Series
5. Bubble-Größe wird aus `measureSize` skaliert (min/max normalisiert auf Pixelradius 10–50)
6. `chart.setOption()` rendert das Ergebnis

### Visuelles Design

- **Hintergrund:** `#ffffff`
- **Gridlinien:** `#f0f0f0` (hell, dezent)
- **Achsenbeschriftung:** `#555`, font-size 11px
- **Bubble-Farben:** ECharts Standard-Kategoriepallette (blau, orange, grün, pink, lila, ...)
- **Bubble-Opacity:** konfigurierbar, Default `0.6`
- **Legende:** oben, horizontal, farbige Punkte + "Cluster N"
- **Tooltip bei Hover:** Label + X-Wert + Y-Wert + Size-Wert (formatiert)
- **ResizeObserver:** Chart passt sich automatisch an Widget-Größe an

### Fehlerbehandlung

- Keine SAC-Daten → leerer Chart mit Hinweistext "Keine Daten verfügbar"
- Weniger Datenpunkte als `clusterCount` → `clusterCount` automatisch auf Datenpunktanzahl reduziert
- CDN nicht erreichbar → Fehlermeldung im Widget anzeigen

---

## Lokaler Test (`test/index.html`)

Standalone-Testpage mit hardcodierten Beispieldaten (Umsatz/DB/Bestellungen), die das Widget ohne SAC-Verbindung testet. Gleiche Struktur wie `KalenderHCM/test/index.html`.

---

## Deployment

Analog zu KalenderHCM über GitHub Pages. Nach Push auf `main` ist das Widget unter
`https://<user>.github.io/Test_Scatterpoint/src/scatter-clustering-widget.js` erreichbar.

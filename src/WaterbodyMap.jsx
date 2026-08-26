import React, { createRef, Suspense} from 'react';
import moment from 'moment';
import bbox from '@turf/bbox';

const MapComponent = React.lazy(() => import('./Map'));
const Loading = React.lazy(() => import('./Loading'));

import IconAngleLeft from './imgs/angle-left.svg';
import IconAngleRight from './imgs/angle-right.svg';
import "mapbox-gl/dist/mapbox-gl.css";

// CDSE — free, covers Sentinel-2 and Landsat 8/9.
const CDSE = "https://sh.dataspace.copernicus.eu";
const CDSE_INSTANCE = "43e54b2d-9a03-42a3-ab9b-1b016057f54e";

// Microsoft Planetary Computer — free, pre-authorized access to Landsat Collection 2.
const PC_STAC    = "https://planetarycomputer.microsoft.com/api/stac/v1";
const PC_TITILER = "https://planetarycomputer.microsoft.com/api/data/v1";

const ESRI_FALLBACK =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

// Sensors served synchronously via CDSE WMS.
const CDSE_LAYERS = {
  "Sentinel-2": "TRUE-COLOR-S2L1C",
  "LandSat-8":  "TRUE-COLOR-L89",
  "LandSat8-9": "TRUE-COLOR-L89",
};

// Landsat 4/5/7 TM — Collection 2 Level-2 surface reflectance (PC common asset names).
// Per-band rescale derived from p2–p98 of a Lebanon scene.
const PC_L2_SENSORS = {
  "LandSat-7": { bands: ["red", "green", "blue"], rescale: "8095%2C21758&rescale=8383%2C18787&rescale=8887%2C15410" },
  "LandSat-5": { bands: ["red", "green", "blue"], rescale: "8095%2C21758&rescale=8383%2C18787&rescale=8887%2C15410" },
  "LandSat-4": { bands: ["red", "green", "blue"], rescale: "8095%2C21758&rescale=8383%2C18787&rescale=8887%2C15410" },
};

// Landsat 1/2/3/5-MSS — Collection 2 Level-1. CIR composite: nir08→R, red→G, green→B.
// Water appears dark/black; vegetation appears red/pink.
// Rescale from mean±1.5σ of a Lebanon scene (Dec 1993, LM05_L1GS_174037_19931220_02_T2).
const PC_L1_SENSORS = {
  "LandSat-3": { bands: ["nir08", "red", "green"], rescale: "20%2C225&rescale=10%2C235&rescale=45%2C220" },
  "LandSat-2": { bands: ["nir08", "red", "green"], rescale: "20%2C225&rescale=10%2C235&rescale=45%2C220" },
  "LandSat-1": { bands: ["nir08", "red", "green"], rescale: "20%2C225&rescale=10%2C235&rescale=45%2C220" },
};

function buildCdseUrl(layerId, measurementDate) {
  const time = measurementDate.format('YYYY-MM-DD') + '/' + measurementDate.format('YYYY-MM-DD');
  return CDSE + '/ogc/wms/' + CDSE_INSTANCE
    + '?showLogo=false&service=WMS&request=GetMap&layers=' + layerId
    + '&styles=&format=image/jpeg&version=1.1.1&time=' + time
    + '&height=512&width=512&srs=EPSG:3857&bbox={bbox-epsg-3857}';
}

async function fetchPcTileUrl(collection, bands, rescale, measurementDate, waterbodyOutline) {
  const date = measurementDate.format('YYYY-MM-DD');
  const bounds = bbox(waterbodyOutline);

  let itemId;
  try {
    const resp = await fetch(PC_STAC + '/search', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collections: [collection],
        datetime: date + 'T00:00:00Z/' + date + 'T23:59:59Z',
        bbox: bounds,
        limit: 1,
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data.features || data.features.length === 0) return null;
    itemId = data.features[0].id;
  } catch (e) {
    return null;
  }

  const assetParams = bands.map(b => 'assets=' + b).join('&');
  return PC_TITILER + '/item/tiles/WebMercatorQuad/{z}/{x}/{y}@1x'
    + '?collection=' + collection + '&item=' + itemId
    + '&' + assetParams
    + '&rescale=' + rescale + '&nodata=0';
}

class WaterbodyMap extends React.PureComponent {
  LINE_LAYOUT = { 'line-cap': 'round', 'line-join': 'round' };
  NOMINAL_OUTLINE_LINE_PAINT = { 'line-color': '#e8c26e', 'line-width': 2 };
  MEASUREMENT_OUTLINE_LINE_PAINT = { 'line-color': '#26accc', 'line-width': 2 };
  MAP_CONTAINER_STYLE = { height: '100%', width: '100%', position: 'absolute' };
  FIT_BOUNDS_OPTIONS = { duration: 0, padding: 50 };
  DEFAULT_ZOOM = 11;

  constructor(props) {
    super(props);
    this.mapRef = createRef();
    this.state = { mapLoaded: false, landsatTileUrl: ESRI_FALLBACK };
  }

  componentDidMount() {
    this.fitBounds();
    this.refreshLandsatTile();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.waterbody !== this.props.waterbody) this.fitBounds();
    if (
      prevProps.sensor !== this.props.sensor ||
      !prevProps.measurementDate.isSame(this.props.measurementDate)
    ) {
      this.refreshLandsatTile();
    }
  }

  refreshLandsatTile = async () => {
    const { sensor, measurementDate, waterbody } = this.props;
    if (!waterbody) return;
    const l2 = PC_L2_SENSORS[sensor];
    const l1 = PC_L1_SENSORS[sensor];
    if (!l2 && !l1) return;
    this.setState({ landsatTileUrl: ESRI_FALLBACK });
    const { bands, rescale, collection } = l2
      ? { ...l2, collection: "landsat-c2-l2" }
      : { ...l1, collection: "landsat-c2-l1" };
    const url = await fetchPcTileUrl(collection, bands, rescale, measurementDate, waterbody.nominal_outline);
    this.setState({ landsatTileUrl: url || ESRI_FALLBACK });
  };

  fitBounds = () => {
    const { waterbody } = this.props;
    if (this.mapRef.current && waterbody) {
      const map = this.mapRef.current.getMap();
      map.fitBounds(bbox(waterbody.nominal_outline), { padding: 50, duration: 0 });
    }
  }

  onMapLoad = () => this.setState({ mapLoaded: true });

  getPrevMeasurement(date) {
    return this.props.waterbody.measurements.slice().reverse().find(m => m.date.isBefore(date));
  }

  getNextMeasurement(date) {
    return this.props.waterbody.measurements.find(m => m.date.isAfter(date));
  }

  goPrev = () => {
    const m = this.getPrevMeasurement(this.props.measurementDate);
    if (!m) return;
    this.props.onDateSelect(this.props.waterbody.properties.id, moment(m.date, 'YYYY-MM-DD'), m.sensor_type);
  };

  goNext = () => {
    const m = this.getNextMeasurement(this.props.measurementDate);
    if (!m) return;
    this.props.onDateSelect(this.props.waterbody.properties.id, moment(m.date, 'YYYY-MM-DD'), m.sensor_type);
  };

  render() {
    const { waterbody, measurementOutline, measurementDate, sensor } = this.props;
    const { landsatTileUrl } = this.state;
    if (!waterbody) return <Suspense fallback={<div>Loading...</div>}><Loading /></Suspense>;

    const hasPrev = !!this.getPrevMeasurement(measurementDate);
    const hasNext = !!this.getNextMeasurement(measurementDate);

    const cdseLayer = CDSE_LAYERS[sensor];
    let tileUrl, isCdseWms;
    if (cdseLayer) {
      tileUrl = buildCdseUrl(cdseLayer, measurementDate);
      isCdseWms = true;
    } else if (PC_L2_SENSORS[sensor] || PC_L1_SENSORS[sensor]) {
      tileUrl = landsatTileUrl || ESRI_FALLBACK;
      isCdseWms = false;
    } else {
      tileUrl = ESRI_FALLBACK;
      isCdseWms = false;
    }

    const legend = document.getElementById('legend');
    if (legend) {
      legend.innerHTML = '<h4>Legend :</h4>' +
        '<div><span style="background-color: #e8c26e"></span>Lake Contour</div>' +
        '<div><span style="background-color: #26accc"></span>Water Borders</div>';
    }

    return (
      <div className="waterbody-map">
        <Suspense fallback={<div>Loading...</div>}>
        <MapComponent
          ref={this.mapRef}
          initialViewState={{
            longitude: waterbody.properties.long,
            latitude: waterbody.properties.lat,
            zoom: this.DEFAULT_ZOOM,
          }}
          style={this.MAP_CONTAINER_STYLE}
          mapStyle={{
            version: 8,
            sources: {
              'esri-base': {
                type: 'raster',
                tiles: [ESRI_FALLBACK],
                tileSize: 256,
              },
              'satellite-tiles': {
                type: 'raster',
                tiles: [tileUrl],
                tileSize: isCdseWms ? 512 : 256,
              },
              'nominal-outline': { type: 'geojson', data: waterbody.nominal_outline },
              'measurement-outline': { type: 'geojson', data: measurementOutline },
            },
            layers: [
              { id: 'esri-base', type: 'raster', source: 'esri-base', minzoom: 0, maxzoom: 22 },
              { id: 'satellite-tiles', type: 'raster', source: 'satellite-tiles', minzoom: 0, maxzoom: 22 },
              { id: 'nominal-outline-layer', type: 'line', source: 'nominal-outline', layout: this.LINE_LAYOUT, paint: this.NOMINAL_OUTLINE_LINE_PAINT },
              measurementOutline && { id: 'measurement-outline-layer', type: 'line', source: 'measurement-outline', layout: this.LINE_LAYOUT, paint: this.MEASUREMENT_OUTLINE_LINE_PAINT },
            ].filter(Boolean),
          }}
          onLoad={this.onMapLoad}
        />
        </Suspense>
        <div className="go prev" onClick={this.goPrev}>
          <img alt="Previous date" className={hasPrev ? '' : 'disabled'} src={IconAngleLeft} />
        </div>
        <div className="go next" onClick={this.goNext}>
          <img alt="Next date" className={hasNext ? '' : 'disabled'} src={IconAngleRight} />
        </div>
        <div id="legend" className='legend'></div>
      </div>
    );
  }
}

export default WaterbodyMap;

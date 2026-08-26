import React, { createRef, Suspense} from 'react';
import moment from 'moment';
import bbox from '@turf/bbox';

const MapComponent = React.lazy(() => import('./Map'));
const Loading = React.lazy(() => import('./Loading'));


import IconAngleLeft from './imgs/angle-left.svg';
import IconAngleRight from './imgs/angle-right.svg';
import "mapbox-gl/dist/mapbox-gl.css";

// Microsoft Planetary Computer Titiler — free, no API key, covers Landsat 4-9 Collection 2.
// https://planetarycomputer.microsoft.com/docs/reference/data/
const PC_TITILER = "https://planetarycomputer.microsoft.com/api/data/v1";

// NASA GIBS WMTS — free, no API key, used as fallback for Landsat 1-3 (MSS sensor).
// Per-scene free tiles don't exist for these missions; GIBS provides the nearest annual composite.
const GIBS_LANDSAT_ANNUAL =
  "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual/default/2012-01-01/GoogleMapsCompatible/{z}/{y}/{x}.jpg";

// PC Titiler band configs per mission (Landsat Collection 2 Level-2 band names).
// Landsat 8/9  OLI sensor  — Red=SR_B4, Green=SR_B3, Blue=SR_B2
// Landsat 4/5/7 TM/ETM+   — Red=SR_B3, Green=SR_B2, Blue=SR_B1
const LANDSAT_BAND_CONFIGS = {
  "LandSat-9":  { assets: ["SR_B4", "SR_B3", "SR_B2"] },
  "LandSat8-9": { assets: ["SR_B4", "SR_B3", "SR_B2"] },
  "LandSat-8":  { assets: ["SR_B4", "SR_B3", "SR_B2"] },
  "LandSat-7":  { assets: ["SR_B3", "SR_B2", "SR_B1"] },
  "LandSat-5":  { assets: ["SR_B3", "SR_B2", "SR_B1"] },
  "LandSat-4":  { assets: ["SR_B3", "SR_B2", "SR_B1"] },
};

function buildTileUrl(sensor, measurementDate) {
  if (sensor === "Sentinel-2") {
    // Copernicus Dataspace — free WMS for Sentinel-2, no paid account required.
    const instanceId = "43e54b2d-9a03-42a3-ab9b-1b016057f54e";
    const time = `${measurementDate.format('YYYY-MM-DD')}/${measurementDate.format('YYYY-MM-DD')}`;
    return `https://sh.dataspace.copernicus.eu/ogc/wms/${instanceId}?showLogo=false&service=WMS&request=GetMap&layers=TRUE-COLOR-S2L1C&styles=&format=image/jpeg&version=1.1.1&time=${time}&height=512&width=512&srs=EPSG:3857&bbox={bbox-epsg-3857}`;
  }

  const cfg = LANDSAT_BAND_CONFIGS[sensor];
  if (cfg) {
    const date = measurementDate.format('YYYY-MM-DD');
    const assetParams = cfg.assets.map(a => `assets=${a}`).join('&');
    // color_formula approximates Sentinel Hub visual output: gamma boost + sigmoidal contrast.
    return `${PC_TITILER}/mosaic/tiles/{z}/{x}/{y}@2x.jpg?collection=landsat-c2-l2&datetime=${date}/${date}&${assetParams}&rescale=7272,11000&color_formula=gamma+RGB+3.5+saturation+1.7+sigmoidal+RGB+15+0.35`;
  }

  // Landsat 1-3 (MSS sensor, 1972-1983): no free per-scene tile service exists.
  // Shows the nearest GIBS annual Landsat composite as a visual reference.
  return GIBS_LANDSAT_ANNUAL;
}

// Sentinel-2 uses WMS (bbox placeholder); all others use standard XYZ tiles.
function isXyzTile(sensor) {
  return sensor !== "Sentinel-2";
}

class WaterbodyMap extends React.PureComponent {
  LINE_LAYOUT = {
    'line-cap': 'round',
    'line-join': 'round',
  };
  NOMINAL_OUTLINE_LINE_PAINT = {
    'line-color': '#e8c26e',
    'line-width': 2,
  };
  MEASUREMENT_OUTLINE_LINE_PAINT = {
    'line-color': '#26accc',
    'line-width': 2,
  };
  MAP_CONTAINER_STYLE = {
    height: '100%',
    width: '100%',
    position: 'absolute',
  };
  FIT_BOUNDS_OPTIONS = { duration: 0, padding: 50 };
  DEFAULT_ZOOM = 11;

  constructor(props) {
    super(props);
    this.mapRef = createRef();
    this.state = { mapLoaded: false };
  }

  componentDidMount() {
    this.fitBounds();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.waterbody !== this.props.waterbody) {
      this.fitBounds();
    }
  }

  fitBounds = () => {
    const { waterbody } = this.props;
    if (this.mapRef.current && waterbody) {
      const map = this.mapRef.current.getMap();
      const bounds = bbox(waterbody.nominal_outline);
      map.fitBounds(bounds, {
        padding: 50,
        duration: 0,
      });
    }
  }

  onMapLoad = () => {
    this.setState({ mapLoaded: true });
  };

  getPrevMeasurement(date) {
    return this.props.waterbody.measurements
      .slice()
      .reverse()
      .find(m => m.date.isBefore(date));
  }

  getNextMeasurement(date) {
    return this.props.waterbody.measurements.find(m => m.date.isAfter(date));
  }

  goPrev = () => {
    const goToMeasurement = this.getPrevMeasurement(this.props.measurementDate);
    if (!goToMeasurement) {
      return;
    }
    this.props.onDateSelect(this.props.waterbody.properties.id, moment(goToMeasurement.date, 'YYYY-MM-DD'), goToMeasurement.sensor_type);
  };

  goNext = () => {
    const goToMeasurement = this.getNextMeasurement(this.props.measurementDate);
    if (!goToMeasurement) {
      return;
    }
    this.props.onDateSelect(this.props.waterbody.properties.id, moment(goToMeasurement.date, 'YYYY-MM-DD'), goToMeasurement.sensor_type);
  };

  render() {
    const { waterbody, measurementOutline, measurementDate, sensor } = this.props;
    if (!waterbody) {
      return <Suspense fallback={<div>Loading...</div>}><Loading /></Suspense>;
    }
    const hasPrev = !!this.getPrevMeasurement(measurementDate);
    const hasNext = !!this.getNextMeasurement(measurementDate);

    const tileUrl = buildTileUrl(sensor, measurementDate);
    const xyz = isXyzTile(sensor);

    const legend = document.getElementById('legend');
    if (legend) {
      legend.innerHTML = '<h4>Legend :</h4>' +
        '<div><span style="background-color: #e8c26e"></span>Lake Contour</div>' +
        '<div><span style="background-color: #26accc"></span>Water Borders</div>';
    }

    return (
      <div className="waterbody-map">
        <Suspense fallback= {<div>Loading...</div>}>
        <MapComponent
          ref={this.mapRef}
          initialViewState={{
            longitude: waterbody.properties.long,
            latitude: waterbody.properties.lat,
            zoom: this.DEFAULT_ZOOM,
          }}
          style = {this.MAP_CONTAINER_STYLE}
          mapStyle={{
            version: 8,
            sources: {
              'satellite-tiles': {
                type: 'raster',
                tiles: [tileUrl],
                tileSize: xyz ? 256 : 512,
              },
              'nominal-outline': {
                type: 'geojson',
                data: waterbody.nominal_outline,
              },
              'measurement-outline': {
                type: 'geojson',
                data: measurementOutline,
              },
            },
            layers: [
              {
                id: 'satellite-tiles',
                type: 'raster',
                source: 'satellite-tiles',
                minzoom: 0,
                maxzoom: 22,
              },
              {
                id: 'nominal-outline-layer',
                type: 'line',
                source: 'nominal-outline',
                layout: this.LINE_LAYOUT,
                paint: this.NOMINAL_OUTLINE_LINE_PAINT,
              },
              measurementOutline && {
                id: 'measurement-outline-layer',
                type: 'line',
                source: 'measurement-outline',
                layout: this.LINE_LAYOUT,
                paint: this.MEASUREMENT_OUTLINE_LINE_PAINT,
              },
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
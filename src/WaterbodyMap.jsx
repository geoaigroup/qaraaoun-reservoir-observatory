import React, { createRef, Suspense} from 'react';
import moment from 'moment';
import bbox from '@turf/bbox';

const MapComponent = React.lazy(() => import('./Map'));
const Loading = React.lazy(() => import('./Loading'));

import IconAngleLeft from './imgs/angle-left.svg';
import IconAngleRight from './imgs/angle-right.svg';
import "mapbox-gl/dist/mapbox-gl.css";

const PC_STAC    = "https://planetarycomputer.microsoft.com/api/stac/v1";
const PC_TITILER = "https://planetarycomputer.microsoft.com/api/data/v1";

const ESRI_FALLBACK =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const LANDSAT_BANDS = {
  "LandSat-9":  ["SR_B4", "SR_B3", "SR_B2"],
  "LandSat8-9": ["SR_B4", "SR_B3", "SR_B2"],
  "LandSat-8":  ["SR_B4", "SR_B3", "SR_B2"],
  "LandSat-7":  ["SR_B3", "SR_B2", "SR_B1"],
  "LandSat-5":  ["SR_B3", "SR_B2", "SR_B1"],
  "LandSat-4":  ["SR_B3", "SR_B2", "SR_B1"],
};

function buildSentinel2Url(measurementDate) {
  const instanceId = "43e54b2d-9a03-42a3-ab9b-1b016057f54e";
  const time = `${measurementDate.format('YYYY-MM-DD')}/${measurementDate.format('YYYY-MM-DD')}`;
  return `https://sh.dataspace.copernicus.eu/ogc/wms/${instanceId}?showLogo=false&service=WMS&request=GetMap&layers=TRUE-COLOR-S2L1C&styles=&format=image/jpeg&version=1.1.1&time=${time}&height=512&width=512&srs=EPSG:3857&bbox={bbox-epsg-3857}`;
}

async function fetchLandsatTileUrl(sensor, measurementDate, waterbodyOutline) {
  const bands = LANDSAT_BANDS[sensor];
  if (!bands) return null; // Landsat 1-3 not in Collection 2

  const date = measurementDate.format('YYYY-MM-DD');
  const bounds = bbox(waterbodyOutline);

  const params = new URLSearchParams({
    collections: "landsat-c2-l2",
    datetime: `${date}T00:00:00Z/${date}T23:59:59Z`,
    bbox: bounds.join(","),
    limit: "1",
  });

  let itemId;
  try {
    const resp = await fetch(`${PC_STAC}/search?${params}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (!data.features || data.features.length === 0) return null;
    itemId = data.features[0].id;
  } catch {
    return null;
  }

  const assetParams = bands.map(b => `assets=${b}`).join("&");
  return `${PC_TITILER}/item/tiles/{z}/{x}/{y}@2x.jpg?collection=landsat-c2-l2&item=${itemId}&${assetParams}&rescale=7272,11000&color_formula=gamma+RGB+3.5+saturation+1.7+sigmoidal+RGB+15+0.35`;
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
    this.refreshTileUrl();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.waterbody !== this.props.waterbody) this.fitBounds();
    if (
      prevProps.sensor !== this.props.sensor ||
      !prevProps.measurementDate.isSame(this.props.measurementDate)
    ) {
      this.refreshTileUrl();
    }
  }

  refreshTileUrl = async () => {
    const { sensor, measurementDate, waterbody } = this.props;
    if (!waterbody) return;
    if (sensor === "Sentinel-2") { this.setState({ landsatTileUrl: null }); return; }

    this.setState({ landsatTileUrl: ESRI_FALLBACK });
    const url = await fetchLandsatTileUrl(sensor, measurementDate, waterbody.nominal_outline);
    this.setState({ landsatTileUrl: url || ESRI_FALLBACK });
  };

  fitBounds = () => {
    const { waterbody } = this.props;
    if (this.mapRef.current && waterbody) {
      const map = this.mapRef.current.getMap();
      const bounds = bbox(waterbody.nominal_outline);
      map.fitBounds(bounds, { padding: 50, duration: 0 });
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
    const isSentinel = sensor === "Sentinel-2";
    const tileUrl = isSentinel ? buildSentinel2Url(measurementDate) : landsatTileUrl;

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
              'satellite-tiles': {
                type: 'raster',
                tiles: [tileUrl],
                tileSize: isSentinel ? 512 : 256,
              },
              'nominal-outline': { type: 'geojson', data: waterbody.nominal_outline },
              'measurement-outline': { type: 'geojson', data: measurementOutline },
            },
            layers: [
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
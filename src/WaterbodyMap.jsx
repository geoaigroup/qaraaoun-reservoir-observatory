import React, { createRef, Suspense} from 'react';
import moment from 'moment';
import bbox from '@turf/bbox';

const MapComponent = React.lazy(() => import('./Map'));
const Loading = React.lazy(() => import('./Loading'));


import IconAngleLeft from './imgs/angle-left.svg';
import IconAngleRight from './imgs/angle-right.svg';
import "mapbox-gl/dist/mapbox-gl.css";


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
    const timeInterval = `${measurementDate.format('YYYY-MM-DD')}/${measurementDate.format('YYYY-MM-DD')}`;

    let instance_id = null;
    let layerID = null;
    let endpoint_url = null;
    if (sensor === "Sentinel-2") {
      instance_id = "43e54b2d-9a03-42a3-ab9b-1b016057f54e";
      layerID = "TRUE-COLOR-S2L1C";
      endpoint_url = "https://sh.dataspace.copernicus.eu";
    } else if (sensor === "LandSat-8") {
      instance_id = "66430348-ee9d-4dde-881d-9fe84c59679e";
      layerID = "TRUE-COLOR-L8-L2";
      endpoint_url = "https://services-uswest2.sentinel-hub.com";
    } else if (sensor === "LandSat-5") {
      instance_id = "66430348-ee9d-4dde-881d-9fe84c59679e";
      layerID = "TRUE-COLOR-L4-5";
      endpoint_url = "https://services-uswest2.sentinel-hub.com";
    } else if (sensor === "LandSat-4") {
      instance_id = "66430348-ee9d-4dde-881d-9fe84c59679e";
      layerID = "TRUE-COLOR-L4-5";
      endpoint_url = "https://services-uswest2.sentinel-hub.com";
    } else if (sensor === "LandSat-3") {
      instance_id = "66430348-ee9d-4dde-881d-9fe84c59679e";
      layerID = "TRUE-COLOR-L1-3";
      endpoint_url = "https://services-uswest2.sentinel-hub.com";
    } else if (sensor === "LandSat-2") {
      instance_id = "66430348-ee9d-4dde-881d-9fe84c59679e";
      layerID = "TRUE-COLOR-L1-3";
      endpoint_url = "https://services-uswest2.sentinel-hub.com";
    } else if (sensor === "LandSat-1") {
      instance_id = "66430348-ee9d-4dde-881d-9fe84c59679e";
      layerID = "TRUE-COLOR-L1-3";
      endpoint_url = "https://services-uswest2.sentinel-hub.com";
    }

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
              'sentinel-hub-tiles': {
                type: 'raster',
                tiles: [
                  `${endpoint_url}/ogc/wms/${instance_id}?showLogo=false&service=WMS&request=GetMap&layers=${layerID}&styles=&format=image/jpeg&version=1.1.1&time=${timeInterval}&height=512&width=512&srs=EPSG:3857&bbox={bbox-epsg-3857}`,
                ],
                tileSize: 512,
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
                id: 'sentinel-hub-tiles',
                type: 'raster',
                source: 'sentinel-hub-tiles',
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












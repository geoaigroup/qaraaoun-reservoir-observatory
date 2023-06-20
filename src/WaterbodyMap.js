import React from 'react';
import moment from 'moment';
import { GeoJSONLayer } from 'react-mapbox-gl';
import bbox from '@turf/bbox';


import Map from './Map';
import Loading from './Loading';

import IconAngleLeft from './imgs/angle-left.svg';
import IconAngleRight from './imgs/angle-right.svg';

class WaterbodyMap extends React.PureComponent {
  SH_INSTANCE_ID = '1f0a401d-1a53-466a-9618-5a45ecee09e5';
  LINE_LAYOUT = {
    'line-cap': 'round',
    'line-join': 'round',
  };
  NOMINAL_OUTLINE_LINE_PAINT = {
    'line-color': '#26accc',
    'line-width': 2,
  };
  MEASUREMENT_OUTLINE_LINE_PAINT = {
    'line-color': '#e8c26e',
    'line-width': 2,
  };
  MAP_CONTAINER_STYLE = {
    height: '100%',
    width: '100%',
  };
  FIT_BOUNDS_OPTIONS = { duration: 0, padding: 50 };
  DEFAULT_ZOOM = [14];
  map = undefined;

  static defaultProps = {
    waterbody: undefined,
  };

  state = {
    centerLngLat: undefined,
  };

  onMapLoad = map => {
    // MapBox map doesn't know when the size of its container might change. As a consequence,
    // when first waterbody is loaded, the map doesn't stretch to fill the container. This solves
    if (this.props.size.height !== map._container.clientHeight) {
      map.resize();
    }
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
    this.props.onDateSelect(this.props.waterbody.properties.id, moment(goToMeasurement.date), goToMeasurement.sensor_type);
  };

  goNext = () => {
    const goToMeasurement = this.getNextMeasurement(this.props.measurementDate);
    if (!goToMeasurement) {
      return;
    }
    this.props.onDateSelect(this.props.waterbody.properties.id, moment(goToMeasurement.date), goToMeasurement.sensor_type);
  };

  render() {
    const { waterbody, measurementOutline, measurementDate, sensor} = this.props;
    if (!waterbody) {
      return <Loading />;
    }
    const hasPrev = !!this.getPrevMeasurement(measurementDate);
    const hasNext = !!this.getNextMeasurement(measurementDate);
    const timeInterval = `${measurementDate.format('YYYY-MM-DD')}/${measurementDate.format('YYYY-MM-DD')}`;
    var tileID = null;
    if(sensor === "Sentinel-2")
      tileID = "TRUE-COLOR-S2L1C"
    return (
      <div className="waterbody-map">
        <Map
          center={[waterbody.properties.long, waterbody.properties.lat]}
          fitBounds={bbox(waterbody.nominal_outline)}
          fitBoundsOptions={this.FIT_BOUNDS_OPTIONS}
          movingMethod="jumpTo"
          zoom={this.DEFAULT_ZOOM}
          onStyleLoad={this.onMapLoad}
          style={{
            version: 8,
            sources: {
              'sentinel-hub-tiles': {
                type: 'raster',
                tiles: [
                  `https://sh.dataspace.copernicus.eu/ogc/wms/${
                    this.SH_INSTANCE_ID
                  }?showLogo=false&service=WMS&request=GetMap&layers=${tileID}&styles=&format=image/jpeg&version=1.1.1&time=${timeInterval}&height=512&width=512&srs=EPSG:3857&bbox={bbox-epsg-3857}`,
                ],
                tileSize: 512,
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
            ],
          }}
          containerStyle={this.MAP_CONTAINER_STYLE}
        >
          <GeoJSONLayer
            key={`blue-${waterbody.properties.id}`}
            data={waterbody.nominal_outline}
            lineLayout={this.LINE_LAYOUT}
            linePaint={this.NOMINAL_OUTLINE_LINE_PAINT}
          />
          {measurementOutline && (
            <GeoJSONLayer
              key={`yellow-${waterbody.properties.id}`}
              data={measurementOutline}
              lineLayout={this.LINE_LAYOUT}
              linePaint={this.MEASUREMENT_OUTLINE_LINE_PAINT}
            />
          )}
        </Map>
        <div className="go prev" onClick={this.goPrev}>
          <img alt="Previous date" className={hasPrev ? '' : 'disabled'} src={IconAngleLeft} />
        </div>
        <div className="go next" onClick={this.goNext}>
          <img alt="Next date" className={hasNext ? '' : 'disabled'} src={IconAngleRight} />
        </div>
      </div>
    );
  }
}

export default WaterbodyMap;

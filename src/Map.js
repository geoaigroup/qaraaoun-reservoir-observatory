import React, { forwardRef } from 'react';
import { Map } from 'react-map-gl';

const accessToken = 'pk.eyJ1IjoiYWFmMzYiLCJhIjoiY2x3eHV4eWs3MWc5ODJscjM2NTM1czljbSJ9.7nYI2PWYbTsSki8Pk5AO3A';

const MapComponent = forwardRef(({ initialViewState, mapStyle, onLoad }, ref) => {
  return (
    <Map
      ref={ref}
      initialViewState={initialViewState}
      style={{ width: '100%', height: '100%' }}
      mapStyle={mapStyle}
      mapboxAccessToken={accessToken}
      onLoad={onLoad}
      attributionControl={false}
      logoPosition="bottom-left"
    />
  );
});

export default MapComponent;



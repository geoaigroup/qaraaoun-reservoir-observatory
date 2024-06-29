import React, { Suspense, forwardRef } from 'react';
const Map = React.lazy(() => import('react-map-gl'));

const accessToken = 'pk.eyJ1IjoiYWFmMzYiLCJhIjoiY2x3eHV4eWs3MWc5ODJscjM2NTM1czljbSJ9.7nYI2PWYbTsSki8Pk5AO3A';

const MapComponent = forwardRef(({ initialViewState, mapStyle, onLoad }, ref) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
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
    </Suspense>
  );
});

export default MapComponent;



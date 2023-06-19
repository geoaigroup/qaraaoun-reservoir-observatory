import React from 'react';

import './styles/WaterbodyInfo.scss';
import Loading from './Loading';


  
const Info = props => (
  <div className="infobox">
    <div className="value">{props.value}</div>
    <label>{props.label}</label>
  </div>
);

export default class WaterbodyInfo extends React.Component {
  static defaultProps = {
    waterbody: undefined,
  };

  render() {
    const { waterbody, measurementDate, sensor, outline } = this.props;

    if (!waterbody) {
      return <Loading />;
    }
    
    function thousands_separators(num) { 
      var num_parts = num.toString().split(".");
      num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return num_parts.join(".");
    }
  
    //const nMeasurements = waterbody.measurements.length;
    const measurementInfo = measurementDate
      ? waterbody.measurements.find(m => m.date.isSame(measurementDate))
      : undefined;
      
    return (
      <div className="info-container">
    <div className="info-above-grid">
  <Info
    key={0}
    value={`${waterbody.properties.name} - ${waterbody.properties.country}`}
    label=""
  />
  </div>
  {measurementInfo && (
    <div className="column-container">
      <Info key={1} label="Observation Date" value={measurementInfo.date.format('MMMM D, YYYY') } />
      
      <Info key={3} label="Mission name" value={thousands_separators(`${measurementInfo.sensor_type}`)}   />
      
      {measurementInfo.Average_Temperature && (
      <Info key={5} label="Temperature in °C" value={thousands_separators(`${measurementInfo.Average_Temperature}`)}   />,
      <Info key={2} label="Water Volume" value={thousands_separators(`${measurementInfo.volume}`)}   />
      )}
      {!outline && (<Info key={6} label="Water Detection" value="Not available"   />)}
    </div>
  )}
</div>

    );
  }
}//<Info key={4} label="Water Quality" value="0.0"   />

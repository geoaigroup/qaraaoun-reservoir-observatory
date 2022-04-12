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
    const { waterbody, measurementDate } = this.props;

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
      <div>
        <Info
          key={0}
          value={`${waterbody.properties.name} - ${waterbody.properties.country}`}
          label=""
        />
        {measurementInfo && [
          <Info key={1} value={measurementInfo.date.format('YYYY-MM-DD')} label="Observation Date" />,
          <Info key={2} value={thousands_separators(`${measurementInfo.volume}`)}  label="Water Volume" />,
        ]}

      </div>
    );
  }
}

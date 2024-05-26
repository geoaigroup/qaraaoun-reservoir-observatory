import moment from 'moment-timezone';
import Loading from './Loading';
import HighchartsReact from 'highcharts-react-official';
import React from 'react';
import Highcharts from 'highcharts/highstock';

/** Sass variables, needed for the graph size which is a js prop 
import sassVariables from './styles/_vars.scss';*/
import './styles/Chart.scss';


/**
 * Used for dynamic graph heights,
 * TODO: fine tune for different monitor sizes or maybe switch
 * to height based breakpoints
 */

export default class Chart extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      zoom: 'all', // default zoom option
    };
  }

  handleZoom = (zoom) => {
    this.setState({ zoom });
  }

  render() {
    const { waterbody } = this.props;
    const { onDateSelect } = this.props;
    if (!waterbody) {
      return (
        <div className="chart-loader">
          <Loading />
        </div>
      );
    }

    const { zoom } = this.state;
    const validMeasurements = waterbody?.measurements ?? [];
    const maxLevel = Math.max(...validMeasurements.map(m => m.level));
    const data = validMeasurements.map((measurement) => ({
      x: measurement.date.valueOf(),
      y: (measurement.level/maxLevel) * 100,
    }));

    console.log(data.slice(0,100));
    

    const options = {
      chart: {
        type: 'column', 
        zoomType: 'x',
        backgroundColor: '#2b3035',
      },
      /*title: {
        text: "TITLE",
        style: {
          color: "white", 
        },
      },*/
      global: {
        timezoneOffset: 0
      },
      tooltip: {
        xDateFormat: '%A, %b %e, %Y',
        pointFormat: '{series.name}: <b>{point.y:.2f}</b><br/>',
        shared: true,
      },
      xAxis: {
        type: 'datetime',
        ordinal: false,
        tickColor: '#FFFFFF',
        lineColor: '#FFFFFF',
        //tickInterval: 365 * 24 * 3600 * 1000, // set tick interval to one year
        dateTimeLabelFormats: {
          day: '%e %b %Y',
          week: '%e %b %Y',
          month: '%b %Y',
          year: '%Y'
        },
        labels: {
          style: {
            color: '#FFFFFF'
          }
      },
    },
    navigator: {
      maskFill: 'rgba(230, 242, 250, 0.3)'
    },
      yAxis: {
opposite: false,
        title: {
          text: 'Water Surface Area %',
          style: {
            color: '#FFFFFF'
          }
        },
        labels: {
          style: {
            color: '#FFFFFF'
          },
          offset: 10
      },
      },
      series: [{
        name: 'Water level %',
        data,
        tooltip: {
          valueDecimals: 2,
        },
        dataGrouping: {
          enabled: true,
          approximation: 'average', // Set approximation to average
          groupPixelWidth: 10, 
          forced: true, // Ensure grouping is always applied
        }
      }],
      plotOptions: {
        column: {
          color: '#FFFFFF' 
        },
        series: {
          color: '#3f484e',
          point: {
            events: {
              click: (event) => {
                //const date = moment.utc(event.point.series.options.data[event.point.index].x);
                const waterbody = this.props.waterbody;
                //console.log(this.props.waterbody.properties.id);     
                const { x, index } = event.point;
                const measurement = waterbody.measurements[index];
                const date = moment.utc(x);
                const sensor = measurement.sensor_type;
                onDateSelect(waterbody.properties.id, date, sensor);
                //console.log(measurement.sensor_type);
              },
            },
          },
        },
      },
      rangeSelector: {
        labelStyle: {
          color: 'white'
        },
        inputStyle: {
          color: '#9fa0a1'
        },
        buttons: [{
          type: 'month',
          count: 1,
          text: '1m',
        }, {
          type: 'month',
          count: 6,
          text: '6m',
        }, {
          type: 'year',
          count: 1,
          text: '1y',
        }, {
          type: 'year',
          count: 6,
          text: '6y',
        }, {
          type: 'all',
          text: 'All',
        }],
        selected: zoom,
        inputEnabled: true,
        buttonSpacing: 5,
        buttonTheme: {
          width: 30,
        },
        events: {
          change: (event) => {
            this.handleZoom(event.target.value);
          },
        },
      },
      credits: {
        enabled: true,
        text: 'Highcharts.com',
        href: 'https://www.highcharts.com/?credits',
        style: {
            color: '#ffffff',
        }
    },
    };

    return (
      <div id="chart-container" className='bg-dark'>
        <HighchartsReact highcharts={Highcharts} constructorType={'stockChart'} options={options} />
      </div>
    );
  }
}

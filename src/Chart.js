import moment from 'moment-timezone';
import Loading from './Loading';
import HighchartsReact from 'highcharts-react-official';
import React from 'react';
import Highcharts from 'highcharts/highstock';

/** Sass variables, needed for the graph size which is a js prop */
import sassVariables from './styles/_vars.scss';
import './styles/Chart.scss';


/**
 * Used for dynamic graph heights,
 * TODO: fine tune for different monitor sizes or maybe switch
 * to height based breakpoints
 */

export default class Chart extends React.PureComponent {
  constructor(props) {
    super(props);
    console.log(props);
    this.state = {
      zoom: 'all', // default zoom option
    };
  }

  handleZoom = (zoom) => {
    this.setState({ zoom });
  }

  render() {
    const { waterbody } = this.props;
    if (!waterbody) {
      return (
        <div className="chart-loader">
          <Loading />
        </div>
      );
    }
    const { zoom } = this.state;
    const validMeasurements = waterbody?.measurements ?? [];
    console.log(validMeasurements);
    const data = validMeasurements.map((measurement) => [
      measurement.date.valueOf(),
     measurement.level * 100,
    ]);
    

    const options = {
      chart: {
        zoomType: 'x',
        backgroundColor: '#356b90',
      },
      title: {
        text: "TITLE",
      },
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
        title: {
          text: 'Water level %',
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
      }],
      plotOptions: {
        line: {
          color: '#FFFFFF' 
        },
        series: {
          color: '#3f484e',
          point: {
            events: {
              click: () => {
                console.log('Clicked on point:', this.x, this.y);
              },
            },
          },
        },
      },
      rangeSelector: {
        labelStyle: {
          color: 'white'
        },
        buttons: [{
          type: 'week',
          count: 1,
          text: '1w',
        }, {
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
    };

    return (
      <div id="chart-container">
        <HighchartsReact highcharts={Highcharts} constructorType={'stockChart'} options={options} />
      </div>
    );
  }
}



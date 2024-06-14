import moment from 'moment-timezone';
import Loading from './Loading';
import HighchartsReact from 'highcharts-react-official';
import React from 'react';
import Highcharts from 'highcharts/highstock';
import './styles/Chart.scss';


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

  handlePointClick = (event, validMeasurements) => {
    const point = event.point;
    const chart = event.point.series.chart;

    if (point.dataGroup && point.dataGroup.length > 1) {
        console.log('This is a grouped point');
        const { start, length } = point.dataGroup;
        const series = point.series;
        const xData = series.xData.slice(start, start + length);
        const newMin = Math.min(...xData); // Get the minimum x value in the group
        const newMax = Math.max(...xData); // Get the maximum x value in the group
        chart.xAxis[0].setExtremes(newMin, newMax);
    } else {
        const { waterbody, onDateSelect } = this.props;
        const { x } = event.point;
        let measurement = validMeasurements.find(m => m.date.valueOf() === x);
        
        if (!measurement) {
            console.log('Measurement not found, looking for nearest measurement');
            const clickedDate = moment.utc(x).format('YYYY-MM-DD');
            measurement = validMeasurements.find(m => moment(m.date).isSameOrAfter(clickedDate));
        }

        if (measurement) {
            const date = moment.utc(measurement.date);
            const sensor = measurement.sensor_type;
            onDateSelect(waterbody.properties.id, date, sensor);
        } else {
            console.log('measurement not found');
        } 
    }
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
    const data = validMeasurements.map((measurement) => ({
      x: measurement.date.valueOf(),
      y: measurement.level * 100,
    }));

    data.sort((a, b) => a.x - b.x);

    const options = {
      chart: {
        type: 'column',
        zoomType: 'x',
        backgroundColor: '#2b3035',
      },
      accessibility: {
        enabled: false,
      },
      global: {
        timezoneOffset: 0,
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
        dateTimeLabelFormats: {
          day: '%e %b %Y',
          week: '%e %b %Y',
          month: '%b %Y',
          year: '%Y',
        },
        labels: {
          style: {
            color: '#FFFFFF',
          },
        },
      },
      navigator: {
        maskFill: 'rgba(230, 242, 250, 0.3)',
      },
      yAxis: {
        opposite: false,
        title: {
          text: 'Water Surface Area %',
          style: {
            color: '#FFFFFF',
          },
        },
        labels: {
          style: {
            color: '#FFFFFF',
          },
          offset: 10,
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
          approximation: 'average',
          groupPixelWidth: 10,
          forced: true,
        },
      }],
      plotOptions: {
        column: {
          color: '#FFFFFF',
        },
        series: {
          color: '#3f484e',
          point: {
            events: {
              click: (event) => this.handlePointClick(event, validMeasurements),
            },
          },
        },
      },
      rangeSelector: {
        labelStyle: {
          color: 'white',
        },
        inputStyle: {
          color: '#9fa0a1',
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
        },
      },
    };

    return (
      <div id="chart-container" className='bg-dark'>
        <HighchartsReact highcharts={Highcharts} constructorType={'stockChart'} options={options} />
      </div>
    );
  }
}








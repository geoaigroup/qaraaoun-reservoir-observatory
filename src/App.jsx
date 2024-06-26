import React from 'react';
import axios from 'axios';
import moment from 'moment';
/** Components */
import WaterbodyMap from './WaterbodyMap';
import WaterbodyInfo from './WaterbodyInfo';
import Chart from './Chart';
import Header from './Header';
import Error404 from './Error404';
import MeasureWrapper from './MeasureWrapper';
import 'mapbox-gl/dist/mapbox-gl.css';
import './styles/App.scss';

class App extends React.Component {
  DEFAULT_WATERBODY_ID = 2307;

  state = {
    waterbody: undefined, // used for centered map
    measurementOutline: undefined,
    measurementDate: undefined,
    sensor_type: undefined,
  };

  componentDidMount() {
    window.addEventListener('resize', this.handleWindowSizeChange);
    this.initWaterbody();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowSizeChange);
  }

  componentDidUpdate(prevProps) {
    const { id, date } = this.props.params;

    if (this.props.navigate.action === 'POP') {
      if (prevProps.match.params.id !== id) {
        this.initWaterbody();
      } else if (date && prevProps.params.date !== date) {
        this.setMeasurementDate(id, moment(date, 'YYYY-MM-DD', true));
      }
    }
  }

  initWaterbody = () => {
    const { id } = this.props.params;
    if (id) {
      this.fetchWaterbody(id).catch(err => {
        if (err.response.status >= 400 && err.response.status <= 499) {
          console.log(`An error occurred, while fetching waterbody #${id}.`);
          this.fetchWaterbody(this.DEFAULT_WATERBODY_ID);
        }
      });
    } else {
      this.fetchWaterbody(this.DEFAULT_WATERBODY_ID);
    }
  };

  handleWindowSizeChange = () => {
    this.setState({ width: window.innerWidth });
  };

  setMeasurementDate = (waterbodyId, measurementDate, sensor_type) => {
    this.fetchMeasurementOutline(waterbodyId, measurementDate);
    this.setState({ measurementDate: measurementDate, sensor_type: sensor_type });
    let pathname = "";
    if (this.props.pathname !== pathname) {
      this.props.navigate(pathname);
    }
  };

  fetchWaterbody = (waterbodyId) => {
    this.setState({
      loading: true,
    });
    return axios
      .get(`${import.meta.env.VITE_BACKEND_ROOT_URI}/static/38784/All.json`)
      .then((res) => {
        if (!res.data.measurements) {
          throw new Error('Measurements field is missing in response data');
        }

        const validMeasurements = res.data.measurements.map((m) => ({
          ...m,
          date: moment.utc(m.date, 'YYYY-MM-DD'), // internal representation of dates is always moment.js object
        }));
        const waterbody = {
          ...res.data,
          measurements: validMeasurements,
        };

        const measurementDate =
          this.props.params.date &&
          validMeasurements.some((item) =>
            moment(item.date, 'YYYY-MM-DD').isSame(moment(this.props.params.date, 'YYYY-MM-DD'))
          )
            ? moment(this.props.params.date, 'YYYY-MM-DD')
            : validMeasurements[validMeasurements.length - 1].date; // or last measurement date

        const sensor =
          this.props.params.sensor_type &&
          validMeasurements.some((item) => item.sensor_type.isSame(moment(this.props.params.sensor_type, 'YYYY-MM-DD')))
            ? moment(this.props.params.sensor_type, 'YYYY-MM-DD')
            : validMeasurements[validMeasurements.length - 1].sensor_type;
        
        this.setState({
          waterbody: waterbody,
          measurementDate: measurementDate,
          loading: false,
          sensor_type: sensor,
        });
        this.setMeasurementDate(waterbodyId, measurementDate, sensor);
      })
      .catch((e) => {
        console.error('fetchWaterbody: ', e);
        throw e;
      });
  };

  fetchMeasurementOutline = (waterbodyId, date) => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_ROOT_URI}/static/38784/maps/${date.format('YYYY-MM-DD')}.json`)
      .then(res => {
        this.setState({
          measurementOutline: res.data,
        });
      })
      .catch(e => {
        if (e.response && e.response.status === 404) {
          console.error(`Measurement outline not found for date ${date.format('YYYY-MM-DD')}`);
        } else {
          console.error(`Error fetching measurement outline for date ${date.format('YYYY-MM-DD')}:`, e);
        }
        this.setState({
          measurementOutline: null,
        });
      });
  };

  render() {
    const {
      waterbody,
      measurementOutline,
      measurementDate,
      loading,
      sensor_type
    } = this.state;
    const today = new Date();
    return (
      <div id="app">
        <Header waterbody={waterbody} loading={loading} />
        <MeasureWrapper>
          {({ width, height }) => (
            <div id="content" className='m-0 p-0'>
              <div className="panel info bg-body-tertiary rounded">
                <WaterbodyInfo waterbody={waterbody} measurementDate={measurementDate} sensor={sensor_type} outline={measurementOutline} />
              </div>
              <div className="panel waterbody rounded">
                <WaterbodyMap
                  size={{ width, height }}
                  waterbody={waterbody}
                  measurementOutline={measurementOutline}
                  measurementDate={measurementDate}
                  onDateSelect={this.setMeasurementDate}
                  sensor={sensor_type}
                />
              </div>
            </div>
          )}
        </MeasureWrapper>

        <div className="panel chart bg-body-tertiary">
          <Chart
            waterbody={waterbody}
            onDateSelect={this.setMeasurementDate}
          />
        </div>

        <div id="footer2" className='bg-body-tertiary rounded-top '>
          <div className='row w-100'>
            <div className='col-md-6  text-start  mt-3'>
              <p className=''>
                This work was partially supported by <a href="http://www.cnrs.edu.lb/english/call-of-interest/calls-for-proposals-by-cnrs/sealacom-call-for-researchers" target="_blank" rel="noreferrer">SEALACOM.</a>
              </p>
              <p> © {today.getFullYear()}, <a href="https://geogroup.ai" target="_blank" rel="noreferrer">GEOspatial Artificial Intelligence (GEOAI) group</a><br></br> National Center for Remote Sensing, CNRS, Lebanon</p>
            </div>
            <div className='col-md-6'>
              <img src={`${import.meta.env.VITE_BACKEND_ROOT_URI}/media/cnrs_logo.png`} alt="Logo CNRS" style={{ maxWidth: '40%', maxHeight: 100, }} />
              <img src={`${import.meta.env.VITE_BACKEND_ROOT_URI}/media/ncrs_logo.png`} alt="Logo NCRS" style={{ maxWidth: '40%', maxHeight: 100, }} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;


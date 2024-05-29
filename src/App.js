import React from 'react';
import axios from 'axios';
import moment from 'moment';
import { SizeMe } from 'react-sizeme';
//import {  } from 'react-router';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
/** Components */
import WaterbodyMap from './WaterbodyMap';
import WaterbodyInfo from './WaterbodyInfo';
import Chart from './Chart';
import Header from './Header';
import Error404 from './Error404';

import './styles/App.scss';

class App extends React.Component {
  DEFAULT_WATERBODY_ID = 2307;

  state = {
    //width: window.innerWidth,
    // waterbodies: [],
    // searchString: '', 
    waterbody: undefined, // used for centered map
    measurementOutline: undefined,
    measurementDate: undefined,
    sensor_type: undefined,
  };

  componentDidMount() {
    window.addEventListener('resize', this.handleWindowSizeChange);
    //this.fetchWaterbodies();
    this.initWaterbody();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowSizeChange);
  }

  componentDidUpdate(prevProps) {
    const { id, date } = this.props.match.params;

    if (this.props.history.action === 'POP') {
      if (prevProps.match.params.id !== id) {
        this.initWaterbody();
      } else if (date && prevProps.match.params.date !== date) {
        this.setMeasurementDate(id, moment(date, 'YYYY-MM-DD', true));
      }
    }
  }

  initWaterbody = () => {
    /*  
     * Get id from url pathname param and fetch, if error, fetch default
     */
    const { id } = this.props.match.params;
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

  /**
  onWaterbodySelected = (id, searchString = '') => {
    this.setState({ searchString });
    this.fetchWaterbody(id);
  };

  onSearchStringChange = searchString => {
    this.setState({ searchString });
  }; */

  setMeasurementDate = (waterbodyId, measurementDate, sensor_type) => {
    this.fetchMeasurementOutline(waterbodyId, measurementDate);
    this.setState({ measurementDate: measurementDate,
     sensor_type: sensor_type});
    let pathname = "";
    if (this.props.location.pathname !== pathname) {
      this.props.history.push(pathname);
    }
  };

  /**
  fetchWaterbodies = () => {
    axios
      .get("http://localhost:3000/38784/waterbodies.json")
      .then(res => {
        // Sort on fetch resolve
        res.data.sort((a, b) => {
          // some waterbodies' names start with '????' - let's put them in the end:
          const labelA = a.name.toLowerCase().replace('?', 'zzz'); // handle this on backend
          const labelB = b.name.toLowerCase().replace('?', 'zzz');
          return labelA < labelB ? -1 : labelA > labelB ? 1 : 0;
        });

        this.setState({
          waterbodies: res.data,
        });
      })
      .catch(e => console.error(e));
  };*/

  //getting data from JSON file
  fetchWaterbody = waterbodyId => {
    this.setState({
      loading: true,
    });
    return axios
      .get(`${process.env.PUBLIC_URL}/static/38784/All.json`)
      .then(res => {
        const validMeasurements = 
          res.data.measurements.map(m => ({
          ...m,
          date: moment.utc(m.date, 'YYYY-MM-DD'), // internal representation of dates is always moment.js object
        }));
        const waterbody = {
          ...res.data,
          measurements: validMeasurements,
        };

        const measurementDate =
          this.props.match.params.date &&
          validMeasurements.some(item => moment(item.date, 'YYYY-MM-DD').isSame(moment(this.props.match.params.date, 'YYYY-MM-DD')))
            ? moment(this.props.match.params.date, 'YYYY-MM-DD')
            : validMeasurements[validMeasurements.length - 1].date; // or last measurement date
        
            const sensor =
            this.props.match.params.sensor_type &&
            validMeasurements.some(item => item.sensor_type.isSame(moment(this.props.match.params.sensor_type, 'YYYY-MM-DD')))
              ? moment(this.props.match.params.sensor_type, 'YYYY-MM-DD')
              : validMeasurements[validMeasurements.length - 1].sensor_type;
          console.log("fetch: "+sensor);
        this.setState({
          waterbody: waterbody,
          measurementDate: measurementDate,
          loading: false,
          sensor_type: sensor,
        });
        this.setMeasurementDate(waterbodyId, measurementDate, sensor);
      })
      .catch(e => {
        console.error('fetchWaterbody: ', e);
        throw e;
      });
  };

  fetchMeasurementOutline = (waterbodyId, date) => {
    axios
      .get(`${process.env.PUBLIC_URL}/static/38784/maps/${date.format('YYYY-MM-DD',)}.json`,)
      .then(res => {
        this.setState({
          measurementOutline: res.data,
        });
      })
      .catch(e => {console.error(e);
        this.setState({
          measurementOutline: null,
        });
      });
  };

  render() {
    const {
      //width,
      //waterbodies,
      waterbody,
      measurementOutline,
      measurementDate,
      //searchString,
      loading,
      sensor_type
    } = this.state;
    const today = new Date();
    return (
      <div id="app">
        <Header waterbody={waterbody} loading={loading} />
        <SizeMe monitorHeight>
          {({ size }) => (
            <div id="content" className='m-0 p-0'>
              <div className="panel info bg-body-tertiary rounded ">
                <WaterbodyInfo waterbody={waterbody} measurementDate={measurementDate} sensor={sensor_type} outline = {measurementOutline}/>
              </div>
              <div className="panel waterbody rounded">
                <WaterbodyMap
                  size={size}
                  waterbody={waterbody}
                  measurementOutline={measurementOutline}
                  measurementDate={measurementDate}
                  onDateSelect={this.setMeasurementDate}
                  sensor={sensor_type}
                />
              </div>
            </div>
          )}
        </SizeMe>

        <div className="panel chart bg-body-tertiary">
          <Chart
            waterbody={waterbody}
            onDateSelect = {this.setMeasurementDate}
          />
        </div>

        <div id="footer2" className='bg-body-tertiary rounded-top '>
            <div className='row w-100'>
            <div className='col-md-6  text-start  mt-3'>
            <p className=''>
            This work was partially supported by <a href="http://www.cnrs.edu.lb/english/call-of-interest/calls-for-proposals-by-cnrs/sealacom-call-for-researchers" target="_blank" rel="noreferrer">SEALACOM.</a>
            </p>
            <p> © {today.getFullYear()}, <a href="https://geogroup.ai" target="_blank" rel="noreferrer">GEOspatial Artificial Intelligence (GEOAI) group</a><br>
            </br> National Center for Remote Sensing, CNRS, Lebanon</p>
          </div>
          <div className='col-md-6'>
            <img src={`${process.env.PUBLIC_URL}/media/cnrs_logo.png`} alt="Logo CNRS"  style={{maxWidth: '40%',maxHeight: 100,}} />
            <img src={`${process.env.PUBLIC_URL}/media/ncrs_logo.png`} alt="Logo NCRS"  style={{maxWidth: '40%',maxHeight: 100,}}/>
          </div>
            </div>
          
        </div>


      </div>
    );
  }
}

const AppRoutes = () => (
  <BrowserRouter basename={process.env.REACT_APP_BASENAME}>
    <Switch>
      <Route path="/:id(\d+)?/:date(\d{4}-\d{2}-\d{2})?" exact component={App} />
      <Route component={Error404} />
    </Switch>
  </BrowserRouter>
);

export default AppRoutes;

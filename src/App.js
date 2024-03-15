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
        this.setMeasurementDate(id, moment(date));
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
          date: moment.utc(m.date), // internal representation of dates is always moment.js object
        }));
        const waterbody = {
          ...res.data,
          measurements: validMeasurements,
        };

        const measurementDate =
          this.props.match.params.date &&
          validMeasurements.some(item => moment(item.date).isSame(moment(this.props.match.params.date)))
            ? moment(this.props.match.params.date)
            : validMeasurements[validMeasurements.length - 1].date; // or last measurement date
        
            const sensor =
            this.props.match.params.sensor_type &&
            validMeasurements.some(item => item.sensor_type.isSame(moment(this.props.match.params.sensor_type)))
              ? moment(this.props.match.params.sensor_type)
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

    return (
      <div id="app">
        <Header waterbody={waterbody} loading={loading} />
        <SizeMe monitorHeight>
          {({ size }) => (
            <div id="content">
              <div className="panel info">
                <WaterbodyInfo waterbody={waterbody} measurementDate={measurementDate} sensor={sensor_type} outline = {measurementOutline}/>
              </div>
              <div className="panel waterbody">
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

        <div className="panel chart">
          <Chart
            waterbody={waterbody}
            onDateSelect = {this.setMeasurementDate}
          />
        </div>

        <div id="footer2">
	        <p>This work was kindly supported by <a href="http://www.cnrs.edu.lb/english/call-of-interest/calls-for-proposals-by-cnrs/sealacom-call-for-researchers" target="_blank" rel="noreferrer">SEALACOM.</a><br/>
	    We relied on both water-observatory <a href="https://github.com/sentinel-hub/water-observatory-frontend" target="_blank" rel="noreferrer">front-end</a> and <a href="https://github.com/sentinel-hub/water-observatory-backend" target="_blank" rel="noreferrer">back-end</a> while building this project.<br/>
          
          © 2023, <a href="https://geogroup.ai" target="_blank" rel="noreferrer">GEOspatial Artificial Intelligence (GEOAI) group</a>, National Center for Remote Sensing, CNRS, Lebanon
          <br/>
          <br/>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src={`${process.env.PUBLIC_URL}/media/cnrs_logo.png`} alt="Logo CNRS" width={'8%'} height={'8%'}/>
          <img src={`${process.env.PUBLIC_URL}/media/ncrs_logo.png`} alt="Logo NCRS" width={'8%'} height={'8%'}/>
          </div>
          </p>
          
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

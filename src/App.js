import React from 'react';
import axios from 'axios';
import moment from 'moment';
import { SizeMe } from 'react-sizeme';
import { BrowserRouter,Switch, Route } from 'react-router-dom';

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
    width: window.innerWidth,
    // waterbodies: [],
    // searchString: '', 
    waterbody: undefined, // used for centered map
    measurementOutline: undefined,
    measurementDate: undefined,
    htmlMap: undefined,
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
    console.log("in setMeasurementDate"+ sensor_type);
    this.fetchMap(measurementDate.format('YYYY-MM-DD'), sensor_type);
    //this.fetchMeasurementOutline(waterbodyId, measurementDate, sensor_type);
    this.setState({ measurementDate });

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

  onlyValidMeasurements(measurements, maxLevelTotal) {
    const validMeasurements = measurements.filter(
      //taking values from measurments where cc <= 0.02 and add them to validMeasurments
      m => m.cc <= 0.02, // && m.level <= maxLevelTotal && m.level <= m.max_level && m.level >= m.min_level, 
    );
    return validMeasurements;
  }

  //getting data from JSON file
  fetchWaterbody = waterbodyId => {
    this.setState({
      loading: true,
    });
    return axios
      .get(`${process.env.PUBLIC_URL}/static/38784/All.json`)
      .then(res => {
        const validMeasurements = this.onlyValidMeasurements(
          res.data.measurements,
          res.data.max_level_total,
        ).map(m => ({
          ...m,
          date: moment.utc(m.date), // internal representation of dates is always moment.js object
        }));
        console.log(res.data.properties.lat);
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
          console.log("Try: "+sensor);

        this.setState({
          waterbody: waterbody,
          measurementDate: measurementDate,
          loading: false,
        });
        this.setMeasurementDate(waterbodyId, measurementDate, sensor);
      })
      .catch(e => {
        console.error('fetchWaterbody: ', e);
        throw e;
      });
  };

  fetchMeasurementOutline = (waterbodyId, date, sensor_type) => {
    axios
      .get(`${process.env.PUBLIC_URL}/static/38784/maps/${date.format('YYYY-MM-DD',)}.json`,)
      .then(res => {
        this.setState({
          measurementOutline: res.data,
        });
        console.log("in fetchMeasurementOutline "+ sensor_type);
        
      })
      .catch(e =>console.error(e));
  };

  fetchMap = (date, sensor_type) => {
    console.log("in fetchMap"+ sensor_type);
    axios
    .get(`http://localhost:5000/data`, {
      params: {
        measurementDate: `${date}`,
        sensor_type: `${sensor_type}`,
      },
      'method':'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(res =>{
        this.setState({
          htmlMap: res.data
        })
        console.log("Response: "+ res.data)
    })
    .catch(error => {
      console.error('Error fetching map:', error);
    });
  }

  render() {
    const {
      width,
      //waterbodies,
      waterbody,
      measurementOutline,
      measurementDate,
      //searchString,
      loading,
      htmlMap,
    } = this.state;
    
  /*<WaterbodyMap
                  size={size}
                  waterbody={waterbody}
                  measurementOutline={measurementOutline}
                  measurementDate={measurementDate}
                  onDateSelect={this.setMeasurementDate}
                />*/
    return (
      <div id="app">
        <Header waterbody={waterbody} loading={loading} />
        <SizeMe monitorHeight>
          {({ size }) => (
            <div id="content">
              <div className="panel info" >
                <WaterbodyInfo waterbody={waterbody} measurementDate={measurementDate} />
              </div>
              <div className="panel waterbody" dangerouslySetInnerHTML={{ __html: htmlMap }}>
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
	        <p>This project was kindly supported by <a href="https://eo4society.esa.int/network-of-resources/nor-sponsorship/" target="_blank">NoR Sponsorship.</a><br/>
	    We relied on both water-observatory <a href="https://github.com/sentinel-hub/water-observatory-frontend" target="_blank">front-end</a> and <a href="https://github.com/sentinel-hub/water-observatory-backend" target="_blank">back-end</a> while building this project.<br/>
          
          © 2023, <a href="https://geogroup.ai" target="_blank">GEOspatial Artificial Intelligence (GEOAI) group</a>, National Center for Remote Sensing, CNRS, Lebanon</p>
          
          
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

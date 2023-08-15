import React from 'react';
import Loading from './Loading';

const Header = props => (
  <div id="header">
    {props.loading && props.waterbody && <Loading />}
    
  </div>
);

export default Header;

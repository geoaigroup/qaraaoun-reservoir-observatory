import React from 'react';
import Loading from './Loading';
import Logo from './imgs/logo.png';

const Header = props => (
  <div id="header">
    {props.loading && props.waterbody && <Loading />}
  </div>
);

export default Header;

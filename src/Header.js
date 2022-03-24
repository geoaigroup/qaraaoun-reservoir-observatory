import React from 'react';
import Loading from './Loading';
import Logo from './imgs/logo.png';

const Header = props => (
  <div id="header">
    <img src={Logo} alt="Bluedot water observatory" />
    {props.loading && props.waterbody && <Loading />}
  </div>
);

export default Header;

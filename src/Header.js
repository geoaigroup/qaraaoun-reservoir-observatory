import React from 'react';
import Loading from './Loading';
//import Logo2 from './imgs/logo.png';

const Header = props => (
  <div id="header">
    {props.loading && props.waterbody && <Loading />}
    
  </div>
);
//<img src={Logo} alt="Logo" />
export default Header;

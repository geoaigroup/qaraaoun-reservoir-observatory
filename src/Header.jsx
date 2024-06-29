import React, {Suspense} from 'react';
const Loading = React.lazy(() => import('./Loading'));

const Header = props => (
  <div id="header">
    {props.loading && props.waterbody && <Suspense fallback={<div>Loading...</div>}><Loading /></Suspense>}
    
  </div>
);

export default Header;

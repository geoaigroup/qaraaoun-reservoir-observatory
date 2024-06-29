import React, {Suspense} from 'react';
const Header = React.lazy(() => import('./Header'));

const Error404 = () => (
  <div id="app">
    <Suspense fallback={<div>Loading...</div>}>
    <Header />
    </Suspense>
    <p className="error-message">This page doesn't exist</p>
  </div>
);

export default Error404;

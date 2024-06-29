import React, {Suspense} from 'react';
import ReactDOM from 'react-dom';
const App = React.lazy(() => import('./App'));

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<Suspense fallback={<div>Loading...</div>}><App /></Suspense>, div);
  ReactDOM.unmountComponentAtNode(div);
});

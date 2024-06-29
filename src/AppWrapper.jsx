import React, {Suspense} from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
const App = React.lazy(() => import('./App')); 

const AppWrapper = () => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  return <Suspense fallback={<div>Loading...</div>}><App params={params} navigate={navigate} /></Suspense>;
};

export default AppWrapper;

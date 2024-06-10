import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import App from './App'; 

const AppWrapper = () => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  return <App params={params} navigate={navigate} />;
};

export default AppWrapper;

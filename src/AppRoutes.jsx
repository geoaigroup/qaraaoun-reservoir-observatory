import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppWrapper from './AppWrapper';
import Error404 from './Error404';
import ErrorBoundary from './ErrorBoundary';

const AppRoutes = () => (
  <BrowserRouter basename={import.meta.env.VITE_APP_BASENAME}>
    <ErrorBoundary>
      <Routes>
        <Route path="/:id(\\d+)?/:date(\\d{4}-\\d{2}-\\d{2})?" element={<AppWrapper />} />
        <Route path="*" element={<Error404 />} />
      </Routes>
    </ErrorBoundary>
  </BrowserRouter>
);

export default AppRoutes;


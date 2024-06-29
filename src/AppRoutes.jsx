import React, {Suspense} from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
const AppWrapper = React.lazy(() => import('./AppWrapper'));
const Error404 = React.lazy(() => import('./Error404'));
const ErrorBoundary = React.lazy(() => import('./ErrorBoundary'));

const AppRoutes = () => (
  <BrowserRouter basename={import.meta.env.VITE_APP_BASENAME}>
    <Suspense fallback={<div>Loading...</div>}>
    <ErrorBoundary>
      <Routes>
        <Route path="/:id(\\d+)?/:date(\\d{4}-\\d{2}-\\d{2})?" element={<Suspense fallback={<div>Loading...</div>}><AppWrapper /></Suspense>} />
        <Route path="*" element={<Suspense fallback={<div>Loading...</div>}><Error404 /></Suspense>} />
      </Routes>
    </ErrorBoundary>
    </Suspense>
  </BrowserRouter>
);

export default AppRoutes;


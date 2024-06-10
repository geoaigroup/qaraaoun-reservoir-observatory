import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import * as serviceWorker from './serviceWorker';
import AppRoutes from './AppRoutes';

// Create a root.
const container = document.getElementById('root');
const root = createRoot(container);

// Initial render
root.render(
 // <React.StrictMode>
    <AppRoutes/>
 // </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();


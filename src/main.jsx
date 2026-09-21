import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PublicPage } from './public/PublicPage';
import './styles.css';
const Admin = lazy(() => import('./admin/Admin'));
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<div className="loading">Finding your natural rhythm…</div>}>
        <Routes>
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<PublicPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
);

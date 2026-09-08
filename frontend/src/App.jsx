import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomeView from './views/HomeView';
import ExploreView from './views/ExploreView';
import PlanView from './views/PlanView';
import HostView from './views/HostView';
import DMOView from './views/DMOView';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-neutral-100 flex flex-col font-sans selection:bg-primary-100 selection:text-primary-900">
        {/* Sticky Global Navigation */}
        <Navbar />

        {/* View Routing */}
        <div className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/explore" element={<ExploreView />} />
            <Route path="/plan" element={<PlanView />} />
            <Route path="/host" element={<HostView />} />
            <Route path="/dmo" element={<DMOView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Global Footer */}
        <Footer />
      </div>
    </Router>
  );
}

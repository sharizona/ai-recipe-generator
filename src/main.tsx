import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

const App = lazy(() => import("./App"));
const PricingPage = lazy(() => import("./components/PricingPage").then((m) => ({ default: m.PricingPage })));
const SuccessPage = lazy(() => import("./components/SuccessPage").then((m) => ({ default: m.SuccessPage })));
const MyBookings = lazy(() => import("./components/MyBookings").then((m) => ({ default: m.MyBookings })));
const LazyZoomBooking = lazy(() => import("./components/ZoomBooking"));


// Import test utilities
import {
  updateCreditsForTesting,
  getCurrentUserCredits,
  createUserCredits
} from './utils/testUtils'

(window as any).updateCredits = updateCreditsForTesting;
(window as any).getCredits = getCurrentUserCredits;
(window as any).createCredits = createUserCredits;
console.log('🧪 Test utilities loaded! Available commands:');
console.log('  - updateCredits(amount) - Update credits to specified amount');
console.log('  - getCredits() - Get current credit balance');
console.log('  - createCredits(amount) - Create new UserCredits record');


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Authenticator>
      <BrowserRouter>
        <Suspense fallback={<div className="app-container"><p>Loading...</p></div>}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/book-session" element={<LazyZoomBooking />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Authenticator>
  </React.StrictMode>
);
Amplify.configure(outputs);

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import { PricingPage } from "./components/PricingPage";
import { SuccessPage } from "./components/SuccessPage";
import "./index.css";
import { Authenticator } from "@aws-amplify/ui-react";
import ZoomBooking  from './components/ZoomBooking';


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
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/book-session" element={<ZoomBooking />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Authenticator>
  </React.StrictMode>
);
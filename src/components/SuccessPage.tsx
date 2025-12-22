import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SuccessPage.css";

export function SuccessPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to home after 3 seconds
    const timer = setTimeout(() => {
      navigate("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="success-container">
      <div className="success-card">
        <div className="success-icon">✓</div>
        <h1>Payment Successful!</h1>
        <p>Your credits have been added to your account.</p>
        <p className="redirect-message">Redirecting you to the app...</p>
      </div>
    </div>
  );
}

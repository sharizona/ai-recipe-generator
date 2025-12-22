import { useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { Loader } from "@aws-amplify/ui-react";
import "./PricingPage.css";

const client = generateClient<Schema>();

const creditPackages = [
  { credits: 10, price: 9.99, popular: false },
  { credits: 25, price: 19.99, popular: true },
  { credits: 50, price: 34.99, popular: false },
  { credits: 100, price: 59.99, popular: false },
];

export function PricingPage() {
  const [loading, setLoading] = useState(false);

  const handlePurchase = async (credits: number) => {
    setLoading(true);
    try {
      const { data, errors } = await client.queries.createCheckoutSession({
        credits,
      });

      if (errors) {
        console.error("Error creating checkout session:", errors);
        alert("Failed to create checkout session");
        return;
      }

      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pricing-container">
      <h1 className="pricing-header">Choose Your Credit Package</h1>
      <p className="pricing-description">
        Purchase credits to generate amazing recipes with AI. Each credit generates one recipe.
      </p>

      <div className="pricing-grid">
        {creditPackages.map((pkg) => (
          <div
            key={pkg.credits}
            className={`pricing-card ${pkg.popular ? "popular" : ""}`}
          >
            {pkg.popular && <div className="popular-badge">Most Popular</div>}
            <h2 className="credits-amount">{pkg.credits} Credits</h2>
            <div className="price">
              <span className="price-dollar">$</span>
              <span className="price-amount">{pkg.price}</span>
            </div>
            <div className="price-per-credit">
              ${(pkg.price / pkg.credits).toFixed(2)} per recipe
            </div>
            <button
              className="purchase-button"
              onClick={() => handlePurchase(pkg.credits)}
              disabled={loading}
            >
              {loading ? <Loader size="small" /> : "Purchase"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

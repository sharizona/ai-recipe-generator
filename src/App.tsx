import { type FormEvent, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader, Placeholder } from "@aws-amplify/ui-react";
import "./App.css";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import { getCurrentUser } from "aws-amplify/auth";
import "@aws-amplify/ui-react/styles.css";

function App() {
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const amplifyClient = generateClient<Schema>();
  const navigate = useNavigate();

  // Fetch user credits on component mount
  useEffect(() => {
    fetchUserCredits();

    // Listen for credit updates from test utilities
    const handleCreditsUpdate = (event: CustomEvent) => {
      setCredits(event.detail.credits);
      console.log('Credits updated in UI:', event.detail.credits);
    };

    window.addEventListener('creditsUpdated', handleCreditsUpdate as EventListener);

    return () => {
      window.removeEventListener('creditsUpdated', handleCreditsUpdate as EventListener);
    };
  }, []);

  const fetchUserCredits = async () => {
    try {
      const user = await getCurrentUser();
      const { data: userCreditsList } = await amplifyClient.models.UserCredits.list({
        filter: { userId: { eq: user.userId } },
      });

      if (userCreditsList && userCreditsList.length > 0) {
        setCredits(userCreditsList[0].credits || 0);
      } else {
        // Create initial credits record with 0 credits
        const { data: newCredits } = await amplifyClient.models.UserCredits.create({
          userId: user.userId,
          credits: 0,
          email: user.signInDetails?.loginId,
        });
        setCredits(newCredits?.credits || 0);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
      setCredits(0);
    } finally {
      setLoadingCredits(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Check if user has credits
    if (credits === null || credits <= 0) {
      alert("You don't have enough credits. Please purchase credits first.");
      navigate("/pricing");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData(event.currentTarget);
      const { data, errors } = await amplifyClient.queries.askBedrock({
        ingredients: [formData.get("ingredients")?.toString() || ""],
      });

      if (!errors && data?.body) {
        setResult(data.body);

        // Deduct 1 credit after successful generation
        const user = await getCurrentUser();
        const { data: userCreditsList } = await amplifyClient.models.UserCredits.list({
          filter: { userId: { eq: user.userId } },
        });

        if (userCreditsList && userCreditsList.length > 0) {
          const userCreditsRecord = userCreditsList[0];
          await amplifyClient.models.UserCredits.update({
            id: userCreditsRecord.id,
            credits: (userCreditsRecord.credits || 0) - 1,
          });
          setCredits((prev) => (prev || 0) - 1);
        }
      } else {
        console.error("Full error details:", JSON.stringify(errors, null, 2));
        alert("Error occurred. Check browser console for details.");
      }
    } catch (e) {
      alert(`An error occurred: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingCredits) {
    return (
        <div className="app-container">
          <Loader size="large" />
          <p>Loading your account...</p>
        </div>
    );
  }

  return (
      <div className="app-container">
        <div className="credits-bar">
          <div className="credits-info">
            <span className="credits-label">Credits:</span>
            <span className="credits-amount">{credits}</span>
          </div>
          {/* ADD THE BUTTON GROUP HERE */}
          <div className="button-group">
            <button
                className="book-zoom-button"
                onClick={() => navigate("/book-session")}
            >
              📹 Book Zoom Session
            </button>
            <button className="buy-credits-button" onClick={() => navigate("/my-bookings")}>
              My Bookings
            </button>
            <button className="buy-credits-button" onClick={() => navigate("/pricing")}>
              Buy Credits
            </button>
          </div>
          {/* END OF BUTTON GROUP */}

        </div>

        <div className="header-container">
          <h1 className="main-header">
            Meet Your Personal
            <br />
            <span className="highlight">Recipe AI</span>
          </h1>
          <p className="description">
            Simply type a few ingredients using the format ingredient1,
            ingredient2, etc., and Recipe AI will generate an all-new recipe on
            demand...
          </p>
        </div>

        <form onSubmit={onSubmit} className="form-container">
          <div className="search-container">
            <input
                type="text"
                className="wide-input"
                id="ingredients"
                name="ingredients"
                placeholder="Ingredient1, Ingredient2, Ingredient3,...etc"
            />
            <button type="submit" className="search-button">
              Generate
            </button>
          </div>
        </form>

        <div className="result-container">
          {loading ? (
              <div className="loader-container">
                <p>Loading...</p>
                <Loader size="large" />
                <Placeholder size="large" />
                <Placeholder size="large" />
                <Placeholder size="large" />
              </div>
          ) : (
              result && <p className="result">{result}</p>
          )}
        </div>
      </div>
  );
}

export default App;

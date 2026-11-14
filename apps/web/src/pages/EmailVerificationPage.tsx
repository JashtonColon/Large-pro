import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  function handleVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("Verification submitted! Backend verification coming soon.");
  }

  return (
    <main className="login-page">
      <div className="login-card">

        {/* Branding */}
        <h1 className="login-brand">
          Knight Study Buddy
        </h1>

        <p className="login-subtitle">
          Almost there!
        </p>

        {/* Page Heading */}
        <h2 className="login-heading">
          Verify Your Email
        </h2>

        {/* Email Information */}
        <p className="login-message">
          Verification code sent to:
        </p>

        <p className="login-message">
          <strong>{email || "Your UCF email address"}</strong>
        </p>

        {/* Verification Form */}
        <form onSubmit={handleVerification}>

          <label className="login-field">
            Verification Code

            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter your code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
              maxLength={6}
              pattern="[0-9]{6}"
              title="Please enter a 6-digit verification code."
              className="login-input"
            />
          </label>

          <button
            type="submit"
            className="login-submit"
          >
            Verify Email
          </button>

        </form>

        {/* Response Message */}
        {message && (
          <p className="login-message">
            {message}
          </p>
        )}

        {/* Back to Login */}
        <div className="login-register">
          Already verified?{" "}

          <button
            type="button"
            onClick={() => navigate("/login")}
          >
            Log In
          </button>
        </div>

      </div>
    </main>
  );
}
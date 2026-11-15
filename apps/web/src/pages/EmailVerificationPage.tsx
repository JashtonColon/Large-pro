import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyEmail, sendVerification, errorMessage } from "../lib/authApi";
import { useCastleNavigate } from "../components/theme/Transitions";

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Email comes from the Register or Login page; if the user opened this
  // page directly, they can type it in.
  const emailFromState: string = location.state?.email || "";
  const [email, setEmail] = useState(emailFromState);

  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const go = useCastleNavigate();

  async function handleVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!/^\d{6}$/.test(code)) {
      setError("Please enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    try {
      await verifyEmail(email.trim(), code);
      setMessage("Email verified! Taking you to login...");
      setTimeout(() => go("/login", "sword"), 900);
    } catch (err) {
      setError(errorMessage(err)); // e.g. "Invalid or expired verification code."
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Enter your email address first.");
      return;
    }

    try {
      const result = await sendVerification(email.trim());
      setMessage(result.message);
    } catch (err) {
      setError(errorMessage(err));
    }
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
        {emailFromState ? (
          <>
            <p className="login-message">
              Verification code sent to:
            </p>
            <p className="login-message">
              <strong>{emailFromState}</strong>
            </p>
          </>
        ) : (
          <label className="login-field">
            UCF Email
            <input
              type="email"
              placeholder="yourname@ucf.edu"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="login-input"
            />
          </label>
        )}

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
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>

        </form>

        {/* Response Messages */}
        {error && (
          <p className="login-message" role="alert">
            {error}
          </p>
        )}

        {message && (
          <p className="login-message" role="status">
            {message}
          </p>
        )}

        {/* Resend + Back to Login */}
        <div className="login-register">
          Didn't get a code?{" "}
          <button type="button" onClick={handleResend}>
            Resend Code
          </button>
        </div>

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

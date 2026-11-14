import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    navigate("/verify-email", { state: { email } });
  }

  return (
    <main className="login-page">
      <section className="login-card register-card">
        <h1 className="login-brand">Knight Study Buddy</h1>
        <p className="login-subtitle">Begin your next study quest.</p>
        <h2 className="login-heading">Create Your Account</h2>

        <form onSubmit={handleRegister}>
          <div className="register-name-row">
            <label className="login-field" htmlFor="register-first-name">
              First Name
              <input
                id="register-first-name"
                className="login-input"
                type="text"
                placeholder="First name"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </label>

            <label className="login-field" htmlFor="register-last-name">
              Last Name
              <input
                id="register-last-name"
                className="login-input"
                type="text"
                placeholder="Last name"
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </label>
          </div>

          <label className="login-field" htmlFor="register-email">
            UCF Email
            <input
              id="register-email"
              className="login-input"
              type="email"
              placeholder="yourname@ucf.edu"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="login-field" htmlFor="register-password">
            Password
            <input
              id="register-password"
              className="login-input"
              type="password"
              placeholder="Create a password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <label className="login-field" htmlFor="register-confirm-password">
            Confirm Password
            <input
              id="register-confirm-password"
              className="login-input"
              type="password"
              placeholder="Enter your password again"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>

          {message && <p className="login-message" role="alert">{message}</p>}

          <button className="login-submit" type="submit">
            Create Account
          </button>
        </form>

        <p className="login-register">
          Already have an account?{" "}
          <button type="button" onClick={() => navigate("/login")}>
            Log In
          </button>
        </p>
      </section>
    </main>
  );
}

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Login submitted! Backend authentication is coming soon.");
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <h1 className="login-brand">Knight Study Buddy</h1>
        <p className="login-subtitle">Your next study quest starts here.</p>

        <h2 className="login-heading">Welcome, Knight!</h2>

        <form onSubmit={handleLogin}>
          <label className="login-field" htmlFor="login-email">
            UCF Email
            <input
              id="login-email"
              className="login-input"
              type="email"
              placeholder="yourname@ucf.edu"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="login-field" htmlFor="login-password">
            Password
            <input
              id="login-password"
              className="login-input"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button
            className="login-forgot"
            type="button"
            onClick={() => navigate("/forgot-password")}
          >
            Forgot Password?
          </button>

          <button className="login-submit" type="submit">
            Log In
          </button>

          {message && <p className="login-message" role="status">{message}</p>}
        </form>

        <p className="login-register">
          Don't have an account?{" "}
          <button type="button" onClick={() => navigate("/register")}>
            Create Account
          </button>
        </p>
      </section>
    </main>
  );
}

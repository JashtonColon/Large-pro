import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login, saveSession, ApiError, errorMessage } from "../lib/authApi";
import { getProfile } from "../lib/profileApi";
import AuthTabs from "../components/theme/AuthTabs";
import DragonAttack from "../components/theme/DragonAttack";
import GateBlock from "../components/theme/GateBlock";
import { useCastleNavigate } from "../components/theme/Transitions";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const go = useCastleNavigate();
  const [dragon, setDragon] = useState(0); // bump to play the dragon again
  const [gate, setGate] = useState(0); // bump to drop the gate again

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    setLoading(true);

    try {
      const result = await login(email.trim(), password);
      saveSession(result.token, result.user);

      // First login after verifying: set up the study profile before anything else
      const profile = await getProfile().catch(() => null);
      go(profile ? "/quests" : "/profile-setup", "fireball");
    } catch (error) {
      // 403 = correct password, but the email hasn't been verified yet
      if (error instanceof ApiError && error.status === 403) {
        navigate("/verify-email", { state: { email: email.trim() } });
        return;
      }
      setMessage(errorMessage(error));
      // Failed login: a non-UCF email gets the castle gate, a wrong
      // password gets the dragon. (Animation only; login logic is unchanged.)
      if (!email.trim().toLowerCase().endsWith("@ucf.edu")) {
        setGate((n) => n + 1);
      } else if (error instanceof ApiError && error.status === 401) {
        setDragon((n) => n + 1);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <DragonAttack playKey={dragon} />
      <GateBlock playKey={gate} />
      <section className="login-card">
        <h1 className="login-brand">Knight Study Buddy</h1>
        <p className="login-subtitle">Your next study quest starts here.</p>
        <AuthTabs active="login" />

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

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "Logging In..." : "Log In"}
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

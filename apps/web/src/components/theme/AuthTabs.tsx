// Sign Up / Log In switch on top of the auth cards, like the mobile app.

import { useNavigate } from "react-router-dom";

export default function AuthTabs({ active }: { active: "register" | "login" }) {
  const navigate = useNavigate();
  return (
    <div className="auth-tabs" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={active === "register"}
        className={`auth-tab ${active === "register" ? "active" : ""}`}
        onClick={() => active !== "register" && navigate("/register")}
      >
        ⚔ Sign Up
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === "login"}
        className={`auth-tab ${active === "login" ? "active" : ""}`}
        onClick={() => active !== "login" && navigate("/login")}
      >
        ⚿ Log In
      </button>
    </div>
  );
}

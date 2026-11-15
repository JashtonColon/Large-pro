// First page visitors see: what Knight Study Buddy is, how it works,
// and buttons to sign up or log in. Same content as the mobile welcome page.

import { useNavigate } from "react-router-dom";

const STEPS = [
  {
    icon: "✉",
    title: "Create your account",
    text: "Sign up with your @ucf.edu email and confirm it with a verification code.",
  },
  {
    icon: "⚑",
    title: "Find or post a quest",
    text: "Browse the Quest Board by course, or post what you need help with, when, and where.",
  },
  {
    icon: "⚔",
    title: "Join a study party",
    text: "Ask to join a quest. The author accepts, and your party is ready to meet.",
  },
];

const PERKS = [
  { icon: "📚", title: "Course matching", text: "See who is studying the same classes." },
  { icon: "🕑", title: "Schedule fit", text: "Quests that fit the times you are free." },
  { icon: "🛡", title: "UCF only", text: "Every member is verified with a UCF email." },
];

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <main className="welcome-page">
      <section className="welcome-hero">
        <p className="welcome-kicker">Built by Knights, for Knights · COP 4331</p>
        <h1 className="welcome-title">Knight Study Buddy</h1>
        <p className="welcome-tagline">Never study alone again.</p>
        <p className="welcome-lead">
          Knight Study Buddy connects UCF students taking the same courses. Post
          what you need help with, find quests that match your classes and free
          time, and form a study group in minutes.
        </p>
        <div className="welcome-actions">
          <button className="welcome-primary" onClick={() => navigate("/register")}>
            Create Account
          </button>
          <button className="welcome-secondary" onClick={() => navigate("/login")}>
            Log In
          </button>
        </div>
        <p className="welcome-note">
          Free for UCF students · @ucf.edu email required ·{" "}
          <button className="welcome-link" onClick={() => navigate("/about")}>
            What is Knight Study Buddy?
          </button>
        </p>
      </section>

      <section className="welcome-panel">
        <h2 className="welcome-panel-title">How it works</h2>
        <ol className="welcome-steps">
          {STEPS.map((step, i) => (
            <li key={step.title} className="welcome-step" style={{ animationDelay: `${0.3 + i * 0.15}s` }}>
              <span className="welcome-step-icon">{step.icon}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="welcome-panel">
        <h2 className="welcome-panel-title">Why Knight Study Buddy</h2>
        <div className="welcome-perks">
          {PERKS.map((perk, i) => (
            <div key={perk.title} className="welcome-perk" style={{ animationDelay: `${0.6 + i * 0.15}s` }}>
              <span className="welcome-perk-icon">{perk.icon}</span>
              <h3>{perk.title}</h3>
              <p>{perk.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

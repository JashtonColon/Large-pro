// Main page (/): what Knight Study Buddy is, who it's for and how it works,
// with Log In / Sign Up in the top-right corner.

import { useNavigate } from "react-router-dom";

const AUDIENCE = [
  { icon: "🎓", title: "Any UCF student", text: "Freshmen to grad students, in any major. If you have a @ucf.edu email, you're in." },
  { icon: "🚗", title: "Commuters and transfers", text: "New to campus or only here a few days a week? Find classmates without already knowing anyone." },
  { icon: "📖", title: "Hard-course survivors", text: "Calculus, Physics, CS I: the classes that are easier with a group before exams." },
  { icon: "🤝", title: "Students who want to help", text: "Already get the material? Post a quest and lead a session. Teaching is the best way to learn." },
];

const STEPS = [
  { title: "Create your account", text: "Sign up with your @ucf.edu email and confirm it with a 6-digit verification code." },
  { title: "Set up your profile", text: "Add your major, the courses you're taking, and the times you're free each week." },
  { title: "Find or post a quest", text: "Browse the Quest Board by course, or post what you need help with, when, and where." },
  { title: "Join a study party", text: "Ask to join a quest. The author accepts, and your group is ready to meet." },
];

const FEATURES = [
  { icon: "⚑", title: "Quest Board", text: "Post a study session (course, date, time, place, group size) or browse everyone else's." },
  { icon: "🔎", title: "Search", text: "Search quests by title or course code. Partial matches work, so \"cop43\" finds COP 4331." },
  { icon: "✨", title: "Matches for you", text: "Quests in your courses that fit inside the times you said you're free." },
  { icon: "🛡", title: "Join requests", text: "The quest author accepts or declines each request, so groups stay the right size." },
  { icon: "📱", title: "Web and mobile", text: "The same account works on this site and in the Android app." },
  { icon: "🔐", title: "Verified Knights only", text: "Every account confirms a UCF email, and logins use secure tokens." },
];

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <header className="landing-bar">
        <button className="landing-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <span className="landing-logo-big">Knight</span>
          <span className="landing-logo-small">Study Buddy</span>
        </button>
        <nav className="landing-auth">
          <button className="landing-login" onClick={() => navigate("/login")}>Log In</button>
          <button className="landing-signup" onClick={() => navigate("/register")}>Sign Up</button>
        </nav>
      </header>

      <main className="welcome-page landing-main">
        <section className="welcome-hero">
          <p className="welcome-kicker">Built by Knights, for Knights · COP 4331</p>
          <h1 className="welcome-title">Never study alone again.</h1>
          <p className="welcome-tagline">A study-group finder for UCF Knights.</p>
          <p className="welcome-lead">
            Finding a study group usually depends on already knowing people in
            your class. Knight Study Buddy fixes that: it's a quest board where
            UCF students post study sessions for their courses and join each
            other's, matched to the classes they take and the times they're free.
          </p>
          <p className="welcome-note">Free for UCF students · @ucf.edu email required</p>
        </section>

        <section className="welcome-panel">
          <h2 className="welcome-panel-title">Who it's for</h2>
          <div className="welcome-perks">
            {AUDIENCE.map((item, i) => (
              <div key={item.title} className="welcome-perk" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                <span className="welcome-perk-icon">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="welcome-panel">
          <h2 className="welcome-panel-title">How it works</h2>
          <ol className="welcome-steps">
            {STEPS.map((step, i) => (
              <li key={step.title} className="welcome-step" style={{ animationDelay: `${0.3 + i * 0.12}s` }}>
                <span className="welcome-step-icon">{i + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="welcome-panel">
          <h2 className="welcome-panel-title">What you can do</h2>
          <div className="welcome-perks">
            {FEATURES.map((item, i) => (
              <div key={item.title} className="welcome-perk" style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
                <span className="welcome-perk-icon">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="welcome-panel">
          <h2 className="welcome-panel-title">About the project</h2>
          <p className="about-text">
            Knight Study Buddy was built by a team of UCF students for COP 4331
            (Processes for Object-Oriented Software Development). It runs on the
            MERN stack: MongoDB, Express, React with TypeScript, and Node.js, with
            a Flutter mobile app that uses the same API.
          </p>
          <div className="welcome-actions">
            <button className="welcome-primary" onClick={() => navigate("/register")}>
              Begin Your Quest
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

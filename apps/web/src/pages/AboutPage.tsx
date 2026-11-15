// About page: what Knight Study Buddy is, who it's for, and how it works.
// Public (no login needed), linked from the welcome page and the navbar.

import { useNavigate } from "react-router-dom";

const AUDIENCE = [
  { icon: "🎓", title: "Any UCF student", text: "Freshmen to grad students, in any major. If you have a @ucf.edu email, you're in." },
  { icon: "🚗", title: "Commuters and transfers", text: "New to campus or only here a few days a week? Find classmates without already knowing anyone." },
  { icon: "📖", title: "Hard-course survivors", text: "Calculus, Physics, CS I: the classes that are easier with a group before exams." },
  { icon: "🤝", title: "Students who want to help", text: "Already get the material? Post a quest and lead a session. Teaching is the best way to learn." },
];

const FEATURES = [
  { icon: "⚑", title: "Quest Board", text: "Post a study session (course, date, time, place, group size) or browse everyone else's." },
  { icon: "🔎", title: "Search", text: "Search quests by title or course code. Partial matches work, so \"cop43\" finds COP 4331." },
  { icon: "✨", title: "For You matches", text: "Add your courses and weekly free times, and we show quests in your classes that fit your schedule." },
  { icon: "🛡", title: "Join requests", text: "Ask to join a quest. The author accepts or declines, so groups stay the right size." },
  { icon: "📱", title: "Web and mobile", text: "The same account works on this site and in the Android app." },
  { icon: "🔐", title: "Verified Knights only", text: "Every account confirms a UCF email with a 6-digit code, and logins use secure tokens." },
];

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <main className="welcome-page about-page">
      <section className="welcome-hero">
        <p className="welcome-kicker">About</p>
        <h1 className="welcome-title">Knight Study Buddy</h1>
        <p className="welcome-tagline">A study-group finder for UCF Knights.</p>
        <p className="welcome-lead">
          Studying alone is hard, and finding a study group usually depends on
          already knowing people in your class. Knight Study Buddy fixes that:
          it's a quest board where UCF students post study sessions for their
          courses and join each other's, matched to the classes they take and
          the times they're free.
        </p>
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
            Create Account
          </button>
          <button className="welcome-secondary" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
      </section>
    </main>
  );
}

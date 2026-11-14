import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";

type Quest = {
  id: number;
  course: string;
  title: string;
  description: string;
  schedule: string;
  location: string;
  spots: number;
  posted: string;
};

function readCreatedQuests(): Quest[] {
  try {
    return JSON.parse(localStorage.getItem("createdQuests") || "[]") as Quest[];
  } catch {
    return [];
  }
}

export default function CreateQuestPage() {
  const navigate = useNavigate();
  const [maxPeople, setMaxPeople] = useState(2);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const quest: Quest = {
      id: Date.now(),
      course: String(form.get("course")).trim().toUpperCase(),
      title: String(form.get("title")).trim(),
      description: String(form.get("description")).trim(),
      schedule: String(form.get("schedule")).trim(),
      location: String(form.get("location")).trim(),
      spots: maxPeople,
      posted: "Just now",
    };

    localStorage.setItem("createdQuests", JSON.stringify([...readCreatedQuests(), quest]));
    navigate("/quests");
  }

  return (
    <div className="create-quest-page">
      <DashboardNavbar />
      <main className="create-quest-overlay">
        <section className="create-quest-sheet">
          <div className="create-quest-handle" />
          <h1 className="create-quest-title">Post a Quest</h1>
          <p className="create-quest-subtitle">Tell other Knights what you need help with.</p>

          <form className="create-quest-form" onSubmit={handleSubmit}>
            <input className="create-quest-input" name="course" placeholder="Course (e.g. COP 4331)" maxLength={20} required />
            <input className="create-quest-input" name="title" placeholder="Quest title" maxLength={80} required />
            <textarea className="create-quest-textarea" name="description" placeholder="What will your group study?" maxLength={500} required />
            <input className="create-quest-input" name="schedule" placeholder="When? (e.g. Tue, 3–5 PM)" required />
            <input className="create-quest-input" name="location" placeholder="Where? (e.g. UCF Library)" required />

            <div>
              <span className="create-quest-spots-label">Maximum group size</span>
              <div className="create-quest-spots-options">
                {[2, 3, 4, 5, 6].map((number) => (
                  <button
                    key={number}
                    type="button"
                    className={`create-quest-spot-button ${maxPeople === number ? "selected" : ""}`}
                    onClick={() => setMaxPeople(number)}
                    aria-pressed={maxPeople === number}
                  >
                    {number}
                  </button>
                ))}
              </div>
            </div>

            <button className="create-quest-submit" type="submit">🛡 Pin It to the Board 🛡</button>
          </form>

          <button className="create-quest-cancel" type="button" onClick={() => navigate("/quests")}>
            Cancel
          </button>
        </section>
      </main>
    </div>
  );
}

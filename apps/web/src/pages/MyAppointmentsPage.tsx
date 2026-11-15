import { useState } from "react";
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
};

function readJoinedQuests(): Quest[] {
  try {
    return JSON.parse(localStorage.getItem("acceptedQuests") || "[]") as Quest[];
  } catch {
    return [];
  }
}

export default function MyAppointmentsPage() {
  const navigate = useNavigate();
  const [quests, setQuests] = useState(readJoinedQuests);

  function leaveQuest(id: number) {
    const updated = quests.filter((quest) => quest.id !== id);
    setQuests(updated);
    localStorage.setItem("acceptedQuests", JSON.stringify(updated));
  }

  return (
    <div className="quests-page">
      <DashboardNavbar />
      <div className="welcome-container">
        <div className="welcome-banner">
          <span className="welcome-icon">🛡</span>
          <p className="welcome-message">Your joined quests and upcoming study sessions.</p>
        </div>
      </div>

      <main className="appointment-board">
        <header className="appointment-heading">
          <h1>⚔ My Quests ⚔</h1>
          <p>Your next study adventures await, Knight.</p>
        </header>

        {quests.length === 0 ? (
          <div className="appointment-empty">
            <h2>No Quests Yet</h2>
            <p>Find a study group and join your first quest!</p>
            <button onClick={() => navigate("/quests")}>Explore Quests</button>
          </div>
        ) : (
          <section className="appointment-list">
            {quests.map((quest) => (
              <article className="appointment-card" key={quest.id}>
                <span className="quest-course">{quest.course}</span>
                <h2>{quest.title}</h2>
                <p>{quest.description}</p>
                <div className="appointment-details">
                  <span>◷ {quest.schedule}</span>
                  <span>♧ {quest.location}</span>
                  <span>Group limit: {quest.spots}</span>
                </div>
                <button onClick={() => leaveQuest(quest.id)}>Leave Quest</button>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

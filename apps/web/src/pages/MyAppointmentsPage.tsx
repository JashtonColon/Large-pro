
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";

type Quest = {
  id: number;
  course: string;
  title: string;
  description: string;
  schedule?: string;
  date?: string;
  startTime?: number;
  endTime?: number;
  location: string;
  spots: number;
};

function readQuests(storageKey: string): Quest[] {
  try {
    return JSON.parse(
      localStorage.getItem(storageKey) || "[]"
    ) as Quest[];
  } catch {
    return [];
  }
}

export default function MyAppointmentsPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"created" | "accepted">(
    "created"
  );

  const [acceptedQuests, setAcceptedQuests] = useState<Quest[]>(
    readQuests("acceptedQuests")
  );

  const [createdQuests, setCreatedQuests] = useState<Quest[]>(
    readQuests("createdQuests")
  );

  function leaveQuest(id: number) {
    if (!window.confirm("Are you sure you want to leave this quest?")) {
      return;
    }

    const updated = acceptedQuests.filter(
      (quest) => quest.id !== id
    );

    setAcceptedQuests(updated);
    localStorage.setItem("acceptedQuests", JSON.stringify(updated));
  }

  function deleteQuest(id: number) {
    if (!window.confirm("Are you sure you want to delete this quest?")) {
      return;
    }

    const updated = createdQuests.filter(
      (quest) => quest.id !== id
    );

    setCreatedQuests(updated);
    localStorage.setItem("createdQuests", JSON.stringify(updated));
  }

  function editQuest(quest: Quest) {
    // Pass the selected quest to the creation page for editing.
    navigate("/create-quest", {
      state: { quest },
    });
  }

  function displaySchedule(quest: Quest) {
    if (
      quest.date &&
      quest.startTime !== undefined &&
      quest.endTime !== undefined
    ) {
      function formatMinutes(minutes: number) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const period = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;

        return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
      }

      return `${quest.date} · ${formatMinutes(quest.startTime)} – ${formatMinutes(quest.endTime)}`;
    }

    return quest.schedule || "Schedule not provided";
  }

  const currentQuests =
    activeTab === "created" ? createdQuests : acceptedQuests;

  return (
    <div className="quests-page">
      <DashboardNavbar />

      <div className="welcome-container">
        <div className="welcome-banner">
          <span className="welcome-icon">🛡</span>
          <p className="welcome-message">
            Your joined quests and upcoming study sessions.
          </p>
        </div>
      </div>

      <main className="appointment-board">
        <header className="appointment-heading">
          <h1>⚔ My Quests ⚔</h1>
          <p>Your next study adventures await, Knight.</p>
        </header>

        {/* Quest section tabs */}
        <div className="my-quests-tabs">
          <button
            className={activeTab === "created" ? "active" : ""}
            onClick={() => setActiveTab("created")}
            type="button"
          >
            Created by Me ({createdQuests.length})
          </button>

          <button
            className={activeTab === "accepted" ? "active" : ""}
            onClick={() => setActiveTab("accepted")}
            type="button"
          >
            Accepted ({acceptedQuests.length})
          </button>
        </div>

        {/* Empty state */}
        {currentQuests.length === 0 ? (
          <div className="appointment-empty">
            <h2>
              {activeTab === "created"
                ? "No Quests Created Yet"
                : "No Accepted Quests Yet"}
            </h2>

            <p>
              {activeTab === "created"
                ? "Create a quest and invite other Knights to study!"
                : "Find a study group and join your first quest!"}
            </p>

            <button
              onClick={() =>
                navigate(
                  activeTab === "created"
                    ? "/create-quest"
                    : "/quests"
                )
              }
            >
              {activeTab === "created"
                ? "Create a Quest"
                : "Explore Quests"}
            </button>
          </div>
        ) : (
          <section className="appointment-list">
            {currentQuests.map((quest) => (
              <article className="appointment-card" key={quest.id}>
                <span className="quest-course">
                  {quest.course}
                </span>

                <h2>{quest.title}</h2>

                <p>{quest.description}</p>

                <div className="appointment-details">
                  <span>◷ {displaySchedule(quest)}</span>
                  <span>♧ {quest.location}</span>
                  <span>Group limit: {quest.spots}</span>
                </div>

                {activeTab === "created" ? (
                  <div className="my-quest-actions">
                    <button
                      type="button"
                      onClick={() => editQuest(quest)}
                    >
                      Edit Quest
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteQuest(quest.id)}
                    >
                      Delete Quest
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => leaveQuest(quest.id)}
                  >
                    Leave Quest
                  </button>
                )}
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

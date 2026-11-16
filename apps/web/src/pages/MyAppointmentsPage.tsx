import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";
import { errorMessage } from "../lib/authApi";
import {
  searchQuests,
  deleteQuest,
  leaveQuest,
  getJoinRequests,
  reviewJoinRequest,
  formatDay,
  timeRange,
  currentUserId,
  hasRequested,
  type Quest,
  type JoinRequest,
} from "../lib/questApi";

export default function MyAppointmentsPage() {
  const navigate = useNavigate();
  const userId = currentUserId();

  const [activeTab, setActiveTab] = useState<"created" | "accepted">("created");
  const [quests, setQuests] = useState<Quest[]>([]);
  const [requests, setRequests] = useState<Record<string, JoinRequest[]>>({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Load every quest from the server, then keep the ones that involve me.
  // For my own quests, also load who has asked to join.
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const all = await searchQuests("");
        const mine = all.filter(
          (quest) =>
            quest.author === userId ||
            quest.members.includes(userId) ||
            hasRequested(quest, userId)
        );
        setQuests(mine);

        const pending: Record<string, JoinRequest[]> = {};
        for (const quest of mine) {
          if (quest.author === userId && (quest.joinRequests ?? []).length > 0) {
            pending[quest._id] = await getJoinRequests(quest._id);
          }
        }
        setRequests(pending);
      } catch (error) {
        setNotice(errorMessage(error));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId, refreshKey]);

  const createdQuests = quests.filter((quest) => quest.author === userId);
  const acceptedQuests = quests.filter((quest) => quest.author !== userId);
  const currentQuests = activeTab === "created" ? createdQuests : acceptedQuests;

  // Runs an action, shows the server's message, then reloads the lists
  async function runAction(action: () => Promise<{ message: string }>) {
    setNotice("");
    try {
      const result = await action();
      setNotice(result.message);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  function editQuest(quest: Quest) {
    // Pass the selected quest to the creation page for editing.
    navigate("/create-quest", { state: { quest } });
  }

  function displaySchedule(quest: Quest) {
    return `${formatDay(quest.day)} · ${timeRange(quest.startTime, quest.endTime)}`;
  }

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

        {notice && <p className="quest-notice" role="status">{notice}</p>}

        {loading ? (
          <div className="appointment-empty"><p>Loading your quests...</p></div>
        ) : currentQuests.length === 0 ? (
          <div className="appointment-empty">
            <h2>
              {activeTab === "created" ? "No Quests Created Yet" : "No Accepted Quests Yet"}
            </h2>

            <p>
              {activeTab === "created"
                ? "Create a quest and invite other Knights to study!"
                : "Find a study group and join your first quest!"}
            </p>

            <button onClick={() => navigate(activeTab === "created" ? "/create-quest" : "/quests")}>
              {activeTab === "created" ? "Create a Quest" : "Explore Quests"}
            </button>
          </div>
        ) : (
          <section className="appointment-list">
            {currentQuests.map((quest) => (
              <article className="appointment-card" key={quest._id}>
                <span className="quest-course">{quest.subject}</span>

                <h2>{quest.title}</h2>

                <p>{quest.description}</p>

                <div className="appointment-details">
                  <span>◷ {displaySchedule(quest)}</span>
                  <span>♧ {quest.location}</span>
                  <span>Members: {quest.members.length}/{quest.maxMember}</span>
                </div>

                {activeTab === "created" ? (
                  <>
                    {/* People waiting for the author's answer */}
                    {(requests[quest._id] ?? []).map((person) => (
                      <div className="my-quest-actions" key={person._id}>
                        <span>{person.firstName} {person.lastName} wants to join</span>
                        <button
                          type="button"
                          onClick={() => runAction(() => reviewJoinRequest(quest._id, person._id, "accept"))}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => runAction(() => reviewJoinRequest(quest._id, person._id, "deny"))}
                        >
                          Deny
                        </button>
                      </div>
                    ))}

                    <div className="my-quest-actions">
                      <button type="button" onClick={() => editQuest(quest)}>
                        Edit Quest
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this quest?")) {
                            runAction(() => deleteQuest(quest._id));
                          }
                        }}
                      >
                        Delete Quest
                      </button>
                    </div>
                  </>
                ) : hasRequested(quest, userId) ? (
                  <button type="button" className="quest-pending-button" disabled>
                    ⏳ Request Pending
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to leave this quest?")) {
                        runAction(() => leaveQuest(quest._id));
                      }
                    }}
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

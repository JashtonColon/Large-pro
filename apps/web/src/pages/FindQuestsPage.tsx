import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";
import { errorMessage } from "../lib/authApi";
import {
  searchQuests,
  joinQuest,
  leaveQuest,
  timeRange,
  formatDay,
  currentUserId,
  hasRequested,
  type Quest,
} from "../lib/questApi";

const filters = ["All", "COP", "CDA", "CHM", "COT"];

export default function FindQuestsPage() {
  const navigate = useNavigate();
  const userId = currentUserId();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Ask the SERVER for matching quests whenever the search text changes.
  // The 300 ms delay ("debounce") waits until the user pauses typing,
  // so we don't send a request for every single key press.
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        setQuests(await searchQuests(search));
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer); // cancel if the user types again
  }, [search, refreshKey]);

  // Course-prefix buttons narrow the server's results in the browser
  const visibleQuests = quests.filter(
    (quest) => filter === "All" || quest.subject.toUpperCase().startsWith(filter)
  );

  // Runs a join/leave/delete action, shows its message, then reloads the list
  async function runAction(action: () => Promise<{ message: string }>) {
    setNotice("");
    try {
      const result = await action();
      setNotice(result.message);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      setNotice(errorMessage(err));
    }
  }

  function renderAction(quest: Quest) {
    // Your own quests are edited or deleted from the My Quests page
    if (quest.author === userId) {
      return <span className="quest-owner-label">Your Quest ✓</span>;
    }
    if (quest.members.includes(userId)) {
      return (
        <button type="button" className="quest-join-button joined" onClick={() => runAction(() => leaveQuest(quest._id))}>
          Joined ✓ (Leave)
        </button>
      );
    }
    if (hasRequested(quest, userId)) {
      return <button type="button" className="quest-join-button pending" disabled>⏳ Request Pending</button>;
    }
    const full = quest.status !== "open" || quest.members.length >= quest.maxMember;
    return (
      <button type="button" className="quest-join-button" disabled={full} onClick={() => runAction(() => joinQuest(quest._id))}>
        {full ? "Full" : "Join Quest"}
      </button>
    );
  }

  return (
    <div className="quests-page">
      <DashboardNavbar />

      <div className="welcome-container">
        <div className="welcome-banner">
          <span className="welcome-icon">🛡</span>
          <p className="welcome-message">Welcome, Knight! Find a study group or post your own quest.</p>
        </div>
      </div>

      <main className="quest-board">
        <header className="quest-board-heading">
          <h1 className="quest-board-title">♧ Quest Board ♧</h1>
          <p className="quest-board-subtitle">Knights seeking study partners</p>
        </header>

        <section className="quest-controls" aria-label="Search quests">
          <label className="quest-search">
            <span className="quest-search-icon">⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search quests by title"
              aria-label="Search quests"
            />
          </label>

          <div className="quest-filters" aria-label="Filter by course prefix">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                className={`quest-filter ${filter === item ? "active" : ""}`}
                onClick={() => setFilter(item)}
                aria-pressed={filter === item}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {notice && <p className="quest-notice" role="status">{notice}</p>}

        <section className="quest-list" aria-live="polite">
          {loading ? (
            <div className="no-quests"><p>Loading quests...</p></div>
          ) : error ? (
            <div className="no-quests"><h2>Couldn't load quests</h2><p>{error}</p></div>
          ) : visibleQuests.length ? visibleQuests.map((quest) => (
            <article className="quest-card" key={quest._id}>
              <span className="quest-pushpin" />
              <div className="quest-card-top">
                <span className="quest-course">{quest.subject}</span>
                <span className="quest-posted">{quest.author === userId ? "Your quest" : quest.status}</span>
              </div>
              <h2 className="quest-title">{quest.title}</h2>
              {quest.description && <p className="quest-description">{quest.description}</p>}
              <div className="quest-details">
                <div className="quest-detail">
                  <span>◷</span>
                  <span>{formatDay(quest.day)}, {timeRange(quest.startTime, quest.endTime)}</span>
                </div>
                <div className="quest-detail"><span>♧</span><span>{quest.location}</span></div>
              </div>
              <div className="quest-bottom">
                <div className="quest-card-actions">
                  <span className="quest-spots">{quest.members.length}/{quest.maxMember} members</span>
                  {renderAction(quest)}
                </div>
              </div>
            </article>
          )) : (
            <div className="no-quests">
              <h2>No Quests Found</h2>
              <p>Try another search, or post the first quest!</p>
            </div>
          )}
        </section>
      </main>

      <button className="post-quest-button" onClick={() => navigate("/create-quest")}>
        ⚑ Post a Quest
      </button>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";
import { errorMessage } from "../lib/authApi";
import { timeToMinutes } from "../lib/profileApi";
import { COURSE_PREFIXES, isValidCourseNumber } from "../lib/courses";
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

export default function FindQuestsPage() {
  const navigate = useNavigate();
  const userId = currentUserId();

  const [search, setSearch] = useState("");
  // Course filter: pick a prefix + type a number, then press Filter
  const [prefix, setPrefix] = useState("");
  const [courseNumber, setCourseNumber] = useState("");
  const [filter, setFilter] = useState("All");   // the applied course, e.g. "COP4331"
  const [filterError, setFilterError] = useState("");
  const [fromTime, setFromTime] = useState("");   // "13:00" from <input type="time">
  const [toTime, setToTime] = useState("");
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  function applyCourseFilter() {
    if (!prefix || !courseNumber.trim()) {
      setFilterError("Choose a prefix and enter a course number.");
      return;
    }
    if (!isValidCourseNumber(courseNumber)) {
      setFilterError("Course number should be 4 digits, like 4331 (or 2048L).");
      return;
    }
    setFilterError("");
    setFilter(`${prefix}${courseNumber.trim()}`.toUpperCase());   // "COP" + "4331"
  }

  function clearCourseFilter() {
    setPrefix("");
    setCourseNumber("");
    setFilterError("");
    setFilter("All");
  }

  const timeRangeInvalid = fromTime !== "" && toTime !== "" && toTime <= fromTime;

  // Ask the SERVER for matching quests whenever the search text or filters change.
  // The 300 ms delay ("debounce") waits until the user pauses typing,
  // so we don't send a request for every single key press.
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (timeRangeInvalid) return; // wait until the range makes sense
      setLoading(true);
      setError("");
      try {
        setQuests(
          await searchQuests(search, {
            course: filter === "All" ? undefined : filter,
            startTime: fromTime ? timeToMinutes(fromTime) : undefined,
            endTime: toTime ? timeToMinutes(toTime) : undefined,
          })
        );
      } catch (err) {
        setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer); // cancel if the user types again
  }, [search, filter, fromTime, toTime, timeRangeInvalid, refreshKey]);

  const visibleQuests = quests;

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

          <div className="quest-course-filter" aria-label="Filter by course">
            <select value={prefix} onChange={(e) => setPrefix(e.target.value)} aria-label="Course prefix">
              <option value="">Prefix</option>
              {COURSE_PREFIXES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <input
              value={courseNumber}
              onChange={(e) => setCourseNumber(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") applyCourseFilter(); }}
              placeholder="Number, e.g. 4331"
              maxLength={5}
              aria-label="Course number"
            />
            <button type="button" className="quest-filter active" onClick={applyCourseFilter}>
              Filter
            </button>
            {filter !== "All" && (
              <button type="button" className="quest-filter" onClick={clearCourseFilter}>
                Showing {filter} ✕
              </button>
            )}
          </div>
          {filterError && <p className="quest-notice" role="alert">{filterError}</p>}

          {/* Time window: only quests that start and end inside it (searched on the server) */}
          <div className="quest-time-filter">
            <label>
              From
              <input type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} />
            </label>
            <label>
              To
              <input type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} />
            </label>
            {(fromTime || toTime) && (
              <button type="button" onClick={() => { setFromTime(""); setToTime(""); }}>
                Clear times
              </button>
            )}
          </div>
          {timeRangeInvalid && (
            <p className="quest-notice" role="alert">"To" must be later than "From".</p>
          )}
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
              <p>Try another search or filter, or post the first quest!</p>
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

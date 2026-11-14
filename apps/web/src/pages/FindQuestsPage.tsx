import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";

type Quest = {
  id: number;
  course: string;
  title: string;
  description: string;
  courseDescription?: string;
  schedule: string;
  location: string;
  reward?: string;
  spots: number;
  posted: string;
};

const sampleQuests: Quest[] = [
  {
    id: 1,
    course: "COP 4331",
    title: "Seeking 2 Brave Souls for the Large Project",
    courseDescription: "Processes for Object-Oriented Software Development",
    description: "Building a MERN app and looking for people to work on the API and mobile app. React or Flutter experience is a plus!",
    schedule: "Tue & Thu, 3–5 PM",
    location: "Library, 3rd floor",
    reward: "Eternal gratitude + pizza",
    spots: 3,
    posted: "12m ago",
  },
  {
    id: 2,
    course: "COT 3100",
    title: "Proofs by Induction Study Group",
    courseDescription: "Introduction to Discrete Structures",
    description: "Let's work through practice problems and prepare for Exam 2 together.",
    schedule: "Wed, 6–8 PM",
    location: "Student Union",
    reward: "Snacks provided",
    spots: 4,
    posted: "40m ago",
  },
  {
    id: 3,
    course: "COP 3502",
    title: "Data Structures Exam Prep",
    courseDescription: "Computer Science I",
    description: "Review recursion, linked lists, trees, and sorting algorithms before the exam.",
    schedule: "Mon, 4–6 PM",
    location: "Engineering Building",
    reward: "Good study vibes",
    spots: 5,
    posted: "1h ago",
  },
  {
    id: 4,
    course: "CHM 2045",
    title: "General Chemistry Exam Prep",
    courseDescription: "Chemistry Fundamentals I",
    description: "Work through practice problems and review difficult topics together.",
    schedule: "Fri, 2–4 PM",
    location: "Library",
    reward: "Coffee on me",
    spots: 3,
    posted: "2h ago",
  },
  {
    id: 5,
    course: "CDA 3103",
    title: "Computer Logic and Architecture",
    courseDescription: "Computer Logic and Organization",
    description: "Review datapaths, control signals, and assembly before the test.",
    schedule: "Thu, 5–7 PM",
    location: "Engineering Building",
    reward: "Snacks provided",
    spots: 4,
    posted: "3h ago",
  },
];

const filters = ["All", "COP", "CDA", "CHM", "COT"];

function readQuests(key: string): Quest[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as Quest[];
  } catch {
    return [];
  }
}

export default function FindQuestsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [createdQuests] = useState(() => readQuests("createdQuests"));
  const [joinedQuests, setJoinedQuests] = useState(() => readQuests("acceptedQuests"));

  const quests = [...createdQuests, ...sampleQuests];
  const joinedIds = joinedQuests.map((quest) => quest.id);

  const visibleQuests = useMemo(() => {
    const query = search.toLowerCase().replace(/\s/g, "");

    return quests.filter((quest) => {
      const text = [quest.course, quest.title, quest.description, quest.courseDescription, quest.location]
        .join(" ")
        .toLowerCase()
        .replace(/\s/g, "");
      const matchesSearch = text.includes(query);
      const matchesFilter = filter === "All" || quest.course.toUpperCase().startsWith(filter);
      return matchesSearch && matchesFilter;
    });
  }, [createdQuests, search, filter]);

  function toggleJoin(quest: Quest) {
    const alreadyJoined = joinedIds.includes(quest.id);
    const updated = alreadyJoined
      ? joinedQuests.filter((item) => item.id !== quest.id)
      : [...joinedQuests, quest];

    setJoinedQuests(updated);
    localStorage.setItem("acceptedQuests", JSON.stringify(updated));
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
              placeholder="Search by course, topic, or title"
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

        <section className="quest-list" aria-live="polite">
          {visibleQuests.length ? visibleQuests.map((quest) => {
            const joined = joinedIds.includes(quest.id);
            return (
              <article className="quest-card" key={quest.id}>
                <span className="quest-pushpin" />
                <div className="quest-card-top">
                  <span className="quest-course">{quest.course}</span>
                  <span className="quest-posted">{quest.posted}</span>
                </div>
                <h2 className="quest-title">{quest.title}</h2>
                {quest.courseDescription && <p className="quest-course-description">{quest.courseDescription}</p>}
                <p className="quest-description">{quest.description}</p>
                <div className="quest-details">
                  <div className="quest-detail"><span>◷</span><span>{quest.schedule}</span></div>
                  <div className="quest-detail"><span>♧</span><span>{quest.location}</span></div>
                </div>
                <div className="quest-bottom">
                  {quest.reward && <p className="quest-reward"><span className="quest-reward-icon">🏆</span>{quest.reward}</p>}
                  <div className="quest-card-actions">
                    <span className="quest-spots">Max {quest.spots} people</span>
                    <button
                      type="button"
                      className={`quest-join-button ${joined ? "joined" : ""}`}
                      onClick={() => toggleJoin(quest)}
                    >
                      {joined ? "Joined ✓" : "Join Quest"}
                    </button>
                  </div>
                </div>
              </article>
            );
          }) : (
            <div className="no-quests">
              <h2>No Quests Found</h2>
              <p>Try another search or course filter.</p>
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

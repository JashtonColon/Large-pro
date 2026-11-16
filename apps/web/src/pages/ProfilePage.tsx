import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";
import { getProfile } from "../lib/profileApi";

interface User {
  firstName?: string;
  lastName?: string;
  name?: string;
  fullName?: string;
  email?: string;
  ucfEmail?: string;
}

export default function ProfilePage() {
  // Get the logged-in user's information
  const [user] = useState<User>(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  // Major comes from the student's profile on the server
  const [major, setMajor] = useState("");

  useEffect(() => {
    getProfile()
      .then((profile) => setMajor(profile?.major ?? ""))
      .catch(() => setMajor(""));
  }, []);

  // Determine the name and email to display
  const fullName =
    user.firstName || user.lastName
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : user.fullName || user.name || "Student";

  const email = user.email || user.ucfEmail || "No email available";

  return (
    <>
      <DashboardNavbar />

      <main className="profile-page">
        <div className="profile-content">
          <header className="profile-heading">
            <h1>My Profile</h1>
            <p>View your account information and manage your study information.</p>
          </header>

          {/* Personal Information */}
          <section className="profile-panel">
            <div className="profile-user-heading">
              <div className="profile-avatar">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2>{fullName}</h2>
                <p>{major ? `${major} · UCF Student` : "UCF Student"}</p>
              </div>
            </div>

            <div className="profile-info-grid">
              <div className="profile-info-item">
                <span>Full Name</span>
                <p>{fullName}</p>
              </div>
              <div className="profile-info-item">
                <span>UCF Email</span>
                <p>{email}</p>
              </div>
            </div>
          </section>

          {/* Academic Information */}
          <section className="profile-panel">
            <div className="profile-section-heading">
              <h2>Academic Information</h2>
              <p>Your major and courses help other students find compatible study partners.</p>
            </div>

            <div className="profile-preference-control">
              <label>Major</label>
              <p>{major || "No major added yet."}</p>
            </div>
          </section>

          {/* Study Information Links */}
          <section className="profile-study-section">
            <div className="profile-section-heading">
              <h2>My Study Information</h2>
              <p>
                Manage the information Study Buddy uses to help you find
                study partners.
              </p>
            </div>

            <div className="profile-link-grid">
              <Link to="/courses" className="profile-link-card">
                <div className="profile-link-icon">📚</div>
                <h3>My Courses</h3>
                <p>
                  Add, edit, or remove the UCF courses you're currently taking.
                </p>
                <span>Manage Courses →</span>
              </Link>

              <Link to="/availability" className="profile-link-card">
                <div className="profile-link-icon">📅</div>
                <h3>My Availability</h3>
                <p>
                  Set and manage the times you're available to study each week.
                </p>
                <span>Manage Availability →</span>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

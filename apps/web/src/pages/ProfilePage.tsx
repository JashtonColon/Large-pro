import { useState } from "react";
import { Link } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";

interface User {
  firstName?: string;
  lastName?: string;
  name?: string;
  fullName?: string;
  email?: string;
  ucfEmail?: string;
  genderPreference?: string;
}

export default function ProfilePage() {
  // Get the logged-in user's information
  const [user, setUser] = useState<User>(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  const [genderPreference, setGenderPreference] = useState(
    user.genderPreference || "No Preference"
  );
  const [saved, setSaved] = useState(false);

  // Determine the name and email to display
  const fullName =
    user.firstName || user.lastName
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : user.fullName || user.name || "Student";

  const email = user.email || user.ucfEmail || "No email available";

  // Save updated preferences
  const handleSave = () => {
    const updatedUser = { ...user, genderPreference };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setSaved(true);
  };

  return (
    <>
      <DashboardNavbar />

      <main className="profile-page">
        <div className="profile-content">
          <header className="profile-heading">
            <h1>My Profile</h1>
            <p>View your account information and manage your study preferences.</p>
          </header>

          {/* Personal Information */}
          <section className="profile-panel">
            <div className="profile-user-heading">
              <div className="profile-avatar">
                {fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2>{fullName}</h2>
                <p>UCF Student</p>
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

          {/* Study Preferences */}
          <section className="profile-panel">
            <div className="profile-section-heading">
              <h2>Study Preferences</h2>
              <p>
                Customize your preferences to help Study Buddy find compatible
                study partners.
              </p>
            </div>

            <div className="profile-preference-control">
              <label htmlFor="genderPreference">
                Preferred Gender of Study Partners
              </label>
              <select
                id="genderPreference"
                value={genderPreference}
                onChange={(event) => {
                  setGenderPreference(event.target.value);
                  setSaved(false);
                }}
              >
                <option value="No Preference">No Preference</option>
                <option value="Women">Women</option>
                <option value="Men">Men</option>
              </select>
              <p>
                This preference will be used when suggesting potential study
                partners.
              </p>
            </div>

            <div className="profile-save-row">
              <button className="profile-save-button" onClick={handleSave}>
                {saved ? "✓ Preferences Saved" : "Save Preferences"}
              </button>
            </div>
          </section>

          {/* Study Information Links */}
          <section className="profile-study-section">
            <div className="profile-section-heading">
              <h2>My Study Information</h2>
              <p>
                Manage the information Study Buddy uses to find your study
                partners.
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

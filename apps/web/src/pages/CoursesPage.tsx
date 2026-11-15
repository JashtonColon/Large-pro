import { useEffect, useState } from "react";
import DashboardNavbar from "../components/DashboardNavbar";
import { errorMessage } from "../lib/authApi";
import { getProfile, updateProfile } from "../lib/profileApi";

// The server stores only course codes (used for matching students).
// Course names and terms are extra details kept in this browser.
const DETAILS_KEY = "courseDetails";

function loadDetails(): Record<string, { courseName: string; term: string }> {
  try {
    return JSON.parse(localStorage.getItem(DETAILS_KEY) || "{}");
  } catch {
    return {};
  }
}

const normalize = (code: string) => code.replace(/\s+/g, "").toUpperCase();

interface Course {
  id: string;
  courseCode: string;
  courseName: string;
  term: string;
}

const emptyCourse = {
  courseCode: "",
  courseName: "",
  term: "",
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState(emptyCourse);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Load the saved courses from the server when the page opens
  useEffect(() => {
    getProfile()
      .then((profile) => {
        const details = loadDetails();
        setCourses(
          (profile?.courses ?? []).map((code) => ({
            id: code,
            courseCode: code,
            courseName: details[code]?.courseName ?? "",
            term: details[code]?.term ?? "",
          }))
        );
      })
      .catch((error) => setMessage(errorMessage(error)));
  }, []);

  // Save a new course list to the server; only update the screen if it worked
  async function persist(next: Course[], successMessage: string): Promise<boolean> {
    try {
      await updateProfile({ courses: next.map((course) => normalize(course.courseCode)) });

      const details = loadDetails();
      for (const course of next) {
        details[normalize(course.courseCode)] = { courseName: course.courseName, term: course.term };
      }
      localStorage.setItem(DETAILS_KEY, JSON.stringify(details));

      setCourses(next);
      setMessage(successMessage);
      return true;
    } catch (error) {
      setMessage(errorMessage(error)); // e.g. "Provide courses as an array of nonempty course codes."
      return false;
    }
  }

  // Update form fields
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Add a new course or update an existing one
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const courseCode = normalize(formData.courseCode);
    const courseName = formData.courseName.trim();
    const term = formData.term.trim();

    if (!courseCode || !courseName || !term) {
      setMessage("Please fill out all fields.");
      return;
    }

    // Prevent the same course twice (the server stores each code once)
    const duplicate = courses.some(
      (course) => normalize(course.courseCode) === courseCode && course.id !== editingId
    );

    if (duplicate) {
      setMessage("You have already added this course.");
      return;
    }

    const next = editingId
      ? courses.map((course) =>
          course.id === editingId ? { id: courseCode, courseCode, courseName, term } : course
        )
      : [...courses, { id: courseCode, courseCode, courseName, term }];

    const ok = await persist(
      next,
      editingId ? "Course updated successfully!" : "Course added successfully!"
    );

    if (ok) {
      setFormData(emptyCourse);
      setEditingId(null);
    }
  };

  // Load a course into the form for editing
  const handleEdit = (course: Course) => {
    setFormData({
      courseCode: course.courseCode,
      courseName: course.courseName,
      term: course.term,
    });

    setEditingId(course.id);
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Delete a course
  const handleDelete = async (courseId: string) => {
    const ok = await persist(
      courses.filter((course) => course.id !== courseId),
      "Course removed."
    );

    if (ok && editingId === courseId) {
      setFormData(emptyCourse);
      setEditingId(null);
    }
  };

  // Reset the form
  const handleCancel = () => {
    setFormData(emptyCourse);
    setEditingId(null);
    setMessage("");
  };

  return (
    <>
      <DashboardNavbar />

      <main className="courses-page">
        <div className="courses-content">
          <header className="courses-heading">
            <h1>My Courses</h1>
            <p>
              Add and manage the courses you're currently taking at UCF.
              Study Buddy uses your courses to help find compatible study partners.
            </p>
          </header>

          <section className="courses-panel">
            <h2>{editingId ? "Edit Course" : "Add a Course"}</h2>

            <form onSubmit={handleSubmit}>
              <div className="courses-form-grid">
                <div className="courses-form-field">
                  <label htmlFor="courseCode">Course Code</label>
                  <input
                    id="courseCode"
                    name="courseCode"
                    type="text"
                    placeholder="COP 3503"
                    value={formData.courseCode}
                    onChange={handleChange}
                  />
                </div>

                <div className="courses-form-field">
                  <label htmlFor="courseName">Course Name</label>
                  <input
                    id="courseName"
                    name="courseName"
                    type="text"
                    placeholder="Computer Science II"
                    value={formData.courseName}
                    onChange={handleChange}
                  />
                </div>

                <div className="courses-form-field">
                  <label htmlFor="term">Semester</label>
                  <input
                    id="term"
                    name="term"
                    type="text"
                    placeholder="Fall 2026"
                    value={formData.term}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {message && <p role="status" className="courses-message">{message}</p>}

              <div className="courses-form-actions">
                <button type="submit" className="medieval-primary-button">
                  {editingId ? "Save Changes" : "+ Add Course"}
                </button>
                {editingId && (
                  <button type="button" onClick={handleCancel} className="medieval-secondary-button">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          <section className="courses-list-section">
            <div className="courses-list-heading">
              <h2>My Enrolled Courses</h2>
              <span className="courses-count">
                {courses.length} {courses.length === 1 ? "Course" : "Courses"}
              </span>
            </div>

            {courses.length === 0 ? (
              <div className="courses-empty-state">
                <div className="courses-empty-icon">📚</div>
                <h3>No Courses Added Yet</h3>
                <p>
                  Add your current UCF courses above to start finding
                  students in your classes.
                </p>
              </div>
            ) : (
              <div className="courses-grid">
                {courses.map((course) => (
                  <article key={course.id} className="course-card">
                    <div className="course-card-details">
                      <span className="course-code-badge">{course.courseCode}</span>
                      <h3>{course.courseName}</h3>
                      <p>{course.term}</p>
                    </div>
                    <div className="course-card-actions">
                      <button type="button" onClick={() => handleEdit(course)} className="course-edit-button">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(course.id)} className="course-remove-button">
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
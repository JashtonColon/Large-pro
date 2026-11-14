import { useEffect, useState } from "react";
import DashboardNavbar from "../components/DashboardNavbar";

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
  // Load previously saved courses from localStorage
  const [courses, setCourses] = useState<Course[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("courses") || "[]");
    } catch {
      return [];
    }
  });

  const [formData, setFormData] = useState(emptyCourse);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Save courses whenever the list changes
  useEffect(() => {
    localStorage.setItem("courses", JSON.stringify(courses));
  }, [courses]);

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
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const courseCode = formData.courseCode.trim().toUpperCase();
    const courseName = formData.courseName.trim();
    const term = formData.term.trim();

    if (!courseCode || !courseName || !term) {
      setMessage("Please fill out all fields.");
      return;
    }

    // Prevent duplicate course codes for the same term
    const duplicate = courses.some(
      (course) =>
        course.courseCode.toUpperCase() === courseCode &&
        course.term.toLowerCase() === term.toLowerCase() &&
        course.id !== editingId
    );

    if (duplicate) {
      setMessage("You have already added this course for that term.");
      return;
    }

    if (editingId) {
      // Update an existing course
      setCourses((previous) =>
        previous.map((course) =>
          course.id === editingId
            ? {
                ...course,
                courseCode,
                courseName,
                term,
              }
            : course
        )
      );

      setMessage("Course updated successfully!");
    } else {
      // Add a new course
      const newCourse: Course = {
        id: crypto.randomUUID(),
        courseCode,
        courseName,
        term,
      };

      setCourses((previous) => [...previous, newCourse]);
      setMessage("Course added successfully!");
    }

    setFormData(emptyCourse);
    setEditingId(null);
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
  const handleDelete = (courseId: string) => {
    setCourses((previous) =>
      previous.filter((course) => course.id !== courseId)
    );

    if (editingId === courseId) {
      handleCancel();
    }

    setMessage("Course removed.");
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

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { errorMessage } from "../lib/authApi";
import { saveProfile, timeToMinutes, DAY_NUMBERS } from "../lib/profileApi";

interface Course {
  id: number;
  courseCode: string;
  courseName: string;
  term: string;
}

interface TimeSlot {
  id: number;
  start: string;
  end: string;
}

interface DaySchedule {
  day: string;
  available: boolean;
  slots: TimeSlot[];
}

const initialSchedule: DaySchedule[] = [
  { day: "Monday", available: true, slots: [] },
  { day: "Tuesday", available: true, slots: [] },
  { day: "Wednesday", available: true, slots: [] },
  { day: "Thursday", available: true, slots: [] },
  { day: "Friday", available: true, slots: [] },
  { day: "Saturday", available: true, slots: [] },
  { day: "Sunday", available: true, slots: [] },
];

export default function ProfileSetupPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Course information
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [term, setTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [courseMessage, setCourseMessage] = useState("");

  // Weekly availability
  const [schedule, setSchedule] =
    useState<DaySchedule[]>(initialSchedule);

  const [copyFromDay, setCopyFromDay] = useState("Monday");
  const [copyToDay, setCopyToDay] = useState("Tuesday");

  const [message, setMessage] = useState("");
  const [major, setMajor] = useState("");
  const [saving, setSaving] = useState(false);

  function resetCourseForm() {
    setCourseCode("");
    setCourseName("");
    setTerm("");
    setEditingId(null);
  }

  function handleCourseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCourseMessage("");

    const cleanedCode = courseCode.trim().toUpperCase();
    const cleanedName = courseName.trim();

    if (!cleanedCode || !cleanedName || !term) {
      setCourseMessage("Please complete all course fields.");
      return;
    }

    const duplicate = courses.some(
      (course) =>
        course.courseCode.toLowerCase() === cleanedCode.toLowerCase() &&
        course.term === term &&
        course.id !== editingId
    );

    if (duplicate) {
      setCourseMessage(
        "You have already added this course for that semester."
      );
      return;
    }

    if (editingId !== null) {
      setCourses((previous) =>
        previous.map((course) =>
          course.id === editingId
            ? {
                ...course,
                courseCode: cleanedCode,
                courseName: cleanedName,
                term,
              }
            : course
        )
      );

      setCourseMessage("Course updated successfully.");
    } else {
      setCourses((previous) => [
        ...previous,
        {
          id: Date.now(),
          courseCode: cleanedCode,
          courseName: cleanedName,
          term,
        },
      ]);

      setCourseMessage("Course added successfully.");
    }

    resetCourseForm();
  }

  function handleEditCourse(course: Course) {
    setCourseCode(course.courseCode);
    setCourseName(course.courseName);
    setTerm(course.term);
    setEditingId(course.id);
    setCourseMessage("");
  }

  function handleDeleteCourse(id: number) {
    setCourses((previous) =>
      previous.filter((course) => course.id !== id)
    );

    if (editingId === id) {
      resetCourseForm();
    }
  }

  function goToAvailability() {
    setMessage("");
    setCourseMessage("");

    if (courses.length === 0) {
      setCourseMessage("Please add at least one course before continuing.");
      return;
    }

    if (!major.trim()) {
      setCourseMessage("Please enter your major before continuing.");
      return;
    }

    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBackToCourses() {
    setMessage("");
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateDayAvailability(day: string, available: boolean) {
    setSchedule((previous) =>
      previous.map((item) =>
        item.day === day ? { ...item, available } : item
      )
    );
  }

  function addTimeSlot(day: string) {
    setSchedule((previous) =>
      previous.map((item) =>
        item.day === day
          ? {
              ...item,
              slots: [
                ...item.slots,
                {
                  id: Date.now() + Math.random(),
                  start: "09:00",
                  end: "10:00",
                },
              ],
            }
          : item
      )
    );
  }

  function updateTimeSlot(
    day: string,
    slotId: number,
    field: "start" | "end",
    value: string
  ) {
    setSchedule((previous) =>
      previous.map((item) =>
        item.day === day
          ? {
              ...item,
              slots: item.slots.map((slot) =>
                slot.id === slotId
                  ? { ...slot, [field]: value }
                  : slot
              ),
            }
          : item
      )
    );
  }

  function removeTimeSlot(day: string, slotId: number) {
    setSchedule((previous) =>
      previous.map((item) =>
        item.day === day
          ? {
              ...item,
              slots: item.slots.filter((slot) => slot.id !== slotId),
            }
          : item
      )
    );
  }

  function copyAvailability() {
    if (copyFromDay === copyToDay) {
      setMessage("Choose two different days to copy availability.");
      return;
    }

    const sourceDay = schedule.find(
      (item) => item.day === copyFromDay
    );

    if (!sourceDay) return;

    setSchedule((previous) =>
      previous.map((item) =>
        item.day === copyToDay
          ? {
              ...item,
              available: sourceDay.available,
              slots: sourceDay.slots.map((slot) => ({
                ...slot,
                id: Date.now() + Math.random(),
              })),
            }
          : item
      )
    );

    setMessage("");
  }

  function validateSchedule(): string | null {
    const availableDays = schedule.filter((day) => day.available);

    if (availableDays.length === 0) {
      return "Please select at least one day when you are available.";
    }

    const hasAtLeastOneSlot = availableDays.some(
      (day) => day.slots.length > 0
    );

    if (!hasAtLeastOneSlot) {
      return "Please add at least one available study time.";
    }

    for (const day of availableDays) {
      const sortedSlots = [...day.slots].sort((a, b) =>
        a.start.localeCompare(b.start)
      );

      for (const slot of sortedSlots) {
        if (!slot.start || !slot.end || slot.end <= slot.start) {
          return `Please enter valid start and end times for ${day.day}.`;
        }
      }

      for (let i = 1; i < sortedSlots.length; i++) {
        if (sortedSlots[i].start < sortedSlots[i - 1].end) {
          return `Your time periods overlap on ${day.day}.`;
        }
      }
    }

    return null;
  }

  async function finishSetup() {
    setMessage("");

    if (!major.trim()) {
      setMessage("Please enter your major (go Back to the first step).");
      return;
    }

    const scheduleError = validateSchedule();

    if (scheduleError) {
      setMessage(scheduleError);
      return;
    }

    // Convert the form into the format the backend expects:
    // courses -> ["COP4331", ...]; each time slot -> { dayOfWeek, startMinute, endMinute }
    const availability = schedule
      .filter((day) => day.available)
      .flatMap((day) =>
        day.slots.map((slot) => ({
          dayOfWeek: DAY_NUMBERS[day.day],
          startMinute: timeToMinutes(slot.start),
          endMinute: timeToMinutes(slot.end),
        }))
      );

    setSaving(true);
    try {
      await saveProfile({
        major: major.trim(),
        courses: courses.map((course) => course.courseCode.replace(/\s/g, "")),
        availability,
      });

      navigate("/quests");
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="profile-setup-page">
      <section className="profile-setup-container">
        <h1 className="login-brand">Knight Study Buddy</h1>

        <p className="login-subtitle">
          Let's get your study profile ready.
        </p>

        {/* STEP PROGRESS */}
        <div className="setup-progress">
          <div className={`setup-progress-step ${step === 1 ? "active" : "complete"}`}>
            <span>1</span>
            <p>Courses & Major</p>
          </div>

          <div className={`setup-progress-line ${step === 2 ? "complete" : ""}`} />

          <div className={`setup-progress-step ${step === 2 ? "active" : ""}`}>
            <span>2</span>
            <p>Weekly Availability</p>
          </div>
        </div>

        {step === 1 && (
          <div className="setup-step-content">
            <h2 className="login-heading">Courses & Major</h2>

            <p className="profile-setup-intro">
              Add your current courses and major to help find compatible
              study partners.
            </p>

            {/* COURSES */}
            <section className="courses-panel">
              <div className="profile-section-heading">
                <h2>📚 Your Courses</h2>
                <p>
                  Add your current courses to help find students
                  taking the same classes.
                </p>
              </div>

              <form onSubmit={handleCourseSubmit}>
                <div className="courses-form-grid">
                  <label className="courses-form-field">
                    Course Code
                    <input
                      type="text"
                      placeholder="Example: COP 4331"
                      value={courseCode}
                      onChange={(event) => setCourseCode(event.target.value)}
                      required
                    />
                  </label>

                  <label className="courses-form-field">
                    Course Name
                    <input
                      type="text"
                      placeholder="Example: Software Engineering"
                      value={courseName}
                      onChange={(event) => setCourseName(event.target.value)}
                      required
                    />
                  </label>

                  <label className="courses-form-field">
                    Semester
                    <input
                        type="text"
                        placeholder="Example: Fall 2027"
                        value={term}
                        onChange={(event) => setTerm(event.target.value)}
                        required
                    />
                  </label>
                </div>

                {courseMessage && (
                  <p className="courses-message" role="status">
                    {courseMessage}
                  </p>
                )}

                <div className="courses-form-actions">
                  <button type="submit" className="courses-add-button">
                    {editingId !== null ? "Update Course" : "Add Course"}
                  </button>

                  {editingId !== null && (
                    <button
                      type="button"
                      className="courses-cancel-button"
                      onClick={resetCourseForm}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              <div className="courses-list-section">
                <h3>Your Added Courses ({courses.length})</h3>

                {courses.length === 0 ? (
                  <p className="courses-empty">
                    You haven't added any courses yet.
                  </p>
                ) : (
                  <div className="courses-grid">
                    {courses.map((course) => (
                      <article className="course-card" key={course.id}>
                        <h3>{course.courseCode}</h3>
                        <p>{course.courseName}</p>
                        <span>{course.term}</span>

                        <div className="course-card-actions">
                          <button
                            type="button"
                            onClick={() => handleEditCourse(course)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* MAJOR */}
            <section className="profile-panel">
              <div className="profile-section-heading">
                <h2>🎓 Academic Information</h2>
                <p>
                  Add your major to help other students learn a little
                  more about your academic background.
                </p>
              </div>

              <div className="profile-preference-control">
                <label htmlFor="major">Major</label>
                <input
                  id="major"
                  className="login-input"
                  placeholder="Example: Computer Science"
                  value={major}
                  onChange={(event) => setMajor(event.target.value)}
                />
              </div>
            </section>

            <button
              type="button"
              className="login-submit setup-next-button"
              onClick={goToAvailability}
            >
              Continue to Availability
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="setup-step-content">
            <h2 className="login-heading">Weekly Availability</h2>

            <p className="profile-setup-intro">
              Select the days and times when you're available
              to study with other students.
            </p>

            <section className="courses-panel">
              <div className="profile-section-heading">
                <h2>🗓️ Your Weekly Schedule</h2>
                <p>
                  Turn days on or off and add the time periods
                  when you are free to study.
                </p>
              </div>

              <div className="availability-info-banner">
                You only need to add times for the days when
                you're available. You can leave other days turned off.
              </div>

              <div className="availability-grid">
                {schedule.map((day) => (
                  <article
                    className="availability-day-card"
                    key={day.day}
                  >
                    <div className="availability-day-header">
                      <h3>{day.day}</h3>

                      <label className="availability-toggle">
                        <input
                          type="checkbox"
                          checked={day.available}
                          onChange={(event) =>
                            updateDayAvailability(
                              day.day,
                              event.target.checked
                            )
                          }
                        />
                        <span>
                          {day.available ? "Available" : "Unavailable"}
                        </span>
                      </label>
                    </div>

                    {day.available && (
                      <div className="availability-day-content">
                        <div className="availability-time-list">
                          {day.slots.map((slot) => (
                            <div
                              className="availability-time-slot"
                              key={slot.id}
                            >
                              <label className="availability-time-field">
                                Start
                                <input
                                  type="time"
                                  value={slot.start}
                                  onChange={(event) =>
                                    updateTimeSlot(
                                      day.day,
                                      slot.id,
                                      "start",
                                      event.target.value
                                    )
                                  }
                                />
                              </label>

                              <label className="availability-time-field">
                                End
                                <input
                                  type="time"
                                  value={slot.end}
                                  onChange={(event) =>
                                    updateTimeSlot(
                                      day.day,
                                      slot.id,
                                      "end",
                                      event.target.value
                                    )
                                  }
                                />
                              </label>

                              <button
                                type="button"
                                className="availability-remove-slot"
                                onClick={() =>
                                  removeTimeSlot(day.day, slot.id)
                                }
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          className="availability-add-time"
                          onClick={() => addTimeSlot(day.day)}
                        >
                          + Add Time
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>

              {/* COPY AVAILABILITY */}
              <div className="availability-copy-control">
                <h3>Copy Availability</h3>
                <p>
                  Copy one day's schedule to another day.
                </p>

                <div className="availability-copy-row">
                  <label>
                    Copy from
                    <select
                      value={copyFromDay}
                      onChange={(event) =>
                        setCopyFromDay(event.target.value)
                      }
                    >
                      {schedule.map((day) => (
                        <option key={day.day} value={day.day}>
                          {day.day}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Copy to
                    <select
                      value={copyToDay}
                      onChange={(event) =>
                        setCopyToDay(event.target.value)
                      }
                    >
                      {schedule.map((day) => (
                        <option key={day.day} value={day.day}>
                          {day.day}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button type="button" onClick={copyAvailability}>
                    Copy Schedule
                  </button>
                </div>
              </div>
            </section>

            {message && (
              <p className="login-message" role="alert">
                {message}
              </p>
            )}

            <div className="setup-navigation-buttons">
              <button
                type="button"
                className="setup-back-button"
                onClick={goBackToCourses}
              >
                Back
              </button>

              <button
                type="button"
                className="login-submit"
                onClick={finishSetup}
                disabled={saving}
              >
                {saving ? "Saving..." : "Finish Setup"}
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}


import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";

type Quest = {
  id: number;
  course: string;
  title: string;
  description: string;
  date?: string;
  startTime?: number;
  endTime?: number;
  schedule?: string;
  location: string;
  spots: number;
  posted?: string;
};

function readCreatedQuests(): Quest[] {
  try {
    return JSON.parse(
      localStorage.getItem("createdQuests") || "[]"
    ) as Quest[];
  } catch {
    return [];
  }
}

function convertToMinutes(
  hour: number,
  minute: number,
  period: string
): number {
  let convertedHour = hour % 12;

  if (period === "PM") {
    convertedHour += 12;
  }

  return convertedHour * 60 + minute;
}

function getTimeParts(totalMinutes?: number) {
  const total = totalMinutes ?? 0;
  const hour24 = Math.floor(total / 60);
  const minute = total % 60;

  return {
    hour: String(hour24 % 12 || 12),
    minute: String(minute).padStart(2, "0"),
    period: hour24 >= 12 ? "PM" : "AM",
  };
}

export default function CreateQuestPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();

  // If a quest was passed through navigation state,
  // this page will operate in editing mode.
  const editingQuest = routerLocation.state?.quest as Quest | undefined;

  const courseParts = editingQuest?.course.match(/^([A-Za-z]+)\s*(\d+)$/);

  const initialStart = getTimeParts(editingQuest?.startTime);
  const initialEnd = getTimeParts(editingQuest?.endTime);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const prefix = String(form.get("coursePrefix"));
    const courseNumber = String(form.get("courseNumber")).trim();

    const date = String(form.get("date")).trim();

    const startHour = Number(form.get("startHour"));
    const startMinute = Number(form.get("startMinute"));
    const startPeriod = String(form.get("startPeriod"));

    const endHour = Number(form.get("endHour"));
    const endMinute = Number(form.get("endMinute"));
    const endPeriod = String(form.get("endPeriod"));

    const maxPeople = Number(form.get("maxPeople"));

    // Validate date
    const dateParts = date.split("/");
    const month = Number(dateParts[0]);
    const day = Number(dateParts[1]);
    const year = Number(dateParts[2]);

    const parsedDate = new Date(year, month - 1, day);

    if (
      dateParts.length !== 3 ||
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
    ) {
      alert("Please enter a valid date in MM/DD/YYYY format.");
      return;
    }

    // Validate group size
    if (!Number.isInteger(maxPeople) || maxPeople < 1) {
      alert("Maximum group size must be a positive whole number.");
      return;
    }

    // Validate time fields
    if (
      startHour < 1 || startHour > 12 ||
      endHour < 1 || endHour > 12 ||
      startMinute < 0 || startMinute > 59 ||
      endMinute < 0 || endMinute > 59
    ) {
      alert("Please enter valid start and end times.");
      return;
    }

    const startTime = convertToMinutes(
      startHour,
      startMinute,
      startPeriod
    );

    const endTime = convertToMinutes(
      endHour,
      endMinute,
      endPeriod
    );

    if (endTime <= startTime) {
      alert("End time must be later than start time.");
      return;
    }

    // Normalize date to MM/DD/YYYY
    const formattedDate =
      `${String(month).padStart(2, "0")}/` +
      `${String(day).padStart(2, "0")}/` +
      `${year}`;

    const formatTime = (hour: number, minute: number, period: string) =>
      `${hour}:${String(minute).padStart(2, "0")} ${period}`;

    const quest: Quest = {
      id: editingQuest?.id ?? Date.now(),
      course: `${prefix} ${courseNumber}`,
      title: String(form.get("title")).trim(),
      description: String(form.get("description")).trim(),
      date: formattedDate,
      startTime,
      endTime,
      schedule: `${formattedDate} | ${formatTime(
        startHour,
        startMinute,
        startPeriod
      )} - ${formatTime(endHour, endMinute, endPeriod)}`,
      location: String(form.get("location")).trim(),
      spots: maxPeople,
      posted: editingQuest?.posted ?? "Just now",
    };

    let updatedQuests: Quest[];

    if (editingQuest) {
      // Replace the existing quest instead of creating a duplicate.
      updatedQuests = readCreatedQuests().map((existingQuest) =>
        existingQuest.id === editingQuest.id ? quest : existingQuest
      );
    } else {
      updatedQuests = [...readCreatedQuests(), quest];
    }

    localStorage.setItem(
      "createdQuests",
      JSON.stringify(updatedQuests)
    );

    // Return to My Quests after saving.
    navigate("/appointments");
  }

  return (
    <div className="create-quest-page">
      <DashboardNavbar />

      <main className="create-quest-overlay">
        <section className="create-quest-sheet">
          <div className="create-quest-handle" />

          <h1 className="create-quest-title">
            {editingQuest ? "Edit Quest" : "Post a Quest"}
          </h1>

          <p className="create-quest-subtitle">
            {editingQuest
              ? "Update the details of your study quest."
              : "Tell other Knights what you need help with."}
          </p>

          <form
            className="create-quest-form"
            onSubmit={handleSubmit}
          >
            {/* Course */}
            <div>
              <span className="create-quest-spots-label">
                Course
              </span>

              <div className="create-quest-course-fields">
                <select
                  className="create-quest-input"
                  name="coursePrefix"
                  defaultValue={courseParts?.[1]?.toUpperCase() ?? ""}
                  required
                >
                  <option value="" disabled>Prefix</option>
                  <option value="COP">COP</option>
                  <option value="CDA">CDA</option>
                  <option value="CEN">CEN</option>
                  <option value="EEE">EEE</option>
                  <option value="MAC">MAC</option>
                </select>

                <input
                  className="create-quest-input"
                  name="courseNumber"
                  placeholder="Course number"
                  inputMode="numeric"
                  pattern="[0-9]+"
                  defaultValue={courseParts?.[2] ?? ""}
                  required
                />
              </div>
            </div>

            {/* Title */}
            <input
              className="create-quest-input"
              name="title"
              placeholder="Quest title"
              maxLength={80}
              defaultValue={editingQuest?.title ?? ""}
              required
            />

            {/* Description */}
            <textarea
              className="create-quest-textarea"
              name="description"
              placeholder="What will your group study?"
              maxLength={500}
              defaultValue={editingQuest?.description ?? ""}
              required
            />

            {/* Date */}
            <div>
              <span className="create-quest-spots-label">
                Quest Date
              </span>

              <input
                className="create-quest-input"
                name="date"
                placeholder="MM/DD/YYYY"
                pattern="(0?[1-9]|1[0-2])/(0?[1-9]|[12][0-9]|3[01])/[0-9]{4}"
                defaultValue={editingQuest?.date ?? ""}
                required
              />
            </div>

            {/* Start time */}
            <div>
              <span className="create-quest-spots-label">
                Start Time
              </span>

              <div className="create-quest-time-fields">
                <input
                  className="create-quest-input"
                  type="number"
                  name="startHour"
                  placeholder="HH"
                  min={1}
                  max={12}
                  defaultValue={initialStart.hour}
                  required
                />

                <span>:</span>

                <input
                  className="create-quest-input"
                  type="number"
                  name="startMinute"
                  placeholder="MM"
                  min={0}
                  max={59}
                  defaultValue={initialStart.minute}
                  required
                />

                <select
                  className="create-quest-input"
                  name="startPeriod"
                  defaultValue={initialStart.period}
                  required
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            {/* End time */}
            <div>
              <span className="create-quest-spots-label">
                End Time
              </span>

              <div className="create-quest-time-fields">
                <input
                  className="create-quest-input"
                  type="number"
                  name="endHour"
                  placeholder="HH"
                  min={1}
                  max={12}
                  defaultValue={initialEnd.hour}
                  required
                />

                <span>:</span>

                <input
                  className="create-quest-input"
                  type="number"
                  name="endMinute"
                  placeholder="MM"
                  min={0}
                  max={59}
                  defaultValue={initialEnd.minute}
                  required
                />

                <select
                  className="create-quest-input"
                  name="endPeriod"
                  defaultValue={initialEnd.period}
                  required
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <input
              className="create-quest-input"
              name="location"
              placeholder="Where? (e.g. UCF Library)"
              defaultValue={editingQuest?.location ?? ""}
              required
            />

            {/* Group size */}
            <div>
              <span className="create-quest-spots-label">
                Maximum Group Size
              </span>

              <input
                className="create-quest-input"
                type="number"
                name="maxPeople"
                min={1}
                step={1}
                defaultValue={editingQuest?.spots ?? 2}
                required
              />
            </div>

            <button
              className="create-quest-submit"
              type="submit"
            >
              {editingQuest ? "Save Changes" : "🛡 Pin It to the Board 🛡"}
            </button>
          </form>

          <button
            className="create-quest-cancel"
            type="button"
            onClick={() =>
              navigate(editingQuest ? "/appointments" : "/quests")
            }
          >
            Cancel
          </button>
        </section>
      </main>
    </div>
  );
}


import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardNavbar from "../components/DashboardNavbar";
import { errorMessage } from "../lib/authApi";
import { createQuest, updateQuest, minutesToTime, type Quest } from "../lib/questApi";

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

// Server date (ISO, midnight UTC) -> "MM/DD/YYYY" for the date box
function toFormDate(isoDate?: string): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  return `${String(date.getUTCMonth() + 1).padStart(2, "0")}/` +
    `${String(date.getUTCDate()).padStart(2, "0")}/${date.getUTCFullYear()}`;
}

export default function CreateQuestPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [saving, setSaving] = useState(false);

  // If a quest was passed through navigation state (from My Quests),
  // this page will operate in editing mode.
  const editingQuest = routerLocation.state?.quest as Quest | undefined;

  const courseParts = editingQuest?.subject.match(/^([A-Za-z]+)\s*(\d+\w*)$/);

  const initialStart = getTimeParts(editingQuest?.startTime);
  const initialEnd = getTimeParts(editingQuest?.endTime);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

    const startMinutes = (startHour % 12 + (startPeriod === "PM" ? 12 : 0)) * 60 + startMinute;
    const endMinutes = (endHour % 12 + (endPeriod === "PM" ? 12 : 0)) * 60 + endMinute;

    if (endMinutes <= startMinutes) {
      alert("End time must be later than start time.");
      return;
    }

    // The backend expects "MM/DD/YYYY" and "h:MM AM/PM"
    const questData = {
      subject: `${prefix}${courseNumber}`.toUpperCase(),   // "COP" + "4331" -> "COP4331"
      title: String(form.get("title")).trim(),
      description: String(form.get("description")).trim(),
      day: `${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}/${year}`,
      startTime: minutesToTime(startMinutes),
      endTime: minutesToTime(endMinutes),
      location: String(form.get("location")).trim(),
      maxMember: maxPeople,
    };

    setSaving(true);
    try {
      if (editingQuest) {
        await updateQuest(editingQuest._id, questData);
      } else {
        await createQuest(questData);
      }
      // Return to My Quests after saving.
      navigate("/appointments");
    } catch (error) {
      alert(errorMessage(error));
    } finally {
      setSaving(false);
    }
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
                defaultValue={toFormDate(editingQuest?.day)}
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
                defaultValue={editingQuest?.maxMember ?? 2}
                required
              />
            </div>

            <button
              className="create-quest-submit"
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : editingQuest ? "Save Changes" : "🛡 Pin It to the Board 🛡"}
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

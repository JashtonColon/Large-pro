import { useState } from "react";
import DashboardNavbar from "../components/DashboardNavbar";

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

export default function AvailabilityPage() {
  const [schedule, setSchedule] =
    useState<DaySchedule[]>(initialSchedule);

  const [saved, setSaved] = useState(false);

  // Add a new time period to a day
  const addTimeSlot = (dayIndex: number) => {
    const newSlot: TimeSlot = {
      id: Date.now() + Math.random(),
      start: "09:00",
      end: "10:00",
    };

    setSchedule((previous) =>
      previous.map((day, index) =>
        index === dayIndex
          ? { ...day, slots: [...day.slots, newSlot] }
          : day
      )
    );

    setSaved(false);
  };

  // Update a time period
  const updateTimeSlot = (
    dayIndex: number,
    slotId: number,
    field: "start" | "end",
    value: string
  ) => {
    setSchedule((previous) =>
      previous.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              slots: day.slots.map((slot) =>
                slot.id === slotId
                  ? { ...slot, [field]: value }
                  : slot
              ),
            }
          : day
      )
    );

    setSaved(false);
  };

  // Remove a time period
  const removeTimeSlot = (
    dayIndex: number,
    slotId: number
  ) => {
    setSchedule((previous) =>
      previous.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              slots: day.slots.filter(
                (slot) => slot.id !== slotId
              ),
            }
          : day
      )
    );

    setSaved(false);
  };

  // Toggle availability for a day
  const toggleAvailability = (dayIndex: number) => {
    setSchedule((previous) =>
      previous.map((day, index) =>
        index === dayIndex
          ? { ...day, available: !day.available }
          : day
      )
    );

    setSaved(false);
  };

  // Copy one day's schedule to another
  const copyDay = (sourceIndex: number, targetIndex: number) => {
    setSchedule((previous) =>
      previous.map((day, index) =>
        index === targetIndex
          ? {
              ...day,
              available: previous[sourceIndex].available,
              slots: previous[sourceIndex].slots.map((slot) => ({
                ...slot,
                id: Date.now() + Math.random(),
              })),
            }
          : day
      )
    );

    setSaved(false);
  };

  // Validate and save the schedule
  const saveSchedule = () => {
    for (const day of schedule) {
      if (!day.available) continue;

      const sortedSlots = [...day.slots].sort((a, b) =>
        a.start.localeCompare(b.start)
      );

      for (let i = 0; i < sortedSlots.length; i++) {
        const slot = sortedSlots[i];

        if (slot.start >= slot.end) {
          alert(
            `${day.day}: Please make sure each end time is after its start time.`
          );
          return;
        }

        if (
          i > 0 &&
          sortedSlots[i - 1].end > slot.start
        ) {
          alert(
            `${day.day}: Your availability periods cannot overlap.`
          );
          return;
        }
      }
    }

    setSaved(true);

    // Frontend-only for now. We will connect this to the backend later.
    console.log("Availability Schedule:", schedule);
  };

  return (
    <>
      <DashboardNavbar />

      <main className="availability-page">
        <div className="availability-content">
          <header className="availability-heading">
            <div>
              <h1>My Availability</h1>
              <p>
                Manage your weekly schedule so other UCF students can find times
                to study with you.
              </p>
            </div>
            <button onClick={saveSchedule} className="medieval-primary-button availability-top-save">
              {saved ? "✓ Saved" : "Save Changes"}
            </button>
          </header>

          <section className="availability-info-banner">
            <div className="availability-info-icon">📅</div>
            <div>
              <h2>Set Your Weekly Schedule</h2>
              <p>
                Add the times you're available to study each day. Study Buddy uses
                overlapping availability to help match you with compatible study partners.
              </p>
            </div>
          </section>

          <div className="availability-list-heading">
            <h2>Weekly Schedule</h2>
            <span>Monday – Sunday</span>
          </div>

          <div className="availability-grid">
            {schedule.map((day, dayIndex) => (
              <section key={day.day} className="availability-day-card">
                <header className="availability-day-header">
                  <div>
                    <h3>{day.day}</h3>
                    <span className={day.available ? "availability-status is-available" : "availability-status"}>
                      {day.available ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  <label className="availability-toggle" aria-label={`Toggle availability for ${day.day}`}>
                    <input
                      type="checkbox"
                      checked={day.available}
                      onChange={() => toggleAvailability(dayIndex)}
                    />
                    <span className="availability-toggle-track" />
                  </label>
                </header>

                <div className="availability-day-content">
                  {day.available ? (
                    <>
                      {day.slots.length === 0 && (
                        <p className="availability-no-times">No study times added yet.</p>
                      )}

                      <div className="availability-time-list">
                        {day.slots.map((slot) => (
                          <div key={slot.id} className="availability-time-slot">
                            <div className="availability-time-field">
                              <label>From</label>
                              <input
                                type="time"
                                value={slot.start}
                                onChange={(e) => updateTimeSlot(dayIndex, slot.id, "start", e.target.value)}
                              />
                            </div>
                            <div className="availability-time-field">
                              <label>Until</label>
                              <input
                                type="time"
                                value={slot.end}
                                onChange={(e) => updateTimeSlot(dayIndex, slot.id, "end", e.target.value)}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTimeSlot(dayIndex, slot.id)}
                              aria-label={`Remove time period from ${day.day}`}
                              className="availability-remove-slot"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <button type="button" onClick={() => addTimeSlot(dayIndex)} className="availability-add-time">
                        + Add Time Period
                      </button>
                    </>
                  ) : (
                    <div className="availability-unavailable-message">
                      You are unavailable on this day.
                    </div>
                  )}

                  <div className="availability-copy-control">
                    <label>Copy this schedule to:</label>
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const targetIndex = Number(e.target.value);
                        if (e.target.value !== "") {
                          copyDay(dayIndex, targetIndex);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="" disabled>Select a day...</option>
                      {schedule.map((targetDay, targetIndex) =>
                        targetIndex !== dayIndex ? (
                          <option key={targetDay.day} value={targetIndex}>{targetDay.day}</option>
                        ) : null
                      )}
                    </select>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <footer className="availability-save-footer">
            <p>Remember to save your changes before leaving this page.</p>
            <button onClick={saveSchedule} className="medieval-primary-button">
              {saved ? "✓ Saved" : "Save Changes"}
            </button>
          </footer>
        </div>
      </main>
    </>
  );
}
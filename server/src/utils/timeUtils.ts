
export function timeToMinutes(time: string): number {
  const match = time.trim().match(
    /^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/i
  );

  if (!match) {
    throw new Error("Invalid time format. Use HH:MM AM/PM.");
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();

  // Convert 12-hour time into 24-hour time
  let hours24 = hours % 12;

  if (period === "PM") {
    hours24 += 12;
  }

  // Calculate minutes since midnight
  return hours24 * 60 + minutes;
}
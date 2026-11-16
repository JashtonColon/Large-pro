// Common UCF course prefixes, shared by course pickers across the app.
// Add more here and every dropdown that uses this list updates.
export const COURSE_PREFIXES = [
  'BSC', 'CAP', 'CDA', 'CEN', 'CHM', 'CIS', 'CNT', 'COP', 'COT',
  'EEE', 'EEL', 'ENC', 'MAC', 'MAP', 'PHY', 'STA',
];

// UCF course numbers: 4 digits, sometimes followed by a letter (e.g. 2048L)
export function isValidCourseNumber(number: string): boolean {
  return /^\d{4}[A-Za-z]?$/.test(number.trim());
}

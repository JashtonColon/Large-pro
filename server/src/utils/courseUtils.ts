export function normalizeCourse(course: string): string {
  return course.replace(/\s+/g, "").toUpperCase();
}

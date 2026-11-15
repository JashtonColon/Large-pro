// The student's academic profile: major, gender, courses and weekly
// availability, saved on the server:
//   GET   /api/profile  -> { profile }   (null until it's set up)
//   POST  /api/profile  -> first save (major, courses, availability required)
//   PATCH /api/profile  -> later edits
// The server stores course codes without spaces ("COP4331"); the app shows
// them with a space ("COP 4331").

import 'dart:math' as math;

import 'api_client.dart';

/// One recurring weekly free time, stored exactly like the database:
/// dayOfWeek 0 = Sunday .. 6 = Saturday, minutes after midnight.
class TimeSlot {
  const TimeSlot({
    required this.dayOfWeek,
    required this.startMinute,
    required this.endMinute,
  });

  final int dayOfWeek;
  final int startMinute;
  final int endMinute;

  static const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  int get length => endMinute - startMinute;

  static String formatMinute(int minute) {
    final h = minute ~/ 60;
    final m = minute % 60;
    final period = (h >= 12 && h < 24) ? 'PM' : 'AM';
    var h12 = h % 12;
    if (h12 == 0) h12 = 12;
    return m == 0 ? '$h12 $period' : '$h12:${m.toString().padLeft(2, '0')} $period';
  }

  String get label =>
      '${dayNames[dayOfWeek]} ${formatMinute(startMinute)}-${formatMinute(endMinute)}';

  /// The time both slots share, or null if they don't overlap.
  TimeSlot? intersect(TimeSlot other) {
    if (other.dayOfWeek != dayOfWeek) return null;
    final s = math.max(startMinute, other.startMinute);
    final e = math.min(endMinute, other.endMinute);
    if (e <= s) return null;
    return TimeSlot(dayOfWeek: dayOfWeek, startMinute: s, endMinute: e);
  }

  Map<String, dynamic> toJson() => {
        'dayOfWeek': dayOfWeek,
        'startMinute': startMinute,
        'endMinute': endMinute,
      };
}

class Course {
  const Course(this.code, this.name);

  final String code; // e.g. "COP 3502C" (prefix + number)
  final String name;

  String get squashed => code.replaceAll(' ', '').toLowerCase();

  /// "cop4331" / "COP 4331" -> "COP 4331".
  static String pretty(String code) {
    final c = code.replaceAll(RegExp(r'\s+'), '').toUpperCase();
    final m = RegExp(r'^([A-Z]+)(\d.*)$').firstMatch(c);
    return m == null ? c : '${m.group(1)} ${m.group(2)}';
  }
}

class StudentProfile {
  String major = '';
  String? gender; // male, female, other, prefer_not_to_say (optional)
  List<String> courses = []; // course codes, shown as "COP 4331"
  List<TimeSlot> availability = [];

  /// What the server requires before the profile can be saved and matched.
  List<String> get missing => [
        if (major.trim().isEmpty) 'Major',
        if (courses.isEmpty) 'At least one course',
        if (availability.isEmpty) 'At least one free time',
      ];

  bool get isComplete => missing.isEmpty;

  StudentProfile copy() => StudentProfile()
    ..major = major
    ..gender = gender
    ..courses = List.of(courses)
    ..availability = List.of(availability);

  Map<String, dynamic> toJson() => {
        'major': major.trim(),
        if (gender != null) 'gender': gender,
        'courses': [for (final c in courses) c.replaceAll(' ', '')],
        'availability': [for (final s in availability) s.toJson()],
      };

  static StudentProfile fromJson(Map<String, dynamic> json) => StudentProfile()
    ..major = json['major'] as String? ?? ''
    ..gender = (json['gender'] as String?)?.isEmpty ?? true
        ? null
        : json['gender'] as String
    ..courses = [
      for (final c in (json['courses'] as List? ?? const []))
        Course.pretty(c.toString())
    ]
    ..availability = [
      for (final slot in (json['availability'] as List? ?? const []))
        TimeSlot(
          dayOfWeek: (slot['dayOfWeek'] as num).toInt(),
          startMinute: (slot['startMinute'] as num).toInt(),
          endMinute: (slot['endMinute'] as num).toInt(),
        )
    ];
}

class ProfileService {
  static StudentProfile current = StudentProfile();

  static const genders = [
    ('male', 'Male'),
    ('female', 'Female'),
    ('other', 'Other'),
    ('prefer_not_to_say', 'Prefer not to say'),
  ];

  // Course list for the search box. Any course code can also be typed in.
  static const catalog = [
    Course('COP 3223C', 'Introduction to Programming with C'),
    Course('COP 3330', 'Object-Oriented Programming'),
    Course('COP 3502C', 'Computer Science I'),
    Course('COP 3503C', 'Computer Science II'),
    Course('COP 4331', 'Processes for Object-Oriented Software Development'),
    Course('COP 4600', 'Operating Systems'),
    Course('COT 3100', 'Introduction to Discrete Structures'),
    Course('CDA 3103', 'Computer Logic and Organization'),
    Course('CIS 3360', 'Security in Computing'),
    Course('MAC 2311', 'Calculus with Analytic Geometry I'),
    Course('MAC 2312', 'Calculus with Analytic Geometry II'),
    Course('MAS 3105', 'Matrix and Linear Algebra'),
    Course('PHY 2048', 'Physics for Engineers & Scientists I'),
    Course('PHY 2049', 'Physics for Engineers & Scientists II'),
    Course('CHM 2045', 'Chemistry Fundamentals I'),
    Course('STA 2023', 'Statistical Methods I'),
    Course('ENC 1101', 'Composition I'),
  ];

  static Course? findCourse(String code) {
    final key = code.replaceAll(' ', '').toLowerCase();
    for (final c in catalog) {
      if (c.squashed == key) return c;
    }
    return null;
  }

  /// Partial match on code or name ("3502", "cop35", "calculus").
  static List<Course> searchCatalog(String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return const [];
    final squashed = q.replaceAll(' ', '');
    return catalog
        .where((c) =>
            c.squashed.contains(squashed) || c.name.toLowerCase().contains(q))
        .toList();
  }

  /// True once the profile exists on the server (decides POST vs PATCH).
  static bool savedOnServer = false;

  static Future<void> load() async {
    final data = await Api.get('/api/profile');
    final profile = data['profile'];
    if (profile is Map<String, dynamic> && profile['major'] != null) {
      current = StudentProfile.fromJson(profile);
      savedOnServer = true;
    } else {
      current = StudentProfile();
      savedOnServer = false;
    }
  }

  static Future<void> save(StudentProfile profile) async {
    final body = profile.toJson();
    Map<String, dynamic> data;
    if (savedOnServer) {
      data = await Api.patch('/api/profile', body);
    } else {
      try {
        data = await Api.post('/api/profile', body);
      } on ApiException catch (e) {
        // 409 = it already exists (saved from the web app): edit instead.
        if (e.statusCode != 409) rethrow;
        data = await Api.patch('/api/profile', body);
      }
    }
    savedOnServer = true;
    final saved = data['profile'];
    current = saved is Map<String, dynamic>
        ? StudentProfile.fromJson(saved)
        : profile.copy();
  }

  static void clear() {
    current = StudentProfile();
    savedOnServer = false;
  }
}

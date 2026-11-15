// Quest Board data, from the team's Express backend:
//   GET    /api/quests/search?title=&course=   partial-match search (server side)
//   GET    /api/quests/matches                 quests that fit your profile
//   POST   /api/quests                         post a quest
//   DELETE /api/quests/:id                     remove your quest
//   POST   /api/quests/:id/join                ask to join
//   POST   /api/quests/:id/leave               leave a party
//   GET    /api/quests/:id/join-requests       (author) who asked to join
//   PATCH  /api/quests/:id/join-requests/:uid  (author) accept / deny
//
// A quest is one study session on a date ("day") from startTime to endTime
// (minutes after midnight). The server only sends the author's ID, so the
// board says "You" for your own quests and "A fellow Knight" for others.
// Contact info is never shown.

import 'api_client.dart';
import 'auth_service.dart';
import 'profile_service.dart';

class Bounty {
  const Bounty({
    required this.id,
    required this.courseCode,
    required this.courseName,
    required this.title,
    required this.details,
    required this.posterName,
    required this.date,
    required this.startMinute,
    required this.endMinute,
    required this.where,
    required this.maxMember,
    required this.authorId,
    required this.memberIds,
    required this.requestIds,
    required this.isOpen,
    required this.postedAgo,
    this.requestedByServer = false,
  });

  final String id;
  final String courseCode; // "COP 4331"
  final String courseName;
  final String title;
  final String details;
  final String posterName;
  final DateTime date; // calendar date (UTC midnight, like the server)
  final int startMinute;
  final int endMinute;
  final String where;
  final int maxMember;
  final String authorId;
  final List<String> memberIds;
  final List<String> requestIds;
  final bool isOpen;
  final String postedAgo;

  /// The server only shows the joinRequests list to the quest's author, so
  /// for everyone else we use a flag from the server if it sends one, plus
  /// the requests made on this phone (BoardService.requestedIds).
  final bool requestedByServer;

  static const _months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  int get dayOfWeek => date.weekday % 7; // 0 = Sunday, like TimeSlot

  /// The session as a TimeSlot (used by the For You match note).
  TimeSlot get slot => TimeSlot(
      dayOfWeek: dayOfWeek, startMinute: startMinute, endMinute: endMinute);
  List<TimeSlot> get slots => [slot];

  String get dateLabel =>
      '${TimeSlot.dayNames[dayOfWeek]} ${_months[date.month - 1]} ${date.day}';

  String get when =>
      '$dateLabel · ${TimeSlot.formatMinute(startMinute)}-${TimeSlot.formatMinute(endMinute)}';

  /// Open seats left in the party.
  int get spots => (maxMember - memberIds.length).clamp(0, maxMember);

  /// Shown where the old "Reward" line was.
  String get reward => '${memberIds.length} of $maxMember joined';

  String? get _me => AuthService.currentUserId;
  bool get isMine => _me != null && authorId == _me;
  bool get joined => _me != null && memberIds.contains(_me);
  bool get requested =>
      !joined &&
      (requestedByServer ||
          (_me != null && requestIds.contains(_me)) ||
          BoardService.requestedIds.contains(id));
  bool get isFull => memberIds.length >= maxMember;

  /// True for sessions earlier than today.
  bool get isPast {
    final now = DateTime.now();
    final today = DateTime.utc(now.year, now.month, now.day);
    return date.isBefore(today);
  }

  factory Bounty.fromJson(Map<String, dynamic> j) {
    final code = Course.pretty(j['subject']?.toString() ?? '');
    final author = j['author'];
    final authorId = author is Map ? author['_id'].toString() : author.toString();
    List<String> ids(dynamic list) => [
          for (final x in (list as List? ?? const []))
            x is Map ? x['_id'].toString() : x.toString()
        ];
    final created = DateTime.tryParse(j['createdAt']?.toString() ?? '');
    final me = AuthService.currentUserId;
    return Bounty(
      id: j['_id'].toString(),
      courseCode: code,
      courseName: ProfileService.findCourse(code)?.name ?? 'Study quest',
      title: j['title']?.toString() ?? '',
      details: (j['description'] as String?)?.trim().isNotEmpty == true
          ? j['description'] as String
          : 'No details added.',
      posterName: authorId == me ? 'You' : 'A fellow Knight',
      date: DateTime.parse(j['day'].toString()).toUtc(),
      startMinute: (j['startTime'] as num).toInt(),
      endMinute: (j['endTime'] as num).toInt(),
      where: j['location']?.toString() ?? '',
      maxMember: (j['maxMember'] as num?)?.toInt() ?? 1,
      authorId: authorId,
      memberIds: ids(j['members']),
      requestIds: ids(j['joinRequests']),
      isOpen: (j['status'] ?? 'open') == 'open',
      postedAgo: created == null ? '' : _ago(created),
      requestedByServer: j['requestedByMe'] == true || j['hasRequested'] == true,
    );
  }

  static String _ago(DateTime t) {
    final d = DateTime.now().difference(t.toLocal());
    if (d.inMinutes < 1) return 'just now';
    if (d.inMinutes < 60) return '${d.inMinutes}m ago';
    if (d.inHours < 24) return '${d.inHours}h ago';
    return '${d.inDays}d ago';
  }

  /// Local check used only to narrow results already returned by the server.
  bool matches(String query) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) return true;
    final squashed = q.replaceAll(' ', '');
    return '$courseCode $courseName $title $details'.toLowerCase().contains(q) ||
        courseCode.toLowerCase().replaceAll(' ', '').contains(squashed);
  }
}

class JoinRequest {
  const JoinRequest({required this.userId, required this.name});
  final String userId;
  final String name;
}

class BoardService {
  /// Quests this user asked to join (the server hides joinRequests from
  /// non-authors, so the phone keeps track during the session).
  static final Set<String> requestedIds = {};

  static List<Bounty> _parse(dynamic list, {bool includePast = false}) => [
        for (final q in (list as List? ?? const []))
          if (q is Map<String, dynamic>) Bounty.fromJson(q),
      ].where((b) => includePast || !b.isPast).toList();

  /// Every quest the server returns (up to 30), upcoming ones only.
  static Future<List<Bounty>> fetchBounties({bool includePast = false}) async {
    final data = await Api.get('/api/quests/search');
    return _parse(data['quests'], includePast: includePast);
  }

  static bool _looksLikeCourse(String q) =>
      RegExp(r'^[A-Za-z]{2,4}\s?\d{3,4}[A-Za-z]?$').hasMatch(q.trim());

  /// Server-side partial-match search on the quest title. If the text looks
  /// like a course code ("cop4331", "COP 4331") it also searches by course.
  static Future<List<Bounty>> search(String query) async {
    final q = query.trim();
    if (q.isEmpty) return fetchBounties();
    final byTitle = Api.get('/api/quests/search', {'title': q});
    final byCourse = _looksLikeCourse(q)
        ? Api.get('/api/quests/search', {'course': q})
        : null;
    final results = <String, Bounty>{};
    for (final b in _parse((await byTitle)['quests'])) {
      results[b.id] = b;
    }
    if (byCourse != null) {
      for (final b in _parse((await byCourse)['quests'])) {
        results[b.id] = b;
      }
    }
    final list = results.values.toList()
      ..sort((a, b) => a.date != b.date
          ? a.date.compareTo(b.date)
          : a.startMinute.compareTo(b.startMinute));
    return list;
  }

  /// The server's For You list: open quests in one of your courses that fit
  /// inside one of your weekly free times.
  static Future<List<QuestMatch>> fetchMatches() async {
    final data = await Api.get('/api/quests/matches');
    return [for (final b in _parse(data['matches'])) QuestMatch(bounty: b)];
  }

  static Future<Bounty> requestToJoin(String questId) async {
    Map<String, dynamic> data;
    try {
      data = await Api.post('/api/quests/$questId/join');
    } on ApiException catch (e) {
      // Asked before (e.g. on another device): remember it so the button
      // shows "Requested" instead of offering to join again.
      if (e.message.contains('already have a pending')) requestedIds.add(questId);
      rethrow;
    }
    requestedIds.add(questId);
    return Bounty.fromJson(data['quest'] as Map<String, dynamic>);
  }

  static Future<Bounty> leave(String questId) async {
    final data = await Api.post('/api/quests/$questId/leave');
    requestedIds.remove(questId);
    return Bounty.fromJson(data['quest'] as Map<String, dynamic>);
  }

  static Future<void> delete(String questId) async {
    await Api.delete('/api/quests/$questId');
  }

  static Future<List<JoinRequest>> joinRequests(String questId) async {
    final data = await Api.get('/api/quests/$questId/join-requests');
    return [
      for (final r in (data['requests'] as List? ?? const []))
        if (r is Map)
          JoinRequest(
            userId: r['_id'].toString(),
            name: '${r['firstName'] ?? ''} ${r['lastName'] ?? ''}'.trim(),
          )
    ];
  }

  /// decision: true = accept, false = deny.
  static Future<void> reviewRequest(
      String questId, String userId, bool accept) async {
    await Api.patch('/api/quests/$questId/join-requests/$userId',
        {'decision': accept ? 'accept' : 'deny'});
  }

  static String _two(int n) => n.toString().padLeft(2, '0');

  /// 870 -> "2:30 PM" (the format the server expects).
  static String _clock(int minute) {
    final h = minute ~/ 60;
    final m = minute % 60;
    final period = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12;
    if (h12 == 0) h12 = 12;
    return '$h12:${_two(m)} $period';
  }

  static Future<Bounty> postBounty({
    required String courseCode,
    required String title,
    required String details,
    required DateTime date,
    required int startMinute,
    required int endMinute,
    required String where,
    required int spots,
  }) async {
    final data = await Api.post('/api/quests', {
      'title': title.trim(),
      'subject': Course.pretty(courseCode),
      'location': where.trim(),
      if (details.trim().isNotEmpty) 'description': details.trim(),
      'day': '${_two(date.month)}/${_two(date.day)}/${date.year}',
      'startTime': _clock(startMinute),
      'endTime': _clock(endMinute),
      'maxMember': spots,
    });
    return Bounty.fromJson(data['quest'] as Map<String, dynamic>);
  }
}

class QuestMatch {
  const QuestMatch({required this.bounty});

  final Bounty bounty;

  String get reason => 'You take ${bounty.courseCode} · '
      'you\'re free ${bounty.slot.label}';
}

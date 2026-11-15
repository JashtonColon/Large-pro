// The Invites tab, built from the server's quest join requests:
//   Received - Knights asking to join YOUR quests (accept / decline)
//   Sent     - quests you asked to join (waiting) or got into (accepted)
//   Parties  - quests you're in, and your own quests that have members
//
// The server has no contact-sharing route, so instead of an email the
// Parties section shows when and where the party meets.

import 'board_service.dart';

enum InviteStatus { pending, accepted, declined }

class Invite {
  Invite({
    required this.id,
    required this.quest,
    required this.name,
    required this.major,
    required this.message,
    required this.incoming,
    this.userId,
    this.status = InviteStatus.pending,
  });

  final String id;
  final Bounty quest;
  final String name; // the other student, or the quest title
  final String major; // short label under the name
  final String message;
  final bool incoming; // true = they asked to join your quest
  final String? userId; // the requester (incoming only)
  InviteStatus status;

  String get courseCode => quest.courseCode;
  String get sentAgo => quest.postedAgo;

  /// When and where the party meets.
  String get meetInfo => '${quest.when} · ${quest.where}';

  String get initials {
    final parts = name.split(' ').where((p) => p.isNotEmpty).toList();
    return parts.take(2).map((p) => p[0].toUpperCase()).join();
  }
}

class InviteService {
  static List<Invite> _received = [];
  static List<Invite> _sent = [];
  static List<Invite> _parties = [];

  static List<Invite> get incomingPending =>
      _received.where((i) => i.status == InviteStatus.pending).toList();
  static List<Invite> get sent => _sent;
  static List<Invite> get buddies => _parties;

  /// Reloads everything from the server.
  static Future<void> refresh() async {
    final quests = await BoardService.fetchBounties(includePast: true);

    final mine = quests.where((q) => q.isMine).toList();
    final requestLists = await Future.wait([
      for (final q in mine.where((q) => q.requestIds.isNotEmpty))
        BoardService.joinRequests(q.id).then((list) => (q, list)),
    ]);
    _received = [
      for (final (quest, requests) in requestLists)
        for (final r in requests)
          Invite(
            id: '${quest.id}:${r.userId}',
            quest: quest,
            userId: r.userId,
            name: r.name.isEmpty ? 'A Knight' : r.name,
            major: 'UCF Knight',
            message: 'Wants to join "${quest.title}" on ${quest.dateLabel}.',
            incoming: true,
          ),
    ];

    _sent = [
      for (final q in quests.where((q) => q.requested || q.joined))
        Invite(
          id: 'sent:${q.id}',
          quest: q,
          name: q.title,
          major: 'Quest',
          message: 'Meets ${q.when} at ${q.where}.',
          incoming: false,
          status: q.joined ? InviteStatus.accepted : InviteStatus.pending,
        ),
    ];

    _parties = [
      for (final q in quests.where(
          (q) => (q.joined || (q.isMine && q.memberIds.isNotEmpty)) && !q.isPast))
        Invite(
          id: 'party:${q.id}',
          quest: q,
          name: q.title,
          major: q.isMine ? 'Your quest' : 'Party member',
          message: '${q.memberIds.length} of ${q.maxMember} Knights joined.',
          incoming: false,
          status: InviteStatus.accepted,
        ),
    ];
  }

  static Future<void> accept(Invite invite) async {
    await BoardService.reviewRequest(invite.quest.id, invite.userId!, true);
    invite.status = InviteStatus.accepted;
  }

  static Future<void> decline(Invite invite) async {
    await BoardService.reviewRequest(invite.quest.id, invite.userId!, false);
    invite.status = InviteStatus.declined;
  }

  static Future<void> leave(Invite invite) async {
    await BoardService.leave(invite.quest.id);
    _parties.remove(invite);
    _sent.removeWhere((i) => i.quest.id == invite.quest.id);
  }

  static void clear() {
    _received = [];
    _sent = [];
    _parties = [];
  }
}

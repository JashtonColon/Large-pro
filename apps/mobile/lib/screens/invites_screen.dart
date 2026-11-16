// Invites tab, from the server's quest join requests: Knights asking to join
// your quests (accept / decline), quests you asked to join, and the parties
// you're in (when and where they meet).

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_client.dart';
import '../services/invite_service.dart';
import '../widgets/auth_widgets.dart';
import '../widgets/board_widgets.dart';

class InvitesTab extends StatefulWidget {
  const InvitesTab({super.key, required this.onChanged});

  /// Called after accept/decline so the tab badge can update.
  final VoidCallback onChanged;

  @override
  State<InvitesTab> createState() => _InvitesTabState();
}

class _InvitesTabState extends State<InvitesTab> {
  int _section = 0; // 0 = Received, 1 = Sent, 2 = Parties
  final Set<String> _busy = {};
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  Future<void> _refresh() async {
    try {
      await InviteService.refresh();
      _error = null;
    } on ApiException catch (e) {
      _error = e.message;
    } catch (e) {
      // Never leave the spinner running: show what went wrong instead.
      _error = 'Could not load invites: $e';
    }
    if (!mounted) return;
    setState(() => _loading = false);
    widget.onChanged();
  }

  void _toast(String text) => ScaffoldMessenger.of(context)
      .showSnackBar(SnackBar(content: Text(text)));

  Future<void> _run(Invite invite, Future<void> Function() action,
      String doneText) async {
    setState(() => _busy.add(invite.id));
    try {
      await action();
      if (!mounted) return;
      HapticFeedback.mediumImpact();
      _toast(doneText);
    } on ApiException catch (e) {
      if (mounted) _toast(e.message);
    }
    if (!mounted) return;
    setState(() => _busy.remove(invite.id));
    await _refresh();
  }

  Future<void> _accept(Invite invite) => _run(
      invite,
      () => InviteService.accept(invite),
      '${invite.name} joined your party for ${invite.quest.title}!');

  Future<void> _decline(Invite invite) =>
      _run(invite, () => InviteService.decline(invite), 'Request declined.');

  Future<void> _leave(Invite invite) =>
      _run(invite, () => InviteService.leave(invite), 'You left ${invite.name}.');

  @override
  Widget build(BuildContext context) {
    final received = InviteService.incomingPending;
    final sent = InviteService.sent;
    final buddies = InviteService.buddies;

    Widget body;
    if (_loading) {
      body = const Center(
          child: CircularProgressIndicator(color: AppColors.gold));
    } else if (_error != null) {
      body = _Empty(_error!);
    } else if (_section == 0) {
      body = received.isEmpty
          ? const _Empty('No join requests yet.\nPost a quest to get some.')
          : _list([for (final i in received) _receivedCard(i)]);
    } else if (_section == 1) {
      body = sent.isEmpty
          ? const _Empty('You haven\'t asked to join\nany quests yet.')
          : _list([for (final i in sent) _sentCard(i)]);
    } else {
      body = buddies.isEmpty
          ? const _Empty('No parties yet.\nJoin a quest or accept a request.')
          : _list([for (final i in buddies) _buddyCard(i)]);
    }

    return WoodPanel(
      child: Column(
        children: [
          const BoardHeader(
            title: 'INVITES',
            subtitle: 'Join requests and your study parties',
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              children: [
                _segment(0, 'Received', received.length),
                const SizedBox(width: 8),
                _segment(1, 'Sent', 0),
                const SizedBox(width: 8),
                _segment(2, 'Parties', 0),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: RefreshIndicator(
              color: Colors.black,
              backgroundColor: AppColors.gold,
              onRefresh: _refresh,
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                child: KeyedSubtree(key: ValueKey(_section), child: body),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _segment(int index, String label, int badge) {
    final selected = _section == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _section = index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 9),
          decoration: BoxDecoration(
            color: selected
                ? AppColors.gold
                : BoardColors.parchmentLight.withValues(alpha: 0.85),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: selected ? BoardColors.woodEdge : BoardColors.parchmentEdge,
              width: 1.5,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Flexible(
                child: Text(
                  label,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.cinzel(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: selected ? Colors.black : BoardColors.textBrown,
                  ),
                ),
              ),
              if (badge > 0) ...[
                const SizedBox(width: 6),
                _Badge(count: badge),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _list(List<Widget> cards) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(14, 6, 14, 24),
      children: [
        for (final c in cards)
          Padding(padding: const EdgeInsets.only(bottom: 12), child: c),
      ],
    );
  }

  Widget _receivedCard(Invite invite) {
    final busy = _busy.contains(invite.id);
    return _InviteCard(
      invite: invite,
      subtitle: 'asked to join your quest',
      footer: busy
          ? const Center(
              child: Padding(
                padding: EdgeInsets.all(8),
                child: CircularProgressIndicator(color: AppColors.wood),
              ),
            )
          : Row(
              children: [
                Expanded(
                  child: _SmallButton(
                    label: 'Accept',
                    icon: Icons.check,
                    gold: true,
                    onTap: () => _accept(invite),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _SmallButton(
                    label: 'Decline',
                    icon: Icons.close,
                    gold: false,
                    onTap: () => _decline(invite),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _sentCard(Invite invite) {
    final (label, color, icon) = switch (invite.status) {
      InviteStatus.pending => ('Waiting for the author', const Color(0xFF9A7800), Icons.hourglass_top),
      InviteStatus.accepted => ('You\'re in!', const Color(0xFF2F7D32), Icons.check_circle),
      InviteStatus.declined => ('Declined', const Color(0xFFB3122A), Icons.cancel),
    };
    return _InviteCard(
      invite: invite,
      subtitle: 'you asked to join',
      footer: Row(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 6),
          Text(label,
              style: TextStyle(fontWeight: FontWeight.w800, color: color)),
          const Spacer(),
          if (invite.status == InviteStatus.accepted)
            TextButton(
              onPressed: () => setState(() => _section = 2),
              child: const Text('See party',
                  style: TextStyle(
                      color: AppColors.wood, fontWeight: FontWeight.w800)),
            ),
        ],
      ),
    );
  }

  Widget _buddyCard(Invite invite) {
    final busy = _busy.contains(invite.id);
    return _InviteCard(
      invite: invite,
      subtitle: invite.courseCode,
      footer: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.fieldFill,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.fieldBorder, width: 1.5),
            ),
            child: Row(
              children: [
                const Icon(Icons.place_outlined, size: 18, color: AppColors.wood),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    invite.meetInfo,
                    style: const TextStyle(
                        fontWeight: FontWeight.w800, color: AppColors.heading),
                  ),
                ),
              ],
            ),
          ),
          if (!invite.quest.isMine) ...[
            const SizedBox(height: 10),
            busy
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.wood))
                : _SmallButton(
                    label: 'Leave Party',
                    icon: Icons.logout,
                    gold: false,
                    onTap: () => _leave(invite),
                  ),
          ],
        ],
      ),
    );
  }
}

class _InviteCard extends StatelessWidget {
  const _InviteCard({
    required this.invite,
    required this.subtitle,
    required this.footer,
  });

  final Invite invite;
  final String subtitle;
  final Widget footer;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
      decoration: parchmentDecoration(radius: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              // Wax-seal avatar with initials
              Container(
                width: 44,
                height: 44,
                alignment: Alignment.center,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    center: Alignment(-0.3, -0.4),
                    colors: [Color(0xFFE0394F), Color(0xFFB3122A), Color(0xFF7E0A1C)],
                  ),
                ),
                child: Text(
                  invite.initials,
                  style: GoogleFonts.cinzel(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                    color: const Color(0xFFFFE9B0),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      invite.name,
                      style: GoogleFonts.cinzel(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: BoardColors.inkBrown,
                      ),
                    ),
                    Text(
                      '${invite.major} · $subtitle',
                      style: const TextStyle(
                          fontSize: 12.5, color: BoardColors.softBrown),
                    ),
                  ],
                ),
              ),
              Text(invite.sentAgo,
                  style: const TextStyle(fontSize: 12, color: BoardColors.softBrown)),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              CourseTag(code: invite.courseCode),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '"${invite.message}"',
            style: const TextStyle(
              fontSize: 14,
              height: 1.35,
              fontStyle: FontStyle.italic,
              color: BoardColors.textBrown,
            ),
          ),
          const SizedBox(height: 12),
          footer,
        ],
      ),
    );
  }
}

class _SmallButton extends StatelessWidget {
  const _SmallButton({
    required this.label,
    required this.icon,
    required this.gold,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool gold;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final textColor = gold ? AppColors.woodDark : const Color(0xFFFFE9B0);
    return Material(
      color: Colors.transparent,
      child: Ink(
        height: 42,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: gold
                ? const [Color(0xFFFFE07A), AppColors.gold, Color(0xFFC99A00)]
                : const [Color(0xFF9C6B3C), AppColors.wood, Color(0xFF6B4423)],
          ),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.woodDark, width: 2),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: textColor),
              const SizedBox(width: 6),
              Text(
                label,
                style: GoogleFonts.cinzel(
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: textColor,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
      decoration: BoxDecoration(
        color: BoardColors.stampRed,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        '$count',
        style: const TextStyle(
            fontSize: 11, fontWeight: FontWeight.w900, color: Colors.white),
      ),
    );
  }
}

class _Empty extends StatelessWidget {
  const _Empty(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    // Scrollable even when empty so pull-to-refresh still works.
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        const SizedBox(height: 60),
        Text(
          text,
          textAlign: TextAlign.center,
          style: GoogleFonts.cinzel(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: BoardColors.signText,
          ),
        ),
      ],
    );
  }
}

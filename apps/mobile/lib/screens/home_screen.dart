// Home after logging in. Three tabs (wooden bar at the bottom):
//   Quest Board - every post from Knights looking for study partners
//   For You     - only posts that share one of your courses AND at least
//                 30 minutes of free time with you
//   Invites     - invites you received / sent, and your study buddies
//   Profile     - your major, courses and weekly free times
// Everything comes from the team's Express backend (see board_service.dart).
// Typing in the search box runs the server's partial-match search.

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/auth_service.dart';
import '../services/board_service.dart';
import '../services/invite_service.dart';
import '../services/profile_service.dart';
import '../widgets/auth_widgets.dart';
import '../widgets/board_widgets.dart';
import '../widgets/castle_doors.dart';
import '../widgets/castle_scene.dart';
import '../widgets/knight_slash_route.dart';
import 'invites_screen.dart';
import 'profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  final _searchController = TextEditingController();
  List<Bounty> _all = [];
  List<Bounty>? _results; // server search results; null = no search text
  List<QuestMatch> _matches = [];
  Timer? _debounce;
  bool _searching = false;
  bool _loading = true;
  String? _loadError;
  String? _course; // selected course filter, null = All
  int _tab = 0; // 0 = Quest Board, 1 = For You, 2 = Invites, 3 = Profile

  // Logout: the castle doors swing shut, then open onto the login page.
  late final AnimationController _doors = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 950),
  );
  late final Animation<double> _doorsClosed = TweenSequence<double>([
    TweenSequenceItem(
      tween: Tween(begin: 0.0, end: 1.0).chain(CurveTween(curve: Curves.easeInCubic)),
      weight: 80,
    ),
    TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.96), weight: 8),
    TweenSequenceItem(tween: Tween(begin: 0.96, end: 1.0), weight: 12),
  ]).animate(_doors);
  bool _loggingOut = false;
  bool _showFarewell = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _doors.dispose();
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load({bool showSpinner = true}) async {
    if (showSpinner) setState(() => _loading = true);
    try {
      final bounties = await BoardService.fetchBounties();
      final matches = ProfileService.current.isComplete
          ? await BoardService.fetchMatches()
          : <QuestMatch>[];
      if (!mounted) return;
      setState(() {
        _all = bounties;
        _matches = matches;
        _loadError = null;
      });
      if (_searchController.text.trim().isNotEmpty) {
        await _runSearch(_searchController.text);
      }
    } on ApiException catch (e) {
      if (mounted) setState(() => _loadError = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
    // Updates the red badge on the Invites tab.
    InviteService.refresh().then((_) {
      if (mounted) setState(() {});
    }).catchError((_) {});
  }

  /// Search runs on the server, a moment after the user stops typing.
  void _onSearchChanged(String text) {
    _debounce?.cancel();
    if (text.trim().isEmpty) {
      setState(() => _results = null);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 350), () => _runSearch(text));
  }

  Future<void> _runSearch(String text) async {
    setState(() => _searching = true);
    try {
      final results = await BoardService.search(text);
      if (!mounted || _searchController.text != text) return;
      setState(() => _results = results);
    } on ApiException catch (e) {
      if (mounted) _toast(e.message);
    } finally {
      if (mounted) setState(() => _searching = false);
    }
  }

  void _toast(String text) => ScaffoldMessenger.of(context)
      .showSnackBar(SnackBar(content: Text(text)));

  /// Swap in a quest the server just sent back after a change.
  void _replace(Bounty updated) {
    List<Bounty> swap(List<Bounty> list) =>
        [for (final b in list) b.id == updated.id ? updated : b];
    setState(() {
      _all = swap(_all);
      if (_results != null) _results = swap(_results!);
      _matches = [
        for (final m in _matches)
          if (m.bounty.id != updated.id) m
      ];
    });
  }

  List<String> get _courses => {for (final b in _all) b.courseCode}.toList()..sort();

  List<Bounty> get _visible => (_results ?? _all)
      .where((b) => _course == null || b.courseCode == _course)
      .toList();

  Future<void> _logout() async {
    if (_loggingOut) return;
    setState(() => _loggingOut = true);
    await _doors.forward();
    if (!mounted) return;
    HapticFeedback.heavyImpact();
    setState(() => _showFarewell = true);
    await Future.delayed(const Duration(milliseconds: 1100));
    if (!mounted) return;
    setState(() => _showFarewell = false);
    await Future.delayed(const Duration(milliseconds: 260));
    if (!mounted) return;
    AuthService.logout();
    ProfileService.clear();
    InviteService.clear();
    Navigator.pushNamedAndRemoveUntil(
      context,
      '/login',
      (route) => false,
      arguments: kDoorsTransition,
    );
  }

  Future<void> _requestToJoin(Bounty bounty) async {
    try {
      final updated = await BoardService.requestToJoin(bounty.id);
      if (!mounted) return;
      _replace(updated);
      _toast('Request sent! The quest author will accept or decline it. '
          'Check Invites > Sent.');
      InviteService.refresh().then((_) {
        if (mounted) setState(() {});
      }).catchError((_) {});
    } on ApiException catch (e) {
      if (mounted) _toast(e.message);
    }
  }

  Future<void> _leave(Bounty bounty) async {
    try {
      final updated = await BoardService.leave(bounty.id);
      if (!mounted) return;
      _replace(updated);
      _toast('You left "${bounty.title}".');
    } on ApiException catch (e) {
      if (mounted) _toast(e.message);
    }
  }

  Future<void> _delete(Bounty bounty) async {
    try {
      await BoardService.delete(bounty.id);
      if (!mounted) return;
      setState(() {
        _all = _all.where((b) => b.id != bounty.id).toList();
        _results = _results?.where((b) => b.id != bounty.id).toList();
      });
      _toast('Quest removed from the board.');
    } on ApiException catch (e) {
      if (mounted) _toast(e.message);
    }
  }

  void _openBounty(Bounty bounty) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _BountySheet(
        bounty: bounty,
        onRequest: () => _requestToJoin(bounty),
        onLeave: () => _leave(bounty),
        onDelete: () => _delete(bounty),
      ),
    );
  }

  void _openPostSheet() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _PostQuestSheet(
        onPosted: (bounty) {
          setState(() {
            _course = null;
            _results = null;
            _searchController.clear();
          });
          _toast('Quest pinned to the board!');
          _load(showSpinner: false);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final name = AuthService.currentUserFirstName ?? 'Knight';
    final page = Scaffold(
      resizeToAvoidBottomInset: false,
      bottomNavigationBar: _KnightNavBar(
        index: _tab,
        inviteBadge: InviteService.incomingPending.length,
        onSelected: (i) => setState(() => _tab = i),
      ),
      floatingActionButton: _tab >= 2
          ? null
          : FloatingActionButton.extended(
        onPressed: _openPostSheet,
        backgroundColor: AppColors.gold,
        foregroundColor: Colors.black,
        icon: const Icon(Icons.campaign_outlined),
        label: const Text('Post a Quest',
            style: TextStyle(fontWeight: FontWeight.w800)),
      ),
      body: Stack(
        children: [
          const Positioned.fill(child: CastleScene()),
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 0),
              child: Column(
                children: [
                  Row(
                    children: [
                      const TitleBanner(compact: true),
                      const Spacer(),
                      _RoundIconButton(
                        icon: Icons.logout,
                        tooltip: 'Log out',
                        onTap: _logout,
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (_tab == 0) ...[
                    _WelcomeRibbon(name: name),
                    const SizedBox(height: 12),
                  ],
                  Expanded(
                    child: IndexedStack(
                      index: _tab,
                      children: [
                    WoodPanel(
                      child: Column(
                        children: [
                          const BoardHeader(),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            child: ParchmentSearchField(
                              controller: _searchController,
                              onChanged: _onSearchChanged,
                            ),
                          ),
                          const SizedBox(height: 10),
                          if (_courses.isNotEmpty)
                            CourseChips(
                              courses: _courses,
                              selected: _course,
                              onSelected: (c) => setState(() => _course = c),
                            ),
                          SizedBox(
                            height: 4,
                            child: _searching
                                ? const LinearProgressIndicator(
                                    color: AppColors.gold,
                                    backgroundColor: Colors.transparent)
                                : null,
                          ),
                          Expanded(child: _buildList()),
                        ],
                      ),
                    ),
                    WoodPanel(
                      child: Column(
                        children: [
                          const BoardHeader(
                            title: 'FOR YOU',
                            subtitle: 'Quests that fit your courses & free times',
                          ),
                          Expanded(child: _buildForYou()),
                        ],
                      ),
                    ),
                    InvitesTab(onChanged: () => setState(() {})),
                    ProfileTab(onSaved: () => _load(showSpinner: false)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                ],
              ),
            ),
          ),
        ],
      ),
    );

    return Stack(
      fit: StackFit.expand,
      children: [
        page,
        if (_loggingOut)
          AnimatedBuilder(
            animation: _doorsClosed,
            builder: (context, _) => AbsorbPointer(
              child: CastleDoors(
                closed: _doorsClosed.value,
                message: 'Farewell, $name!',
                messageOpacity: _showFarewell ? 1 : 0,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildForYou() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.gold));
    }
    final profile = ProfileService.current;
    if (!profile.isComplete) {
      return ListView(
        padding: const EdgeInsets.fromLTRB(14, 6, 14, 100),
        children: [
          ParchmentPanel(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const PanelTitle('Finish Your Profile', icon: Icons.person_pin),
                const SizedBox(height: 8),
                const BodyText(
                    'Add your courses and the times you are free, and we will '
                    'show the quests that fit you.'),
                const SizedBox(height: 6),
                Text('Still needed: ${profile.missing.join(', ')}',
                    style: const TextStyle(
                        fontSize: 13.5, color: AppColors.subtitle)),
                const SizedBox(height: 16),
                PrimaryButton(
                  label: 'Go to Profile',
                  onPressed: () => setState(() => _tab = 3),
                ),
              ],
            ),
          ),
        ],
      );
    }
    final matches = _matches;
    return RefreshIndicator(
      color: Colors.black,
      backgroundColor: AppColors.gold,
      onRefresh: () => _load(showSpinner: false),
      child: matches.isEmpty
          ? ListView(
              children: [
                const SizedBox(height: 60),
                Center(
                  child: Text(
                    'No quests match your courses\nand free times yet.\nPost your own!',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.cinzel(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                      color: BoardColors.signText,
                    ),
                  ),
                ),
              ],
            )
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(14, 6, 14, 100),
              itemCount: matches.length,
              itemBuilder: (context, i) => Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: BountyNote(
                  key: ValueKey('for-you-${matches[i].bounty.id}'),
                  bounty: matches[i].bounty,
                  index: i,
                  matchNote: matches[i].reason,
                  onTap: () => _openBounty(matches[i].bounty),
                ),
              ),
            ),
    );
  }

  Widget _buildList() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator(color: AppColors.gold));
    }
    if (_loadError != null) {
      return Center(
        child: Text(_loadError!,
            style: const TextStyle(color: BoardColors.signText, fontSize: 16)),
      );
    }
    final items = _visible;
    return RefreshIndicator(
      color: Colors.black,
      backgroundColor: AppColors.gold,
      onRefresh: () => _load(showSpinner: false),
      child: items.isEmpty
          ? ListView(
              children: [
                const SizedBox(height: 60),
                Center(
                  child: Text(
                    'No quests match.\nPost your own!',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.cinzel(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: BoardColors.signText,
                    ),
                  ),
                ),
              ],
            )
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(14, 6, 14, 100),
              itemCount: items.length,
              itemBuilder: (context, i) => Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: BountyNote(
                  key: ValueKey(items[i].id),
                  bounty: items[i],
                  index: i,
                  onTap: () => _openBounty(items[i]),
                ),
              ),
            ),
    );
  }
}

class _WelcomeRibbon extends StatelessWidget {
  const _WelcomeRibbon({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.88),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.goldBorder, width: 2),
      ),
      child: Row(
        children: [
          const Icon(Icons.shield, color: AppColors.gold),
          const SizedBox(width: 10),
          Expanded(
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: 'Welcome, $name! ',
                    style: const TextStyle(fontWeight: FontWeight.w800),
                  ),
                  const TextSpan(text: 'Pick a quest or post your own.'),
                ],
              ),
              style: const TextStyle(fontSize: 15, color: AppColors.heading),
            ),
          ),
        ],
      ),
    );
  }
}

class _RoundIconButton extends StatelessWidget {
  const _RoundIconButton({
    required this.icon,
    required this.tooltip,
    required this.onTap,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: AppColors.gold,
        shape: const CircleBorder(side: BorderSide(color: Colors.black, width: 2)),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Icon(icon, color: Colors.black),
          ),
        ),
      ),
    );
  }
}

/// Parchment sheet that slides up when a note is tapped.
class _SheetFrame extends StatelessWidget {
  const _SheetFrame({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Container(
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [BoardColors.parchmentLight, BoardColors.parchmentDark],
          ),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border.all(color: BoardColors.parchmentEdge, width: 2),
        ),
        child: SafeArea(
          top: false,
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(22, 12, 22, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 44,
                    height: 5,
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: BoardColors.parchmentEdge,
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
                ),
                child,
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _BountySheet extends StatefulWidget {
  const _BountySheet({
    required this.bounty,
    required this.onRequest,
    required this.onLeave,
    required this.onDelete,
  });

  final Bounty bounty;
  final Future<void> Function() onRequest;
  final Future<void> Function() onLeave;
  final Future<void> Function() onDelete;

  @override
  State<_BountySheet> createState() => _BountySheetState();
}

class _BountySheetState extends State<_BountySheet> {
  bool _loading = false;

  Future<void> _do(Future<void> Function() action) async {
    setState(() => _loading = true);
    await action();
    if (mounted) Navigator.pop(context);
  }

  Widget _status(String text, IconData icon) => Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: BoardColors.woodEdge),
          const SizedBox(width: 8),
          Flexible(
            child: Text(text,
                style: GoogleFonts.cinzel(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: BoardColors.inkBrown)),
          ),
        ],
      );

  List<Widget> _actions(Bounty b) {
    if (b.isMine) {
      return [
        _status(
            b.requestIds.isEmpty
                ? 'Your quest'
                : 'Your quest · ${b.requestIds.length} waiting in Invites',
            Icons.shield),
        const SizedBox(height: 12),
        SecondaryButton(
            label: 'Remove Quest', onPressed: () => _do(widget.onDelete)),
      ];
    }
    if (b.joined) {
      return [
        _status("You're in this party", Icons.check_circle),
        const SizedBox(height: 12),
        SecondaryButton(
            label: 'Leave Party', onPressed: () => _do(widget.onLeave)),
      ];
    }
    if (b.requested) return [const Center(child: RequestedStamp())];
    if (b.isFull || !b.isOpen) {
      return [_status('This party is full', Icons.block)];
    }
    return [
      PrimaryButton(
        label: 'Accept Quest',
        onPressed: () => _do(widget.onRequest),
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.bounty;
    return _SheetFrame(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              CourseTag(code: b.courseCode),
              const Spacer(),
              SpotsBadge(spots: b.spots),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            b.title,
            style: GoogleFonts.cinzel(
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: BoardColors.inkBrown,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            b.courseName,
            style: const TextStyle(
                fontStyle: FontStyle.italic, color: BoardColors.softBrown),
          ),
          const SizedBox(height: 14),
          Text(b.details,
              style: const TextStyle(
                  fontSize: 15, height: 1.45, color: BoardColors.textBrown)),
          const SizedBox(height: 14),
          InfoRow(icon: Icons.person_outline, text: 'Posted by ${b.posterName} · ${b.postedAgo}'),
          InfoRow(icon: Icons.schedule, text: b.when),
          InfoRow(icon: Icons.place_outlined, text: b.where),
          InfoRow(icon: Icons.groups_outlined, text: 'Party: ${b.reward}'),
          const SizedBox(height: 20),
          if (_loading)
            const Center(child: CircularProgressIndicator(color: AppColors.wood))
          else
            ..._actions(b),
          const SizedBox(height: 8),
          const Text(
            'The quest author accepts or declines each request.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12.5, color: BoardColors.softBrown),
          ),
        ],
      ),
    );
  }
}

class _PostQuestSheet extends StatefulWidget {
  const _PostQuestSheet({required this.onPosted});

  final ValueChanged<Bounty> onPosted;

  @override
  State<_PostQuestSheet> createState() => _PostQuestSheetState();
}

class _PostQuestSheetState extends State<_PostQuestSheet> {
  final _formKey = GlobalKey<FormState>();
  final _course = TextEditingController();
  final _title = TextEditingController();
  final _details = TextEditingController();
  DateTime? _date;
  TimeOfDay _start = const TimeOfDay(hour: 15, minute: 0);
  TimeOfDay _end = const TimeOfDay(hour: 17, minute: 0);
  String? _slotError;
  String? _submitError;
  final _where = TextEditingController();
  int _spots = 2;
  bool _loading = false;

  @override
  void dispose() {
    _course.dispose();
    _title.dispose();
    _details.dispose();
    _where.dispose();
    super.dispose();
  }

  String? _required(String? v) =>
      (v == null || v.trim().isEmpty) ? 'Required' : null;

  int _mins(TimeOfDay t) => t.hour * 60 + t.minute;

  String get _whenLabel {
    final d = _date!;
    final slot = TimeSlot(
        dayOfWeek: d.weekday % 7,
        startMinute: _mins(_start),
        endMinute: _mins(_end));
    return '${d.month}/${d.day}/${d.year} · ${slot.label}';
  }

  Future<void> _pickWhen() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _date ?? now,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: now.add(const Duration(days: 180)),
      helpText: 'Quest date',
    );
    if (date == null || !mounted) return;
    final start = await showTimePicker(
        context: context, initialTime: _start, helpText: 'Start time');
    if (start == null || !mounted) return;
    final end = await showTimePicker(
        context: context, initialTime: _end, helpText: 'End time');
    if (end == null) return;
    setState(() {
      _date = date;
      _start = start;
      _end = end;
      _slotError = _mins(end) <= _mins(start)
          ? 'End time must be after the start time.'
          : null;
    });
  }

  Future<void> _submit() async {
    final formOk = _formKey.currentState!.validate();
    setState(() {
      if (_date == null) _slotError = 'Pick a date and time.';
      _submitError = null;
    });
    if (!formOk || _date == null || _slotError != null) return;
    setState(() => _loading = true);
    try {
      final bounty = await BoardService.postBounty(
        courseCode: _course.text,
        title: _title.text,
        details: _details.text,
        date: _date!,
        startMinute: _mins(_start),
        endMinute: _mins(_end),
        where: _where.text,
        spots: _spots,
      );
      if (!mounted) return;
      widget.onPosted(bounty);
      Navigator.pop(context);
    } on ApiException catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _submitError = e.message;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return _SheetFrame(
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Post a Quest',
              style: GoogleFonts.cinzelDecorative(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: BoardColors.inkBrown,
              ),
            ),
            const SizedBox(height: 4),
            const Text('Tell other Knights what you need help with.',
                style: TextStyle(color: BoardColors.softBrown)),
            const SizedBox(height: 18),
            if (ProfileService.current.courses.isNotEmpty) ...[
              const Text('Your courses',
                  style: TextStyle(
                      fontWeight: FontWeight.w700, color: BoardColors.textBrown)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final code in ProfileService.current.courses)
                    ActionChip(
                      label: Text(code),
                      backgroundColor: AppColors.fieldFill,
                      side: const BorderSide(color: AppColors.fieldBorder),
                      onPressed: () => setState(() => _course.text = code),
                    ),
                ],
              ),
              const SizedBox(height: 12),
            ],
            AuthTextField(
              label: 'Course',
              hint: 'e.g. COP 4331',
              controller: _course,
              textCapitalization: TextCapitalization.characters,
              validator: _required,
            ),
            AuthTextField(
              label: 'Quest title',
              hint: 'e.g. Exam 2 study group',
              controller: _title,
              textCapitalization: TextCapitalization.sentences,
              validator: _required,
            ),
            AuthTextField(
              label: 'Details (optional)',
              hint: 'What will you work on?',
              controller: _details,
              textCapitalization: TextCapitalization.sentences,
            ),
            AuthTextField(
              label: 'Where',
              hint: 'e.g. Library, 3rd floor',
              controller: _where,
              textInputAction: TextInputAction.done,
              validator: _required,
            ),
            const Text('When',
                style: TextStyle(
                    fontWeight: FontWeight.w700, color: BoardColors.textBrown)),
            const SizedBox(height: 8),
            if (_date != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    const Icon(Icons.event, size: 18, color: AppColors.wood),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(_whenLabel,
                          style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              color: AppColors.heading)),
                    ),
                  ],
                ),
              ),
            SecondaryButton(
              label: _date == null ? '+ Pick Date & Time' : 'Change Date & Time',
              onPressed: _pickWhen,
            ),
            if (_slotError != null)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(_slotError!,
                    style: const TextStyle(
                        color: AppColors.error, fontWeight: FontWeight.w700)),
              ),
            const SizedBox(height: 16),
            const Text('Knights who can join',
                style: TextStyle(
                    fontWeight: FontWeight.w700, color: BoardColors.textBrown)),
            const SizedBox(height: 8),
            Row(
              children: [
                for (var n = 1; n <= 5; n++)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: GestureDetector(
                      onTap: () => setState(() => _spots = n),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: 44,
                        height: 44,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: _spots == n ? AppColors.gold : Colors.white,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: _spots == n
                                ? BoardColors.woodEdge
                                : AppColors.goldBorder,
                            width: 2,
                          ),
                        ),
                        child: Text('$n',
                            style: const TextStyle(
                                fontWeight: FontWeight.w800, fontSize: 16)),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 22),
            if (_submitError != null) ErrorBanner(message: _submitError!),
            PrimaryButton(
                label: 'Pin it to the board', loading: _loading, onPressed: _submit),
          ],
        ),
      ),
    );
  }
}

/// Wooden tab bar at the bottom: Quest Board / For You / Profile.
class _KnightNavBar extends StatelessWidget {
  const _KnightNavBar({
    required this.index,
    required this.onSelected,
    this.inviteBadge = 0,
  });

  final int index;
  final ValueChanged<int> onSelected;
  final int inviteBadge; // number of new invites, shown on the Invites tab

  static const _items = [
    (Icons.dashboard_rounded, 'Board'),
    (Icons.auto_awesome, 'For You'),
    (Icons.mail_rounded, 'Invites'),
    (Icons.person_rounded, 'Profile'),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF8B5A2B), Color(0xFF5E3A1A)],
        ),
        border: Border(top: BorderSide(color: AppColors.gold, width: 3)),
        boxShadow: [
          BoxShadow(color: Color(0x55000000), blurRadius: 10, offset: Offset(0, -2)),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: Row(
            children: [
              for (var i = 0; i < _items.length; i++)
                Expanded(
                  child: InkWell(
                    onTap: () => onSelected(i),
                    borderRadius: BorderRadius.circular(12),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      decoration: BoxDecoration(
                        color: i == index
                            ? AppColors.gold.withValues(alpha: 0.95)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Badge(
                            isLabelVisible: i == 2 && inviteBadge > 0,
                            label: Text('$inviteBadge'),
                            backgroundColor: BoardColors.stampRed,
                            child: Icon(_items[i].$1,
                                color: i == index
                                    ? AppColors.woodDark
                                    : const Color(0xFFFFE9B0)),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _items[i].$2,
                            style: GoogleFonts.cinzel(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: i == index
                                  ? AppColors.woodDark
                                  : const Color(0xFFFFE9B0),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

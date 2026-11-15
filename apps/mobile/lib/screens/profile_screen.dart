// Profile / settings tab: major, gender, courses and weekly free times,
// saved to the server (/api/profile). The server's For You matching uses
// the courses and free times.

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_client.dart';
import '../services/profile_service.dart';
import '../widgets/auth_widgets.dart';

class ProfileTab extends StatefulWidget {
  const ProfileTab({super.key, required this.onSaved});

  /// Called after saving so other tabs can refresh their matches.
  final VoidCallback onSaved;

  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab> {
  // Edit a copy; only the Save button writes it back.
  late StudentProfile _draft = ProfileService.current.copy();
  late final _majorController = TextEditingController(text: _draft.major);
  final _courseSearch = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    // Update the "Still needed" status as the major is typed.
    _majorController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _majorController.dispose();
    _courseSearch.dispose();
    super.dispose();
  }

  Future<void> _addSlot() async {
    final slot = await pickTimeSlot(context);
    if (slot == null) return;
    setState(() {
      _draft.availability = [..._draft.availability, slot]
        ..sort((a, b) => a.dayOfWeek != b.dayOfWeek
            ? a.dayOfWeek.compareTo(b.dayOfWeek)
            : a.startMinute.compareTo(b.startMinute));
    });
  }

  Future<void> _save() async {
    _draft.major = _majorController.text;
    if (!_draft.isComplete) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Still needed: ${_draft.missing.join(', ')}')),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      await ProfileService.save(_draft);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not save: ${e.message}')),
      );
      return;
    }
    if (!mounted) return;
    setState(() {
      _saving = false;
      _draft = ProfileService.current.copy();
    });
    widget.onSaved();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(_draft.isComplete
            ? 'Profile saved! Check For You for your matches.'
            : 'Saved. Finish your profile to see matches.'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Keep the major in the draft as the user types so the status updates.
    _draft.major = _majorController.text;
    final missing = _draft.missing;
    const total = 3;
    final done = total - missing.length;

    return ListView(
      // Extra space at the bottom so the keyboard never hides a field.
      padding: EdgeInsets.fromLTRB(
          0, 4, 0, 24 + MediaQuery.viewInsetsOf(context).bottom),
      children: [
        // ---------- status ----------
        ParchmentPanel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const PanelTitle('Your Knight Profile', icon: Icons.person_pin),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  value: done / total,
                  minHeight: 10,
                  backgroundColor: AppColors.fieldFill,
                  color: missing.isEmpty ? const Color(0xFF3E8E41) : AppColors.gold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                missing.isEmpty
                    ? 'Complete! You can be matched with other Knights.'
                    : 'Still needed: ${missing.join(', ')}',
                style: const TextStyle(fontSize: 14, color: AppColors.body),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // ---------- about you ----------
        ParchmentPanel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const PanelTitle('About You', icon: Icons.badge_outlined),
              const SizedBox(height: 14),
              AuthTextField(
                label: 'Major',
                hint: 'e.g. Computer Science',
                icon: Icons.school_outlined,
                controller: _majorController,
                textCapitalization: TextCapitalization.words,
                onSubmitted: (_) => setState(() {}),
              ),
              const _FieldLabel('Gender (optional)'),
              _ChoiceRow(
                options: ProfileService.genders,
                selected: _draft.gender,
                onSelected: (v) => setState(() => _draft.gender = v),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // ---------- courses ----------
        ParchmentPanel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const PanelTitle('Your Courses', icon: Icons.menu_book_rounded),
              const SizedBox(height: 12),
              if (_draft.courses.isEmpty)
                const Padding(
                  padding: EdgeInsets.only(bottom: 10),
                  child: Text('No courses yet. Search below to add one.',
                      style: TextStyle(color: AppColors.subtitle)),
                )
              else
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final code in _draft.courses)
                        _CourseChip(
                          code: code,
                          onRemove: () => setState(() => _draft.courses =
                              _draft.courses.where((c) => c != code).toList()),
                        ),
                    ],
                  ),
                ),
              AuthTextField(
                label: 'Add a course',
                hint: 'Search: 3502, COP, Calculus...',
                icon: Icons.search,
                controller: _courseSearch,
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => setState(() {}),
              ),
              ValueListenableBuilder<TextEditingValue>(
                valueListenable: _courseSearch,
                builder: (context, value, _) {
                  final results = ProfileService.searchCatalog(value.text)
                      .where((c) => !_draft.courses.contains(c.code))
                      .take(5)
                      .toList();
                  if (value.text.trim().isEmpty) return const SizedBox.shrink();
                  if (results.isEmpty) {
                    // Not in the list: let them add any real course code.
                    final typed = value.text.trim();
                    final looksLikeCode =
                        RegExp(r'^[A-Za-z]{3}\s?\d{4}[A-Za-z]?$').hasMatch(typed);
                    final code = Course.pretty(typed);
                    if (!looksLikeCode || _draft.courses.contains(code)) {
                      return const Text('No matching courses. Type a full code like COP 4331.',
                          style: TextStyle(color: AppColors.subtitle));
                    }
                    return ListTile(
                      dense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 4),
                      leading: const Icon(Icons.add_circle_outline,
                          color: AppColors.wood),
                      title: Text('Add $code',
                          style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              color: AppColors.heading)),
                      onTap: () => setState(() {
                        _draft.courses = [..._draft.courses, code];
                        _courseSearch.clear();
                      }),
                    );
                  }
                  return Column(
                    children: [
                      for (final c in results)
                        ListTile(
                          dense: true,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 4),
                          leading: const Icon(Icons.add_circle_outline,
                              color: AppColors.wood),
                          title: Text(c.code,
                              style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.heading)),
                          subtitle: Text(c.name,
                              style: const TextStyle(color: AppColors.body)),
                          onTap: () => setState(() {
                            _draft.courses = [..._draft.courses, c.code];
                            _courseSearch.clear();
                          }),
                        ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // ---------- availability ----------
        ParchmentPanel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const PanelTitle('When You\'re Free', icon: Icons.calendar_month_rounded),
              const SizedBox(height: 4),
              const Text('Weekly times you can study.',
                  style: TextStyle(fontSize: 13.5, color: AppColors.subtitle)),
              const SizedBox(height: 12),
              if (_draft.availability.isEmpty)
                const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text('No times added yet.',
                      style: TextStyle(color: AppColors.subtitle)),
                ),
              for (final slot in _draft.availability)
                Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.only(left: 12),
                  decoration: BoxDecoration(
                    color: AppColors.fieldFill,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.fieldBorder, width: 1.5),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.schedule, size: 18, color: AppColors.wood),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(slot.label,
                            style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                color: AppColors.heading)),
                      ),
                      IconButton(
                        tooltip: 'Remove',
                        icon: const Icon(Icons.close, color: AppColors.subtitle),
                        onPressed: () => setState(() => _draft.availability =
                            _draft.availability.where((s) => s != slot).toList()),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: 4),
              SecondaryButton(label: '+ Add a Time', onPressed: _addSlot),
            ],
          ),
        ),
        const SizedBox(height: 18),
        PrimaryButton(label: 'Save Profile', loading: _saving, onPressed: _save),
      ],
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: GoogleFonts.cinzel(
          fontSize: 14,
          fontWeight: FontWeight.w800,
          color: AppColors.wood,
        ),
      ),
    );
  }
}

/// Row of pill buttons; one can be selected.
class _ChoiceRow extends StatelessWidget {
  const _ChoiceRow({
    required this.options,
    required this.selected,
    required this.onSelected,
  });

  final List<(String, String)> options; // (value, label)
  final String? selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final (value, label) in options)
          GestureDetector(
            onTap: () => onSelected(value),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: selected == value ? AppColors.gold : AppColors.fieldFill,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: selected == value ? AppColors.woodDark : AppColors.fieldBorder,
                  width: 1.5,
                ),
              ),
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: selected == value ? FontWeight.w800 : FontWeight.w600,
                  color: selected == value ? Colors.black : AppColors.body,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _CourseChip extends StatelessWidget {
  const _CourseChip({required this.code, required this.onRemove});

  final String code;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(left: 12, right: 4),
      decoration: BoxDecoration(
        color: AppColors.woodDark,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(code,
              style: const TextStyle(
                  color: AppColors.gold, fontWeight: FontWeight.w800)),
          IconButton(
            visualDensity: VisualDensity.compact,
            iconSize: 18,
            tooltip: 'Remove $code',
            icon: const Icon(Icons.close, color: Color(0xFFFFE9B0)),
            onPressed: onRemove,
          ),
        ],
      ),
    );
  }
}

/// Bottom sheet to pick a weekly free time: a day plus start and end times.
/// Returns null if cancelled.
Future<TimeSlot?> pickTimeSlot(BuildContext context) {
  return showModalBottomSheet<TimeSlot>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => const _TimeSlotSheet(),
  );
}

class _TimeSlotSheet extends StatefulWidget {
  const _TimeSlotSheet();

  @override
  State<_TimeSlotSheet> createState() => _TimeSlotSheetState();
}

class _TimeSlotSheetState extends State<_TimeSlotSheet> {
  int _day = 1; // Monday
  TimeOfDay _start = const TimeOfDay(hour: 14, minute: 0);
  TimeOfDay _end = const TimeOfDay(hour: 16, minute: 0);
  String? _error;

  int _minutes(TimeOfDay t) => t.hour * 60 + t.minute;

  Future<void> _pick(bool start) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: start ? _start : _end,
    );
    if (picked == null) return;
    setState(() {
      if (start) {
        _start = picked;
      } else {
        _end = picked;
      }
      _error = null;
    });
  }

  void _add() {
    final s = _minutes(_start);
    final e = _minutes(_end);
    if (e <= s) {
      setState(() => _error = 'End time must be after the start time.');
      return;
    }
    if (e - s < 30) {
      setState(() => _error = 'Pick at least 30 minutes.');
      return;
    }
    Navigator.pop(
        context, TimeSlot(dayOfWeek: _day, startMinute: s, endMinute: e));
  }

  Widget _timeButton(String label, TimeOfDay time, bool start) {
    return Expanded(
      child: InkWell(
        onTap: () => _pick(start),
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
          decoration: BoxDecoration(
            color: AppColors.fieldFill,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.fieldBorder, width: 2),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: const TextStyle(fontSize: 12, color: AppColors.subtitle)),
              const SizedBox(height: 2),
              Text(
                TimeSlot.formatMinute(_minutes(time)),
                style: GoogleFonts.cinzel(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.heading,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [AppColors.parchment, AppColors.parchmentDark],
        ),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border.all(color: AppColors.woodDark, width: 3),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const PanelTitle('Add a Free Time', icon: Icons.schedule),
              const SizedBox(height: 14),
              const _FieldLabel('Day'),
              _ChoiceRow(
                options: [
                  for (var i = 0; i < 7; i++) ('$i', TimeSlot.dayNames[i]),
                ],
                selected: '$_day',
                onSelected: (v) => setState(() => _day = int.parse(v)),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  _timeButton('From', _start, true),
                  const SizedBox(width: 12),
                  _timeButton('To', _end, false),
                ],
              ),
              if (_error != null) ...[
                const SizedBox(height: 10),
                Text(_error!,
                    style: const TextStyle(
                        color: AppColors.error, fontWeight: FontWeight.w700)),
              ],
              const SizedBox(height: 18),
              PrimaryButton(label: 'Add Time', onPressed: _add),
            ],
          ),
        ),
      ),
    );
  }
}

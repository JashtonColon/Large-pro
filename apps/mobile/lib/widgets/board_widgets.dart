// Pieces of the Quest Board: wooden panel, parchment notes, search box and
// course filter chips.

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/board_service.dart';
import 'auth_widgets.dart';

class BoardColors {
  static const woodLight = Color(0xFF8B5A2B);
  static const woodDark = Color(0xFF6B4423);
  static const woodEdge = Color(0xFF4A2E14);
  static const parchmentLight = Color(0xFFFBF0D0);
  static const parchmentDark = Color(0xFFEFD9A4);
  static const parchmentEdge = Color(0xFFC9A86A);
  static const inkBrown = Color(0xFF3B2412);
  static const softBrown = Color(0xFF7A5C3A);
  static const textBrown = Color(0xFF4A3520);
  static const signText = Color(0xFFFFE9B0);
  static const stampRed = Color(0xFFC0262D);
  static const linkGoldDark = Color(0xFF9A7800);
}

/// Wooden board that holds the notes.
class WoodPanel extends StatelessWidget {
  const WoodPanel({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [BoardColors.woodLight, BoardColors.woodDark],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: BoardColors.woodEdge, width: 5),
        boxShadow: const [
          BoxShadow(color: Color(0x55000000), blurRadius: 20, offset: Offset(0, 8)),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(15),
        child: CustomPaint(painter: _WoodGrainPainter(), child: child),
      ),
    );
  }
}

class _WoodGrainPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final seam = Paint()
      ..color = const Color(0x33000000)
      ..strokeWidth = 2;
    final grain = Paint()
      ..color = const Color(0x14000000)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;
    const plank = 64.0;
    for (var y = plank; y < size.height; y += plank) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), seam);
    }
    // A few wavy grain lines per plank.
    for (var y = 18.0; y < size.height; y += plank / 3) {
      final path = Path()..moveTo(0, y);
      for (var x = 0.0; x <= size.width; x += 24) {
        path.lineTo(x, y + math.sin(x / 37 + y) * 2.5);
      }
      canvas.drawPath(path, grain);
    }
  }

  @override
  bool shouldRepaint(covariant _WoodGrainPainter oldDelegate) => false;
}

/// "QUEST BOARD" sign at the top of the panel.
class BoardHeader extends StatelessWidget {
  const BoardHeader({
    super.key,
    this.title = 'QUEST BOARD',
    this.subtitle = 'Knights seeking study partners',
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final style = GoogleFonts.cinzelDecorative(
      fontSize: 22,
      fontWeight: FontWeight.w900,
      color: BoardColors.signText,
      letterSpacing: 2,
      shadows: const [Shadow(color: Color(0x99000000), offset: Offset(0, 2), blurRadius: 4)],
    );
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 14, 12, 4),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.shield_outlined, color: BoardColors.signText, size: 22),
              const SizedBox(width: 8),
              Flexible(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(title, style: style),
                ),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.shield_outlined, color: BoardColors.signText, size: 22),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: GoogleFonts.nunito(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: BoardColors.signText.withValues(alpha: 0.85),
            ),
          ),
          const SizedBox(height: 10),
        ],
      ),
    );
  }
}

/// Parchment-style search box.
class ParchmentSearchField extends StatelessWidget {
  const ParchmentSearchField({
    super.key,
    required this.controller,
    required this.onChanged,
  });

  final TextEditingController controller;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    OutlineInputBorder border(Color color, double width) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: color, width: width),
        );

    return ValueListenableBuilder<TextEditingValue>(
      valueListenable: controller,
      builder: (context, value, _) => TextField(
        controller: controller,
        onChanged: onChanged,
        textInputAction: TextInputAction.search,
        style: const TextStyle(color: BoardColors.inkBrown, fontSize: 15),
        decoration: InputDecoration(
          hintText: 'Search by course, topic, or name',
          hintStyle: const TextStyle(color: BoardColors.softBrown),
          prefixIcon: const Icon(Icons.search, color: BoardColors.softBrown),
          suffixIcon: value.text.isEmpty
              ? null
              : IconButton(
                  icon: const Icon(Icons.close, color: BoardColors.softBrown),
                  onPressed: () {
                    controller.clear();
                    onChanged('');
                  },
                ),
          filled: true,
          fillColor: BoardColors.parchmentLight,
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
          enabledBorder: border(BoardColors.parchmentEdge, 2),
          focusedBorder: border(AppColors.gold, 2.6),
        ),
      ),
    );
  }
}

/// Horizontal row of course filters: All, COP 4331, ...
class CourseChips extends StatelessWidget {
  const CourseChips({
    super.key,
    required this.courses,
    required this.selected,
    required this.onSelected,
  });

  final List<String> courses;
  final String? selected; // null = All
  final ValueChanged<String?> onSelected;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 38,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        children: [
          _chip('All', selected == null, () => onSelected(null)),
          for (final c in courses)
            _chip(c, selected == c, () => onSelected(selected == c ? null : c)),
        ],
      ),
    );
  }

  Widget _chip(String label, bool isSelected, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 14),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.gold
                : BoardColors.parchmentLight.withValues(alpha: 0.85),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? BoardColors.woodEdge : BoardColors.parchmentEdge,
              width: 1.5,
            ),
          ),
          child: Text(
            label,
            style: GoogleFonts.nunito(
              fontSize: 13,
              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
              color: isSelected ? Colors.black : BoardColors.textBrown,
            ),
          ),
        ),
      ),
    );
  }
}

/// One pinned parchment note on the board. Drops in when it first appears.
class BountyNote extends StatelessWidget {
  const BountyNote({
    super.key,
    required this.bounty,
    required this.index,
    required this.onTap,
    this.matchNote,
  });

  final Bounty bounty;
  final int index;
  final VoidCallback onTap;
  final String? matchNote; // why it matches you (For You page)

  static const _tilts = [-0.018, 0.012, -0.008, 0.016, -0.012, 0.008];

  @override
  Widget build(BuildContext context) {
    final tilt = _tilts[index % _tilts.length];
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: Duration(milliseconds: 380 + math.min(index, 8) * 70),
      curve: Curves.easeOutBack,
      builder: (context, v, child) => Opacity(
        opacity: v.clamp(0.0, 1.0),
        child: Transform.translate(offset: Offset(0, (1 - v) * -30), child: child),
      ),
      child: Transform.rotate(
        angle: tilt,
        child: Padding(
          padding: const EdgeInsets.only(top: 10),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: onTap,
                  borderRadius: BorderRadius.circular(6),
                  child: Ink(
                    decoration: parchmentDecoration(),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 18, 16, 14),
                      child: _NoteContent(bounty: bounty, matchNote: matchNote),
                    ),
                  ),
                ),
              ),
              const Positioned(top: -8, left: 0, right: 0, child: Center(child: _Pin())),
              if (bounty.requested)
                const Positioned(right: 10, bottom: 40, child: RequestedStamp()),
            ],
          ),
        ),
      ),
    );
  }
}

BoxDecoration parchmentDecoration({double radius = 6}) => BoxDecoration(
      gradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [BoardColors.parchmentLight, BoardColors.parchmentDark],
      ),
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: BoardColors.parchmentEdge, width: 1.5),
      boxShadow: const [
        BoxShadow(color: Color(0x55000000), blurRadius: 8, offset: Offset(2, 4)),
      ],
    );

class _NoteContent extends StatelessWidget {
  const _NoteContent({required this.bounty, this.matchNote});

  final Bounty bounty;
  final String? matchNote;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            CourseTag(code: bounty.courseCode),
            const Spacer(),
            Text(bounty.postedAgo,
                style: const TextStyle(fontSize: 12, color: BoardColors.softBrown)),
          ],
        ),
        if (matchNote != null) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
            decoration: BoxDecoration(
              color: AppColors.gold.withValues(alpha: 0.35),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFC99A00)),
            ),
            child: Row(
              children: [
                const Icon(Icons.auto_awesome, size: 15, color: BoardColors.woodEdge),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    matchNote!,
                    style: const TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: BoardColors.inkBrown,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 8),
        Text(
          bounty.title,
          style: GoogleFonts.cinzel(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: BoardColors.inkBrown,
            height: 1.2,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          bounty.courseName,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            fontSize: 12.5,
            fontStyle: FontStyle.italic,
            color: BoardColors.softBrown,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          bounty.details,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 14, color: BoardColors.textBrown, height: 1.35),
        ),
        const SizedBox(height: 10),
        InfoRow(icon: Icons.schedule, text: bounty.when),
        InfoRow(icon: Icons.place_outlined, text: bounty.where),
        const SizedBox(height: 6),
        Row(
          children: [
            const Icon(Icons.groups_outlined, size: 16, color: BoardColors.linkGoldDark),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                'Party: ${bounty.reward}',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 13,
                  fontStyle: FontStyle.italic,
                  color: BoardColors.textBrown,
                ),
              ),
            ),
            const SizedBox(width: 8),
            SpotsBadge(spots: bounty.spots),
          ],
        ),
      ],
    );
  }
}

class CourseTag extends StatelessWidget {
  const CourseTag({super.key, required this.code});

  final String code;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: BoardColors.woodEdge,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        code,
        style: GoogleFonts.nunito(
          fontSize: 13,
          fontWeight: FontWeight.w800,
          color: AppColors.gold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class InfoRow extends StatelessWidget {
  const InfoRow({super.key, required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: BoardColors.softBrown),
          const SizedBox(width: 6),
          Expanded(
            child: Text(text,
                style: const TextStyle(fontSize: 13.5, color: BoardColors.textBrown)),
          ),
        ],
      ),
    );
  }
}

class SpotsBadge extends StatelessWidget {
  const SpotsBadge({super.key, required this.spots});

  final int spots;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.gold.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: BoardColors.woodEdge, width: 1.2),
      ),
      child: Text(
        spots == 1 ? '1 spot' : '$spots spots',
        style: const TextStyle(
            fontSize: 12, fontWeight: FontWeight.w800, color: Colors.black),
      ),
    );
  }
}

class _Pin extends StatelessWidget {
  const _Pin();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 18,
      height: 18,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          center: Alignment(-0.3, -0.4),
          colors: [Color(0xFFFF8A8A), Color(0xFFB81D24)],
        ),
        boxShadow: [
          BoxShadow(color: Color(0x66000000), blurRadius: 4, offset: Offset(1, 2)),
        ],
      ),
    );
  }
}

/// Red "REQUESTED" ink stamp.
class RequestedStamp extends StatelessWidget {
  const RequestedStamp({super.key});

  @override
  Widget build(BuildContext context) {
    return Transform.rotate(
      angle: -0.25,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          border: Border.all(color: BoardColors.stampRed.withValues(alpha: 0.85), width: 2.5),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          'REQUESTED',
          style: GoogleFonts.cinzel(
            fontSize: 13,
            fontWeight: FontWeight.w900,
            color: BoardColors.stampRed.withValues(alpha: 0.85),
            letterSpacing: 2,
          ),
        ),
      ),
    );
  }
}

// Page transitions.
//
// KnightSlashRoute (every normal page change), like a longsword attack in a
// game:
//   1. wind-up: a huge sword (held by an off-screen knight in the bottom-left)
//      pulls back,
//   2. swing: it slashes across the screen in a wide arc with a gold
//      "swoosh" trail,
//   3. impact: flash, and the OLD page is cut in two along the blade's path,
//   4. follow-through: the sword keeps going and is pulled away,
//   5. the two halves slide apart and fall away, revealing the NEW page.
//   The old page is turned into a picture (SnapshotWidget) so it can be
//   drawn as two separate pieces.
//
// CastleDoorsRoute (after logging out): the castle doors swing open onto the
// login page.
//
// FireballRoute (log in -> board) lives in fireball_route.dart.

import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

import 'auth_widgets.dart';
import 'castle_doors.dart';

/// Pass this as `arguments` when pushing /login to use the doors transition.
const String kDoorsTransition = 'castle-doors';

// ---------- timing (v = 0..1 over the whole transition) ----------

const _windUpEnd = 0.14; // sword pulls back
const _swingEnd = 0.42; // fast slash
const _impact = 0.29; // moment the blade crosses the cut line
const _followEnd = 0.52; // follow-through
const _withdrawEnd = 0.62; // sword pulled off screen

/// How far each half has moved away from the cut, as a fraction (0..1).
double _openAt(double v) =>
    Curves.easeInCubic.transform(((v - 0.48) / 0.52).clamp(0.0, 1.0));

/// How far each half has slid along the cut line, in pixels.
double _slideAt(double v) =>
    Curves.easeOutCubic.transform(((v - _impact) / (1 - _impact)).clamp(0.0, 1.0)) * 70;

/// Where the knight's hands are (off screen, bottom-left).
Offset _pivotFor(Size size) => Offset(-0.18 * size.width, size.height * 1.08);

/// Sword angle relative to the cut line (radians) at time v.
double _swordAngleAt(double v) {
  if (v < _windUpEnd) {
    // Raise the sword up into view from off screen (wind-up).
    return -1.7 + 0.65 * Curves.easeOutCubic.transform(v / _windUpEnd);
  }
  if (v < _swingEnd) {
    final t = (v - _windUpEnd) / (_swingEnd - _windUpEnd);
    return -1.05 + 2.05 * Curves.easeInOutCubic.transform(t);
  }
  final t = ((v - _swingEnd) / (_followEnd - _swingEnd)).clamp(0.0, 1.0);
  return 1.0 + 0.18 * Curves.easeOutCubic.transform(t);
}

class _CutGeometry {
  _CutGeometry(Size size, Offset origin) {
    final w = size.width;
    final h = size.height;
    length = math.sqrt(w * w + h * h);
    center = origin + Offset(w / 2, h / 2);
    pivot = origin + _pivotFor(size);
    final d = center - pivot;
    along = d.distance == 0 ? const Offset(1, 0) : d / d.distance;
    across = Offset(-along.dy, along.dx);
  }

  late final double length;
  late final Offset center;
  late final Offset pivot;
  late final Offset along; // direction of the cut (bottom-left -> top-right)
  late final Offset across; // perpendicular to it

  double get angle => math.atan2(along.dy, along.dx);

  double gapFor(double open) => open * length * 0.75;

  /// The half on one side of the cut (side = -1 or +1).
  Path half(int side) {
    final far = length * 2;
    return Path()
      ..addPolygon([
        center - along * far,
        center + along * far,
        center + along * far + across * (far * side),
        center - along * far + across * (far * side),
      ], true);
  }

  /// The strip of width 2 * [gap] around the cut.
  Path band(double gap) {
    final far = length * 2;
    return Path()
      ..addPolygon([
        center - across * gap - along * far,
        center - across * gap + along * far,
        center + across * gap + along * far,
        center + across * gap - along * far,
      ], true);
  }
}

// ======================= Knight slash (cut) route =======================

class KnightSlashRoute<T> extends PageRouteBuilder<T> {
  KnightSlashRoute({required WidgetBuilder builder, super.settings})
      : super(
          transitionDuration: const Duration(milliseconds: 2700),
          reverseTransitionDuration: const Duration(milliseconds: 900),
          pageBuilder: (context, animation, secondaryAnimation) =>
              builder(context),
          transitionsBuilder: (context, animation, secondaryAnimation, child) =>
              KnightCutOutgoing(
                animation: secondaryAnimation,
                child: _CutIncoming(animation: animation, child: child),
              ),
        );

  // Only split this page when the next page also uses the cut transition
  // (not for the logout doors, bottom sheets, dialogs...).
  @override
  bool canTransitionTo(TransitionRoute<dynamic> nextRoute) =>
      nextRoute is KnightSlashRoute;
}

/// The new page: hidden until the cut opens, then visible only inside the
/// gap between the two halves of the old page. Also draws the blade.
class _CutIncoming extends StatelessWidget {
  const _CutIncoming({required this.animation, required this.child});

  final Animation<double> animation;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    // Same widget structure for the whole animation so the page keeps its
    // state (typed text etc.).
    return AnimatedBuilder(
      animation: animation,
      child: child,
      builder: (context, child) {
        final v = animation.value;
        final open = _openAt(v);
        return Stack(
          fit: StackFit.expand,
          children: [
            ClipPath(
              clipper: _BandClipper(open),
              clipBehavior: open >= 1 ? Clip.none : Clip.hardEdge,
              child: child,
            ),
            IgnorePointer(child: CustomPaint(painter: _SwordSwingPainter(v))),
          ],
        );
      },
    );
  }
}

class _BandClipper extends CustomClipper<Path> {
  _BandClipper(this.open);

  final double open;

  @override
  Path getClip(Size size) {
    final g = _CutGeometry(size, Offset.zero);
    return g.band(g.gapFor(open));
  }

  @override
  bool shouldReclip(covariant _BandClipper oldClipper) => oldClipper.open != open;
}

/// The old page, cut in two when the next page arrives with the sword cut.
/// Uses a snapshot (picture) of the page so each half can be drawn and moved
/// separately. Other routes wrap their page in this too so they can be cut
/// when leaving.
class KnightCutOutgoing extends StatefulWidget {
  const KnightCutOutgoing({super.key, required this.animation, required this.child});

  final Animation<double> animation;
  final Widget child;

  @override
  State<KnightCutOutgoing> createState() => KnightCutOutgoingState();
}

class KnightCutOutgoingState extends State<KnightCutOutgoing> {
  final _controller = SnapshotController();
  final _painter = _CutSnapshotPainter();

  @override
  void initState() {
    super.initState();
    widget.animation.addListener(_update);
    _update();
  }

  @override
  void didUpdateWidget(covariant KnightCutOutgoing oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.animation != widget.animation) {
      oldWidget.animation.removeListener(_update);
      widget.animation.addListener(_update);
      _update();
    }
  }

  void _update() {
    final v = widget.animation.value;
    final active = v > 0 && v < 1;
    if (_controller.allowSnapshotting != active) {
      _controller.allowSnapshotting = active;
    }
    _painter.progress = v;
  }

  @override
  void dispose() {
    widget.animation.removeListener(_update);
    _controller.dispose();
    _painter.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SnapshotWidget(
      controller: _controller,
      painter: _painter,
      mode: SnapshotMode.permissive,
      child: widget.child,
    );
  }
}

class _CutSnapshotPainter extends SnapshotPainter {
  double _progress = 0;

  set progress(double value) {
    if (value == _progress) return;
    _progress = value;
    notifyListeners();
  }

  @override
  void paint(PaintingContext context, Offset offset, Size size,
      PaintingContextCallback painter) {
    // Not cutting right now: draw the page normally.
    painter(context, offset);
  }

  @override
  void paintSnapshot(PaintingContext context, Offset offset, Size size,
      ui.Image image, Size sourceSize, double pixelRatio) {
    final canvas = context.canvas;
    final v = _progress;
    final g = _CutGeometry(size, offset);
    final gap = g.gapFor(_openAt(v));
    final slide = _slideAt(v);
    final fade = v < 0.85 ? 1.0 : (1 - (v - 0.85) / 0.15).clamp(0.0, 1.0);

    final src = Rect.fromLTWH(0, 0, sourceSize.width, sourceSize.height);
    final dst = Rect.fromLTWH(offset.dx, offset.dy, size.width, size.height);
    final imagePaint = Paint()
      ..color = Colors.white.withValues(alpha: fade)
      ..filterQuality = FilterQuality.medium;

    for (final side in const [-1, 1]) {
      final move = g.across * (gap * side) + g.along * (slide * -side);
      canvas.save();
      canvas.translate(move.dx, move.dy);
      canvas.clipPath(g.half(side));
      canvas.drawImageRect(image, src, dst, imagePaint);
      canvas.restore();

      // Glowing edge along each fresh cut.
      if (v > _impact) {
        final glow = (1 - (v - _impact) / 0.5).clamp(0.0, 1.0) * fade;
        if (glow > 0) {
          final edgeA = g.center - g.along * g.length + move;
          final edgeB = g.center + g.along * g.length + move;
          canvas.drawLine(
            edgeA,
            edgeB,
            Paint()
              ..color = AppColors.gold.withValues(alpha: 0.35 * glow)
              ..strokeWidth = 8,
          );
          canvas.drawLine(
            edgeA,
            edgeB,
            Paint()
              ..color = AppColors.gold.withValues(alpha: 0.6 * glow)
              ..strokeWidth = 4,
          );
          canvas.drawLine(
            edgeA,
            edgeB,
            Paint()
              ..color = Colors.white.withValues(alpha: 0.9 * glow)
              ..strokeWidth = 1.5,
          );
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant _CutSnapshotPainter oldPainter) =>
      oldPainter._progress != _progress;
}

/// The sword swing: wind-up, wide slashing arc with a swoosh trail, impact
/// flash and cut line, follow-through, then the sword is pulled away.
class _SwordSwingPainter extends CustomPainter {
  _SwordSwingPainter(this.v);

  final double v;

  @override
  void paint(Canvas canvas, Size size) {
    if (v <= 0 || v >= 1) return;
    final g = _CutGeometry(size, Offset.zero);
    final corner = Offset(size.width, 0);
    final reach = (corner - g.pivot).distance * 1.02; // pivot -> blade tip

    // Impact flash
    if (v > _impact && v < _impact + 0.14) {
      final flash = 1 - (v - _impact) / 0.14;
      canvas.drawRect(
        Offset.zero & size,
        Paint()..color = Colors.white.withValues(alpha: 0.28 * flash),
      );
    }

    // Glowing cut line, left behind once the blade passes
    if (v > _impact) {
      final glow = (1 - (v - _impact) / 0.25).clamp(0.0, 1.0);
      if (glow > 0) {
        final a = g.center - g.along * g.length;
        final b = g.center + g.along * g.length;
        for (final (width, alpha) in const [(22.0, 0.18), (12.0, 0.35), (6.0, 0.6)]) {
          canvas.drawLine(a, b, Paint()
            ..color = AppColors.gold.withValues(alpha: alpha * glow)
            ..strokeWidth = width);
        }
        canvas.drawLine(a, b, Paint()
          ..color = Colors.white.withValues(alpha: glow)
          ..strokeWidth = 3);
      }
    }

    if (v >= _withdrawEnd) return;

    // Pull the sword away (down-left, off screen) after the follow-through.
    var pivot = g.pivot;
    if (v > _followEnd - 0.04) {
      final t = Curves.easeInCubic.transform(
          ((v - (_followEnd - 0.04)) / (_withdrawEnd - _followEnd + 0.04)).clamp(0.0, 1.0));
      pivot += Offset(-size.width * 0.9, size.height * 0.5) * t;
    }

    final angle = g.angle + _swordAngleAt(v);

    // Swoosh trail: a crescent between where the blade was and where it is.
    if (v > _windUpEnd && v < _followEnd) {
      final prev = g.angle + _swordAngleAt(math.max(_windUpEnd, v - 0.07));
      final span = angle - prev;
      if (span > 0.01) {
        final fade = v < _swingEnd
            ? 1.0
            : (1 - (v - _swingEnd) / (_followEnd - _swingEnd)).clamp(0.0, 1.0);
        for (final (part, alpha, color) in [
          (1.0, 0.16, AppColors.gold),
          (0.6, 0.26, AppColors.gold),
          (0.25, 0.5, Colors.white),
        ]) {
          _wedge(canvas, pivot, reach * 0.42, reach, angle - span * part, span * part,
              color.withValues(alpha: alpha * fade));
        }
      }
    }

    // The sword. Drawn with its grip in the knight's hands at the pivot.
    final swordLength = reach / 0.8;
    canvas.save();
    canvas.translate(pivot.dx, pivot.dy);
    canvas.rotate(angle);
    canvas.translate(reach, 0); // tip is `reach` away from the hands
    _drawSword(canvas, swordLength);
    canvas.restore();
  }

  // Filled ring segment around [c] from [start] sweeping [sweep] radians.
  void _wedge(Canvas canvas, Offset c, double r0, double r1, double start,
      double sweep, Color color) {
    final path = Path()
      ..arcTo(Rect.fromCircle(center: c, radius: r1), start, sweep, true)
      ..arcTo(Rect.fromCircle(center: c, radius: r0), start + sweep, -sweep, false)
      ..close();
    canvas.drawPath(path, Paint()..color = color);
  }

  // Draws a longsword pointing right (+x) with its tip at (0, 0).
  void _drawSword(Canvas canvas, double length) {
    final bw = length * 0.035; // blade width
    final guardX = -length * 0.70; // where the blade meets the crossguard
    final gripLength = length * 0.2;
    final outline = Paint()
      ..color = const Color(0xFF4B535C)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeJoin = StrokeJoin.round;

    // Blade
    final blade = Path()
      ..moveTo(guardX, -bw / 2)
      ..lineTo(-bw * 2.4, -bw / 2)
      ..lineTo(0, 0)
      ..lineTo(-bw * 2.4, bw / 2)
      ..lineTo(guardX, bw / 2)
      ..close();
    final bladeRect = Rect.fromLTRB(guardX, -bw / 2, 0, bw / 2);
    canvas.drawPath(
      blade,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFFFFFFF), Color(0xFFD5DBE2), Color(0xFF8E98A3)],
        ).createShader(bladeRect),
    );
    canvas.drawPath(blade, outline);
    // Fuller (groove) and edge shine
    canvas.drawLine(
      Offset(guardX + bw, 0),
      Offset(-bw * 5, 0),
      Paint()
        ..color = const Color(0xFF9EA8B3)
        ..strokeWidth = bw * 0.22
        ..strokeCap = StrokeCap.round,
    );
    canvas.drawLine(
      Offset(guardX + bw * 0.5, -bw * 0.32),
      Offset(-bw * 2.8, -bw * 0.32),
      Paint()
        ..color = Colors.white.withValues(alpha: 0.9)
        ..strokeWidth = 2,
    );

    // Grip (wrapped leather)
    final gripRect =
        Rect.fromLTRB(guardX - gripLength, -bw * 0.45, guardX, bw * 0.45);
    canvas.drawRRect(
      RRect.fromRectAndRadius(gripRect, Radius.circular(bw * 0.3)),
      Paint()..color = const Color(0xFF5A3A1E),
    );
    final wrap = Paint()
      ..color = const Color(0xFF3A2410)
      ..strokeWidth = 2;
    for (var x = gripRect.left + bw * 0.6; x < gripRect.right; x += bw * 0.7) {
      canvas.drawLine(
          Offset(x, gripRect.top), Offset(x - bw * 0.4, gripRect.bottom), wrap);
    }

    // Crossguard (gold)
    final guardRect = Rect.fromCenter(
        center: Offset(guardX, 0), width: bw * 1.1, height: bw * 5.4);
    final gold = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.centerLeft,
        end: Alignment.centerRight,
        colors: [Color(0xFFFFE07A), Color(0xFFFFC904), Color(0xFFB58900)],
      ).createShader(guardRect);
    final guard = RRect.fromRectAndRadius(guardRect, Radius.circular(bw * 0.5));
    final goldOutline = Paint()
      ..color = const Color(0xFF7A5C00)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;
    canvas.drawRRect(guard, gold);
    canvas.drawRRect(guard, goldOutline);

    // Pommel with a red gem
    final pommelCenter = Offset(gripRect.left - bw * 0.7, 0);
    canvas.drawCircle(pommelCenter, bw * 0.95, gold);
    canvas.drawCircle(pommelCenter, bw * 0.95, goldOutline);
    canvas.drawCircle(
        pommelCenter, bw * 0.38, Paint()..color = const Color(0xFFC0262D));
  }

  @override
  bool shouldRepaint(covariant _SwordSwingPainter oldDelegate) =>
      oldDelegate.v != v;
}

// ======================= Castle doors route (logout) =======================

class CastleDoorsRoute<T> extends PageRouteBuilder<T> {
  CastleDoorsRoute({required WidgetBuilder builder, super.settings})
      : super(
          transitionDuration: const Duration(milliseconds: 1000),
          reverseTransitionDuration: const Duration(milliseconds: 600),
          pageBuilder: (context, animation, secondaryAnimation) =>
              builder(context),
          transitionsBuilder: (context, animation, secondaryAnimation, child) =>
              AnimatedBuilder(
            animation: animation,
            child: child,
            builder: (context, child) {
              final v = animation.value;
              return Stack(
                fit: StackFit.expand,
                children: [
                  child!,
                  IgnorePointer(
                    child: CastleDoors(
                      closed: 1 - Curves.easeInOutCubic.transform(v),
                    ),
                  ),
                ],
              );
            },
          ),
        );
}

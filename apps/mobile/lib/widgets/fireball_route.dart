// Log in -> Quest Board transition: a fireball streaks in from the corner,
// explodes in the middle of the screen, and the board appears out of the
// smoke as it clears.

import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Pass this as `arguments` when pushing /home to use the fireball.
const String kFireballTransition = 'fireball';

const _travelEnd = 0.34; // fireball reaches the center and explodes
const _swap = 0.53; // smoke fully covers the screen: show the new page

class FireballRoute<T> extends PageRouteBuilder<T> {
  FireballRoute({required WidgetBuilder builder, super.settings})
      : super(
          transitionDuration: const Duration(milliseconds: 1800),
          reverseTransitionDuration: const Duration(milliseconds: 700),
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
                  // Hidden until the smoke covers everything.
                  Opacity(opacity: v >= _swap ? 1 : 0, child: child),
                  IgnorePointer(
                    child: CustomPaint(painter: _FireballPainter(v)),
                  ),
                ],
              );
            },
          ),
        );
}

class _FireballPainter extends CustomPainter {
  _FireballPainter(this.v);

  final double v;

  static double _rand(int i) {
    final x = math.sin(i * 12.9898) * 43758.5453;
    return x - x.floorToDouble();
  }

  @override
  void paint(Canvas canvas, Size size) {
    if (v <= 0 || v >= 1) return;
    final w = size.width;
    final h = size.height;
    final diag = math.sqrt(w * w + h * h);
    final center = Offset(w / 2, h / 2);
    final r0 = size.shortestSide * 0.06;

    // Fireball path: a curve from the bottom-left corner to the center.
    Offset posAt(double t) {
      final p0 = Offset(-0.15 * w, h * 1.1);
      final c = Offset(w * 0.05, h * 0.3);
      final u = 1 - t;
      return p0 * (u * u) + c * (2 * u * t) + center * (t * t);
    }

    // ---------- flying fireball ----------
    if (v < _travelEnd) {
      final t = Curves.easeInQuad.transform(v / _travelEnd);
      final r = r0 * (1 + t);

      // Flame tail
      for (var k = 14; k >= 1; k--) {
        final tk = t - k * 0.022;
        if (tk < 0) continue;
        final f = k / 15;
        final color = Color.lerp(const Color(0xFFFFA020), const Color(0xFFB81D1D), f)!;
        canvas.drawCircle(
          posAt(tk) + Offset(math.sin(v * 90 + k) * 3, math.cos(v * 70 + k) * 3),
          r * (1 - f * 0.85),
          Paint()..color = color.withValues(alpha: (1 - f) * 0.8),
        );
      }

      // Fireball (layered glow, flickering)
      final p = posAt(t);
      final flicker = 1 + 0.08 * math.sin(v * 140);
      canvas.drawCircle(p, r * 2.0 * flicker,
          Paint()..color = const Color(0xFFFF7A1A).withValues(alpha: 0.22));
      canvas.drawCircle(p, r * 1.4 * flicker,
          Paint()..color = const Color(0xFFFF7A1A).withValues(alpha: 0.75));
      canvas.drawCircle(p, r * flicker, Paint()..color = const Color(0xFFFFC23A));
      canvas.drawCircle(p, r * 0.55, Paint()..color = const Color(0xFFFFF6B0));
      return;
    }

    // ---------- explosion ----------
    final e = ((v - _travelEnd) / (1 - _travelEnd)).clamp(0.0, 1.0);

    // Smoke color wash that fully hides the page swap.
    double tint;
    if (e < 0.05) {
      tint = 0;
    } else if (e < 0.25) {
      tint = (e - 0.05) / 0.2;
    } else if (e < 0.33) {
      tint = 1;
    } else {
      tint = (1 - (e - 0.33) / 0.37).clamp(0.0, 1.0);
    }
    if (tint > 0) {
      canvas.drawRect(Offset.zero & size,
          Paint()..color = const Color(0xFF8C8580).withValues(alpha: tint));
    }

    // Smoke puffs billowing outward
    final grow = Curves.easeOutCubic.transform(e);
    double puffAlpha;
    if (e < 0.2) {
      puffAlpha = e / 0.2;
    } else if (e < 0.4) {
      puffAlpha = 1;
    } else {
      puffAlpha = (1 - (e - 0.4) / 0.6).clamp(0.0, 1.0);
    }
    final fireTint = (1 - e / 0.3).clamp(0.0, 1.0);
    for (var i = 0; i < 20; i++) {
      final a = i / 20 * math.pi * 2 + _rand(i) * 0.4;
      final dir = Offset(math.cos(a), math.sin(a));
      final dist = diag * (0.04 + 0.22 * _rand(i + 50)) * (0.4 + 1.4 * grow);
      final r = diag * (0.14 + 0.16 * _rand(i + 80)) * (0.35 + 0.85 * grow);
      final pos = center + dir * dist;
      var color = Color.lerp(
          const Color(0xFF5E5853), const Color(0xFFB9B2AB), _rand(i + 20))!;
      color = Color.lerp(color, const Color(0xFFFF8A2A), fireTint * 0.6)!;
      canvas.drawCircle(
        pos,
        r,
        Paint()
          ..shader = RadialGradient(
            colors: [
              color.withValues(alpha: puffAlpha),
              color.withValues(alpha: puffAlpha * 0.7),
              color.withValues(alpha: 0),
            ],
            stops: const [0, 0.6, 1],
          ).createShader(Rect.fromCircle(center: pos, radius: r)),
      );
    }

    // Ring of fire blasting outward
    if (e < 0.35) {
      final re = e / 0.35;
      canvas.drawCircle(
        center,
        r0 * 2 + diag * 0.55 * Curves.easeOutCubic.transform(re),
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 40 * (1 - re) + 4
          ..color = const Color(0xFFFF7A1A).withValues(alpha: (1 - re) * 0.9),
      );
    }

    // Sparks
    if (e < 0.4) {
      final se = e / 0.4;
      final spark = Paint()
        ..color = const Color(0xFFFFE07A).withValues(alpha: 1 - se);
      for (var i = 0; i < 16; i++) {
        final a = i / 16 * math.pi * 2 + _rand(i + 200);
        final d = diag * (0.3 + 0.25 * _rand(i + 300)) * Curves.easeOutCubic.transform(se);
        canvas.drawCircle(center + Offset(math.cos(a), math.sin(a)) * d, 4, spark);
      }
    }

    // Flash at the moment of the blast
    if (e < 0.15) {
      canvas.drawRect(Offset.zero & size,
          Paint()..color = Colors.white.withValues(alpha: 0.7 * (1 - e / 0.15)));
    }
  }

  @override
  bool shouldRepaint(covariant _FireballPainter oldDelegate) => oldDelegate.v != v;
}

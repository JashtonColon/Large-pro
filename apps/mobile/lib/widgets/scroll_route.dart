// Sign up -> Verify Email transition: a royal parchment scroll unrolls down
// the screen, a red wax seal is stamped on it ("your code has been sealed
// and sent"), then the scroll rolls back up revealing the Verify page.

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'knight_slash_route.dart';

const _unrollEnd = 0.32; // scroll fully down
const _stampStart = 0.34; // seal hits
const _swap = 0.56; // page underneath changes while the scroll covers it
const _rollUpStart = 0.64; // scroll starts rolling back up

class ScrollRoute<T> extends PageRouteBuilder<T> {
  ScrollRoute({required WidgetBuilder builder, super.settings})
      : super(
          transitionDuration: const Duration(milliseconds: 5000),
          reverseTransitionDuration: const Duration(milliseconds: 800),
          pageBuilder: (context, animation, secondaryAnimation) =>
              builder(context),
          transitionsBuilder: (context, animation, secondaryAnimation, child) =>
              KnightCutOutgoing(
            // Lets this page be cut by the sword when going on to Log In.
            animation: secondaryAnimation,
            child: AnimatedBuilder(
              animation: animation,
              child: child,
              builder: (context, child) {
                final v = animation.value;
                return Stack(
                  fit: StackFit.expand,
                  children: [
                    Opacity(opacity: v >= _swap ? 1 : 0, child: child),
                    IgnorePointer(
                      child: CustomPaint(painter: _ScrollPainter(v)),
                    ),
                  ],
                );
              },
            ),
          ),
        );

  // The page after this one (Log In) can cut this page in half.
  @override
  bool canTransitionTo(TransitionRoute<dynamic> nextRoute) =>
      nextRoute is KnightSlashRoute;
}

class _ScrollPainter extends CustomPainter {
  _ScrollPainter(this.v);

  final double v;

  @override
  void paint(Canvas canvas, Size size) {
    if (v <= 0 || v >= 1) return;
    final w = size.width;
    final h = size.height;
    const rodHeight = 28.0;

    // Where the bottom edge of the parchment is right now.
    double bottom;
    if (v < _unrollEnd) {
      bottom = h * Curves.easeOutCubic.transform(v / _unrollEnd);
    } else if (v < _rollUpStart) {
      bottom = h;
    } else {
      bottom = h *
          (1 - Curves.easeInOutCubic.transform((v - _rollUpStart) / (1 - _rollUpStart)));
    }
    // At the very end the top rod lifts off the screen too.
    final topLift = v > 0.9 ? -(rodHeight * 2) * ((v - 0.9) / 0.1) : 0.0;
    final top = topLift;
    bottom = math.max(bottom, top + rodHeight);

    // Parchment
    final sheet = Rect.fromLTRB(0, top, w, bottom);
    canvas.drawRect(
      sheet,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [Color(0xFFE2C98E), Color(0xFFF8EDCD), Color(0xFFF8EDCD), Color(0xFFE2C98E)],
          stops: [0, 0.12, 0.88, 1],
        ).createShader(Rect.fromLTWH(0, 0, w, h)),
    );
    // Shadow under the bottom rod
    canvas.drawRect(
      Rect.fromLTWH(0, bottom, w, 14),
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0x55000000), Color(0x00000000)],
        ).createShader(Rect.fromLTWH(0, bottom, w, 14)),
    );

    // Message + seal, only inside the parchment
    canvas.save();
    canvas.clipRect(sheet);
    _drawMessage(canvas, size);
    canvas.restore();

    // Wooden rods with gold end caps
    _drawRod(canvas, w, top, rodHeight);
    _drawRod(canvas, w, bottom - rodHeight / 2, rodHeight);
  }

  void _drawRod(Canvas canvas, double w, double y, double rodHeight) {
    final rect = Rect.fromLTWH(0, y - rodHeight / 2, w, rodHeight);
    canvas.drawRRect(
      RRect.fromRectAndRadius(rect, Radius.circular(rodHeight / 2)),
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFA0703F), Color(0xFF6B4423), Color(0xFF4A2E14)],
        ).createShader(rect),
    );
    final cap = Paint()..color = const Color(0xFFFFC904);
    for (final x in [rodHeight * 0.6, w - rodHeight * 0.6]) {
      canvas.drawCircle(Offset(x, y), rodHeight * 0.55, cap);
      canvas.drawCircle(
        Offset(x, y),
        rodHeight * 0.55,
        Paint()
          ..color = const Color(0xFF7A5C00)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2,
      );
    }
  }

  void _drawMessage(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final sealR = math.min(size.shortestSide * 0.16, 70.0);

    // Text fades in as the scroll settles.
    final textAlpha = ((v - 0.2) / 0.12).clamp(0.0, 1.0);
    if (textAlpha > 0) {
      _text(
        canvas,
        'A sealed message\nis on its way!',
        GoogleFonts.cinzelDecorative(
          fontSize: 24,
          fontWeight: FontWeight.w900,
          color: const Color(0xFF3B2412).withValues(alpha: textAlpha),
          height: 1.2,
        ),
        Offset(center.dx, center.dy - sealR - 70),
        size.width - 48,
      );
      _text(
        canvas,
        'Check your UCF email for your\nverification code.',
        GoogleFonts.nunito(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: const Color(0xFF6B4A2A).withValues(alpha: textAlpha),
          height: 1.35,
        ),
        Offset(center.dx, center.dy + sealR + 44),
        size.width - 48,
      );
    }

    // Wax seal: drops from above, hits the paper, squashes a little.
    if (v < _stampStart) return;
    final s = ((v - _stampStart) / 0.12).clamp(0.0, 1.0);
    double scale;
    if (s < 0.6) {
      scale = 2.2 - 1.3 * Curves.easeInCubic.transform(s / 0.6); // falling
    } else {
      final b = (s - 0.6) / 0.4;
      scale = 0.9 + 0.1 * Curves.easeOutBack.transform(b); // squash + settle
    }
    final alpha = (s / 0.25).clamp(0.0, 1.0);
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.scale(scale);
    _drawSeal(canvas, sealR, alpha);
    canvas.restore();

    // Ripple ring when it hits
    if (s > 0.55 && s < 1) {
      final r = (s - 0.55) / 0.45;
      canvas.drawCircle(
        center,
        sealR * (1.05 + 0.6 * r),
        Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 3
          ..color = const Color(0xFFB3122A).withValues(alpha: 0.4 * (1 - r)),
      );
    }
  }

  void _drawSeal(Canvas canvas, double r, double alpha) {
    // Shadow
    canvas.drawCircle(const Offset(3, 5), r * 1.02,
        Paint()..color = Colors.black.withValues(alpha: 0.25 * alpha));
    // Blobby wax edge
    final edge = Path();
    const bumps = 14;
    for (var i = 0; i <= bumps * 4; i++) {
      final a = i / (bumps * 4) * math.pi * 2;
      final rr = r * (1 + 0.06 * math.sin(a * bumps) + 0.03 * math.sin(a * 5 + 1));
      final p = Offset(math.cos(a) * rr, math.sin(a) * rr);
      if (i == 0) {
        edge.moveTo(p.dx, p.dy);
      } else {
        edge.lineTo(p.dx, p.dy);
      }
    }
    edge.close();
    canvas.drawPath(
      edge,
      Paint()
        ..shader = RadialGradient(
          center: const Alignment(-0.3, -0.4),
          colors: [
            const Color(0xFFE0394F).withValues(alpha: alpha),
            const Color(0xFFB3122A).withValues(alpha: alpha),
            const Color(0xFF7E0A1C).withValues(alpha: alpha),
          ],
        ).createShader(Rect.fromCircle(center: Offset.zero, radius: r)),
    );
    // Pressed inner ring
    canvas.drawCircle(
      Offset.zero,
      r * 0.72,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = r * 0.06
        ..color = const Color(0xFF7E0A1C).withValues(alpha: 0.8 * alpha),
    );
    // Embossed "K"
    _text(
      canvas,
      'K',
      GoogleFonts.cinzelDecorative(
        fontSize: r * 0.95,
        fontWeight: FontWeight.w900,
        color: const Color(0xFF7E0A1C).withValues(alpha: 0.9 * alpha),
        height: 1,
      ),
      Offset.zero,
      r * 2,
    );
  }

  // Draws centered text at [center].
  void _text(Canvas canvas, String text, TextStyle style, Offset center,
      double maxWidth) {
    final tp = TextPainter(
      text: TextSpan(text: text, style: style),
      textAlign: TextAlign.center,
      textDirection: TextDirection.ltr,
    )..layout(maxWidth: maxWidth);
    tp.paint(canvas, center - Offset(tp.width / 2, tp.height / 2));
  }

  @override
  bool shouldRepaint(covariant _ScrollPainter oldDelegate) => oldDelegate.v != v;
}

// The fire-breathing dragon that appears when someone types the wrong
// password. Drawn in code with CustomPainter.
//
// Usage: put DragonAttack(animation: controller) on top of the screen and
// call controller.forward(from: 0) to play the attack once.
//   0.00 - 0.18  dragon swoops in from the left
//   0.22 - 0.78  breathes fire across the screen
//   0.80 - 1.00  flies back out

import 'dart:math' as math;

import 'package:flutter/material.dart';

class DragonAttack extends StatelessWidget {
  const DragonAttack({super.key, required this.animation});

  final Animation<double> animation;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: RepaintBoundary(
        child: CustomPaint(painter: _DragonPainter(animation)),
      ),
    );
  }
}

class _DragonPainter extends CustomPainter {
  _DragonPainter(this.animation) : super(repaint: animation);

  final Animation<double> animation;

  static double _rand(int i) {
    final v = math.sin(i * 12.9898) * 43758.5453;
    return v - v.floorToDouble();
  }

  static double _lerp(double a, double b, double t) => a + (b - a) * t;

  @override
  void paint(Canvas canvas, Size size) {
    final v = animation.value;
    if (v <= 0 || v >= 1) return;

    // The dragon is designed in a 200 x 140 box, then scaled to fit.
    final dragonW = math.min(size.width * 0.5, 240.0);
    final s = dragonW / 200;
    final dragonH = 140 * s;
    final restX = -dragonW * 0.1;

    double x;
    if (v < 0.18) {
      x = _lerp(-dragonW - 20, restX, Curves.easeOutBack.transform(v / 0.18));
    } else if (v < 0.8) {
      x = restX + math.sin(v * 40) * 2 * s;
    } else {
      x = _lerp(restX, -dragonW - 40,
          Curves.easeInCubic.transform((v - 0.8) / 0.2));
    }
    final y = size.height * 0.42 - dragonH / 2 + math.sin(v * 30) * 3 * s;

    // How strong the fire is right now (0 = none, 1 = full blast).
    var fire = 0.0;
    if (v >= 0.22 && v < 0.78) {
      if (v < 0.30) {
        fire = (v - 0.22) / 0.08;
      } else if (v > 0.68) {
        fire = (0.78 - v) / 0.10;
      } else {
        fire = 1;
      }
    }

    if (fire > 0) {
      // Warm the whole screen a little while the fire is on.
      canvas.drawRect(
        Offset.zero & size,
        Paint()..color = const Color(0xFFFF7A00).withValues(alpha: 0.10 * fire),
      );
      _drawFire(canvas, size, Offset(x + 196 * s, y + 46 * s), fire, v, s);
    }

    canvas.save();
    canvas.translate(x, y);
    canvas.scale(s);
    _drawDragon(canvas, v, fire > 0);
    canvas.restore();
  }

  void _drawFire(Canvas canvas, Size size, Offset mouth, double fire, double v,
      double s) {
    final reach = (size.width - mouth.dx + 60) * fire;
    final time = v * 14;
    const count = 46;
    for (var i = 0; i < count; i++) {
      final p = (i / count + time) % 1.0;
      final dist = p * reach;
      final spread = (_rand(i) - 0.5) * 2;
      final wobble = math.sin(time * 6 + i) * 8 * s;
      final pos = Offset(
          mouth.dx + dist, mouth.dy + spread * dist * 0.28 + wobble * p);
      final r = (5 + 34 * p) * s * (0.6 + 0.5 * _rand(i + 99));
      final color = p < 0.25
          ? Color.lerp(const Color(0xFFFFF6B0), const Color(0xFFFFC23A), p / 0.25)!
          : Color.lerp(const Color(0xFFFFA020), const Color(0xFFE5321B),
              ((p - 0.25) / 0.75).clamp(0.0, 1.0))!;
      canvas.drawCircle(
        pos,
        r,
        Paint()
          ..color = color.withValues(alpha: (1 - p) * 0.9 * fire)
          ..maskFilter = MaskFilter.blur(BlurStyle.normal, r * 0.45),
      );
    }
    // Bright glow right at the mouth.
    canvas.drawCircle(
      mouth + Offset(8 * s, 0),
      12 * s * fire,
      Paint()
        ..color = const Color(0xFFFFFDE0).withValues(alpha: 0.9)
        ..maskFilter = MaskFilter.blur(BlurStyle.normal, 6 * s),
    );
  }

  // Draws the dragon facing right inside a 200 x 140 box.
  void _drawDragon(Canvas canvas, double v, bool breathing) {
    final body = Paint()..color = const Color(0xFFD62839);
    final dark = Paint()..color = const Color(0xFF8C1C2B);
    final belly = Paint()..color = const Color(0xFFFFB84D);
    final horn = Paint()..color = const Color(0xFFF3E3C3);
    final white = Paint()..color = Colors.white;
    final ink = Paint()..color = const Color(0xFF3A0A12);
    final outline = Paint()
      ..color = const Color(0xFF3A0A12)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeJoin = StrokeJoin.round
      ..strokeCap = StrokeCap.round;

    void fillAndOutline(Path path, Paint fill) {
      canvas.drawPath(path, fill);
      canvas.drawPath(path, outline);
    }

    final flap = math.sin(v * math.pi * 2 * 7);

    // Wing (behind the body), flapping
    final wing = Path()
      ..moveTo(70, 70)
      ..lineTo(38, 8 + flap * 18)
      ..quadraticBezierTo(70, 18 + flap * 10, 108, 22 + flap * 8)
      ..quadraticBezierTo(100, 48, 104, 70)
      ..close();
    fillAndOutline(wing, dark);
    canvas.drawLine(const Offset(72, 68), Offset(56, 22 + flap * 15), outline);
    canvas.drawLine(const Offset(80, 68), Offset(84, 22 + flap * 10), outline);

    // Tail with a spike
    final tail = Path()
      ..moveTo(40, 96)
      ..quadraticBezierTo(5, 112, 2, 72)
      ..quadraticBezierTo(14, 96, 44, 82)
      ..close();
    fillAndOutline(tail, body);
    final spike = Path()
      ..moveTo(0, 76)
      ..lineTo(-12, 58)
      ..lineTo(10, 66)
      ..close();
    fillAndOutline(spike, dark);

    // Legs
    for (final lx in [52.0, 92.0]) {
      final leg = Path()
        ..addRRect(RRect.fromRectAndRadius(
            Rect.fromLTWH(lx, 100, 16, 28), const Radius.circular(7)));
      fillAndOutline(leg, body);
    }

    // Back spikes
    for (var i = 0; i < 4; i++) {
      final sx = 38.0 + i * 18;
      final backSpike = Path()
        ..moveTo(sx, 62)
        ..lineTo(sx + 7, 47)
        ..lineTo(sx + 14, 62)
        ..close();
      fillAndOutline(backSpike, dark);
    }

    // Body and belly
    final bodyPath = Path()
      ..addOval(Rect.fromCenter(center: const Offset(72, 88), width: 104, height: 62));
    fillAndOutline(bodyPath, body);
    canvas.drawOval(
        Rect.fromCenter(center: const Offset(80, 98), width: 64, height: 32), belly);

    // Neck
    final neck = Path()
      ..moveTo(100, 80)
      ..quadraticBezierTo(122, 72, 138, 48)
      ..lineTo(156, 58)
      ..quadraticBezierTo(136, 86, 110, 98)
      ..close();
    fillAndOutline(neck, body);

    // Horns (behind the head)
    final horn1 = Path()
      ..moveTo(134, 30)
      ..lineTo(118, 4)
      ..lineTo(146, 24)
      ..close();
    final horn2 = Path()
      ..moveTo(148, 24)
      ..lineTo(146, 0)
      ..lineTo(162, 24)
      ..close();
    fillAndOutline(horn1, horn);
    fillAndOutline(horn2, horn);

    // Head and snout
    final head = Path()
      ..addOval(Rect.fromCenter(center: const Offset(150, 42), width: 52, height: 40));
    fillAndOutline(head, body);
    final snout = Path()
      ..addRRect(RRect.fromRectAndRadius(
          const Rect.fromLTRB(150, 30, 198, 54), const Radius.circular(11)));
    fillAndOutline(snout, body);

    // Mouth: wide open while breathing fire
    if (breathing) {
      final mouth = Path()
        ..moveTo(166, 46)
        ..lineTo(201, 40)
        ..lineTo(201, 56)
        ..close();
      canvas.drawPath(mouth, ink);
    } else {
      canvas.drawLine(const Offset(166, 46), const Offset(196, 46), outline);
    }
    for (final tx in [172.0, 182.0]) {
      final tooth = Path()
        ..moveTo(tx, 46)
        ..lineTo(tx + 4, 52)
        ..lineTo(tx + 8, 46)
        ..close();
      canvas.drawPath(tooth, white);
    }

    // Nostril, angry eye and brow
    canvas.drawCircle(const Offset(190, 36), 2.5, ink);
    canvas.drawCircle(const Offset(150, 34), 7, white);
    canvas.drawCircle(const Offset(152, 34), 3.6, ink);
    canvas.drawLine(
      const Offset(139, 22),
      const Offset(161, 29),
      Paint()
        ..color = const Color(0xFF3A0A12)
        ..strokeWidth = 4
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant _DragonPainter oldDelegate) =>
      oldDelegate.animation != animation;
}

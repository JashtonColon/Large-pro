// Animated background for the auth screens: sky with drifting clouds,
// grassy hills, a stone castle with a waving flag and a winding path.
// Everything is drawn in code with CustomPainter, so there are no image files.

import 'dart:math' as math;

import 'package:flutter/material.dart';

class CastleScene extends StatefulWidget {
  const CastleScene({super.key});

  @override
  State<CastleScene> createState() => _CastleSceneState();
}

class _CastleSceneState extends State<CastleScene>
    with SingleTickerProviderStateMixin {
  // One slow loop drives the clouds, flag and window glow.
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(seconds: 60),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: CustomPaint(painter: _ScenePainter(_controller)),
    );
  }
}

class _ScenePainter extends CustomPainter {
  _ScenePainter(this.animation) : super(repaint: animation);

  final Animation<double> animation;

  // Clouds: vertical position, start position, size, speed (whole numbers so
  // the loop is seamless).
  static const _clouds = [
    (y: 0.07, x: 0.05, s: 1.0, speed: 1),
    (y: 0.16, x: 0.55, s: 0.7, speed: 2),
    (y: 0.30, x: 0.30, s: 0.55, speed: 1),
    (y: 0.04, x: 0.80, s: 0.6, speed: 2),
  ];

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final t = animation.value;
    final groundY = h * 0.80;

    // Sky
    final sky = Offset.zero & size;
    canvas.drawRect(
      sky,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF4FCFF0), Color(0xFFB5EFFB)],
        ).createShader(sky),
    );

    // Clouds
    final cloudPaint = Paint()..color = Colors.white.withValues(alpha: 0.9);
    for (final c in _clouds) {
      final span = w + 260;
      final x = (c.x * span + t * span * c.speed) % span - 130;
      _cloud(canvas, Offset(x, h * c.y), 38 * c.s, cloudPaint);
    }

    // Hills
    final backHill = Path()
      ..moveTo(0, groundY - 8)
      ..quadraticBezierTo(w * 0.25, groundY - 48, w * 0.5, groundY - 14)
      ..quadraticBezierTo(w * 0.78, groundY + 14, w, groundY - 34)
      ..lineTo(w, h)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(backHill, Paint()..color = const Color(0xFF8BD650));

    final frontHill = Path()
      ..moveTo(0, groundY + 12)
      ..quadraticBezierTo(w * 0.4, groundY - 12, w, groundY + 18)
      ..lineTo(w, h)
      ..lineTo(0, h)
      ..close();
    canvas.drawPath(frontHill, Paint()..color = const Color(0xFFBDF56A));

    // Castle geometry (bottom-right, sitting on the grass)
    final castleW = math.min(w * 0.42, 210.0);
    final castleH = castleW * 0.9;
    final left = w - castleW - w * 0.05;
    final base = groundY + castleW * 0.12;
    final gateCx = left + castleW / 2;

    _drawRoad(canvas, size, Offset(gateCx, base), castleW);
    _drawCastle(canvas, left, base, castleW, castleH, t);
  }

  void _cloud(Canvas canvas, Offset o, double r, Paint p) {
    canvas.drawCircle(o, r, p);
    canvas.drawCircle(o + Offset(r * 0.9, r * 0.15), r * 0.8, p);
    canvas.drawCircle(o + Offset(-r * 0.9, r * 0.2), r * 0.7, p);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTRB(o.dx - r * 1.5, o.dy, o.dx + r * 1.6, o.dy + r * 0.75),
        Radius.circular(r * 0.4),
      ),
      p,
    );
  }

  void _drawRoad(Canvas canvas, Size size, Offset gate, double castleW) {
    final w = size.width;
    final h = size.height;
    final drop = h - gate.dy;
    final road = Path()
      ..moveTo(gate.dx, gate.dy)
      ..cubicTo(
        gate.dx - castleW * 0.1, gate.dy + drop * 0.35,
        gate.dx - castleW * 0.9, gate.dy + drop * 0.2,
        w * 0.45, gate.dy + drop * 0.55,
      )
      ..cubicTo(
        w * 0.3, gate.dy + drop * 0.8,
        w * 0.15, h - 10,
        w * 0.02, h + 12,
      );
    canvas.drawPath(
      road,
      Paint()
        ..color = const Color(0xFFAEB4B7)
        ..style = PaintingStyle.stroke
        ..strokeWidth = castleW * 0.09
        ..strokeCap = StrokeCap.round,
    );
    canvas.drawPath(
      road,
      Paint()
        ..color = const Color(0xFFC9CED0)
        ..style = PaintingStyle.stroke
        ..strokeWidth = castleW * 0.03
        ..strokeCap = StrokeCap.round,
    );
  }

  void _drawCastle(Canvas canvas, double left, double base, double castleW,
      double castleH, double t) {
    final stone = Paint()..color = const Color(0xFFB8C1C4);
    final shade = Paint()..color = const Color(0xFF9DA7AB);
    final towerW = castleW * 0.26;
    final bodyTop = base - castleH * 0.62;
    final towerTop = base - castleH * 0.88;
    final merlonH = castleW * 0.07;
    final bodyLeft = left + towerW * 0.6;
    final bodyRight = left + castleW - towerW * 0.6;

    // Main wall
    canvas.drawRect(Rect.fromLTRB(bodyLeft, bodyTop, bodyRight, base), stone);
    _merlons(canvas, bodyLeft, bodyRight, bodyTop, merlonH, stone);

    // Towers
    final towerXs = [left, left + castleW - towerW];
    for (final tx in towerXs) {
      canvas.drawRect(Rect.fromLTRB(tx, towerTop, tx + towerW, base), stone);
      canvas.drawRect(
          Rect.fromLTRB(tx + towerW * 0.72, towerTop, tx + towerW, base),
          shade);
      final capLeft = tx - towerW * 0.08;
      final capRight = tx + towerW * 1.08;
      canvas.drawRect(
          Rect.fromLTRB(capLeft, towerTop - 2, capRight, towerTop + merlonH * 0.7),
          stone);
      _merlons(canvas, capLeft, capRight, towerTop, merlonH * 1.1, stone);
      _window(canvas, Offset(tx + towerW / 2, towerTop + castleH * 0.24),
          towerW * 0.3, t);
    }

    // Gate with portcullis
    final gateW = castleW * 0.24;
    final gateH = castleH * 0.34;
    final gateCx = left + castleW / 2;
    final gateRect = Rect.fromLTWH(gateCx - gateW / 2, base - gateH, gateW, gateH);
    final gatePath = Path()
      ..moveTo(gateRect.left, base)
      ..lineTo(gateRect.left, gateRect.top + gateW / 2)
      ..arcToPoint(Offset(gateRect.right, gateRect.top + gateW / 2),
          radius: Radius.circular(gateW / 2))
      ..lineTo(gateRect.right, base)
      ..close();
    canvas.drawPath(gatePath, Paint()..color = const Color(0xFF2F3437));
    canvas.save();
    canvas.clipPath(gatePath);
    final bars = Paint()
      ..color = const Color(0xFF111416)
      ..style = PaintingStyle.stroke
      ..strokeWidth = math.max(1.5, castleW * 0.012);
    for (var i = 1; i < 4; i++) {
      final x = gateRect.left + gateW * i / 4;
      canvas.drawLine(Offset(x, gateRect.top), Offset(x, base), bars);
      final y = gateRect.top + gateH * i / 4;
      canvas.drawLine(Offset(gateRect.left, y), Offset(gateRect.right, y), bars);
    }
    canvas.restore();
    canvas.drawPath(
      gatePath,
      Paint()
        ..color = const Color(0xFF111416)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2,
    );

    // Flag on the right tower
    final poleX = left + castleW - towerW / 2;
    final poleBottom = towerTop - merlonH * 1.1;
    final poleTop = poleBottom - castleH * 0.36;
    canvas.drawLine(
      Offset(poleX, poleBottom),
      Offset(poleX, poleTop),
      Paint()
        ..color = const Color(0xFF1F2224)
        ..strokeWidth = 2.5
        ..strokeCap = StrokeCap.round,
    );
    _flag(canvas, Offset(poleX, poleTop), castleW * 0.22, castleW * 0.12, t);
  }

  void _merlons(Canvas canvas, double x0, double x1, double topY, double mh,
      Paint paint) {
    const count = 5;
    final mw = (x1 - x0) / (count * 2 - 1);
    for (var i = 0; i < count; i++) {
      final x = x0 + i * 2 * mw;
      canvas.drawRect(Rect.fromLTWH(x, topY - mh, mw, mh + 1), paint);
    }
  }

  void _window(Canvas canvas, Offset center, double width, double t) {
    final glow = 0.85 + 0.15 * math.sin(t * 2 * math.pi * 30);
    final rect = Rect.fromCenter(center: center, width: width, height: width * 1.5);
    canvas.drawRRect(
      RRect.fromRectAndCorners(rect,
          topLeft: Radius.circular(width / 2),
          topRight: Radius.circular(width / 2)),
      Paint()..color = const Color(0xFFFFD866).withValues(alpha: glow),
    );
  }

  void _flag(Canvas canvas, Offset top, double fw, double fh, double t) {
    final phase = t * 2 * math.pi * 40;
    const steps = 12;
    final flag = Path()..moveTo(top.dx, top.dy);
    for (var i = 0; i <= steps; i++) {
      final f = i / steps;
      flag.lineTo(top.dx + fw * f, top.dy + math.sin(phase + i * 0.6) * fh * 0.18 * f);
    }
    for (var i = steps; i >= 0; i--) {
      final f = i / steps;
      flag.lineTo(
          top.dx + fw * f, top.dy + fh + math.sin(phase + i * 0.6) * fh * 0.18 * f);
    }
    flag.close();
    canvas.drawPath(flag, Paint()..color = const Color(0xFFFFC904));
    canvas.drawPath(
      flag,
      Paint()
        ..color = const Color(0xFF1F2224)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5
        ..strokeJoin = StrokeJoin.round,
    );
  }

  @override
  bool shouldRepaint(covariant _ScenePainter oldDelegate) =>
      oldDelegate.animation != animation;
}

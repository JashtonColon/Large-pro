// Two big wooden castle doors that swing shut over the screen (logout).
// [closed]: 0 = wide open (invisible), 1 = shut.

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'auth_widgets.dart';

class CastleDoors extends StatelessWidget {
  const CastleDoors({
    super.key,
    required this.closed,
    this.message,
    this.messageOpacity = 0,
  });

  final double closed;
  final String? message;
  final double messageOpacity;

  @override
  Widget build(BuildContext context) {
    if (closed <= 0) return const SizedBox.shrink();
    // Fully open = swung 85 degrees toward the viewer.
    final angle = (1 - closed) * math.pi / 2 * 0.95;
    // Doors get darker as they swing away from facing us.
    final shade = (1 - closed).clamp(0.0, 1.0) * 0.5;

    Widget door({required bool left}) {
      return Transform(
        alignment: left ? Alignment.centerLeft : Alignment.centerRight,
        transform: Matrix4.identity()
          ..setEntry(3, 2, 0.0012)
          ..rotateY(left ? angle : -angle),
        child: Stack(
          fit: StackFit.expand,
          children: [
            CustomPaint(painter: _DoorPainter(left: left)),
            ColoredBox(color: Colors.black.withValues(alpha: shade)),
          ],
        ),
      );
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        ColoredBox(color: Colors.black.withValues(alpha: 0.35 * closed)),
        Row(
          children: [
            Expanded(child: door(left: true)),
            Expanded(child: door(left: false)),
          ],
        ),
        if (message != null)
          Center(
            child: AnimatedOpacity(
              opacity: messageOpacity,
              duration: const Duration(milliseconds: 250),
              child: _Plaque(text: message!),
            ),
          ),
      ],
    );
  }
}

class _Plaque extends StatelessWidget {
  const _Plaque({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 32),
      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF2B1B0E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.gold, width: 3),
        boxShadow: const [
          BoxShadow(color: Color(0x99000000), blurRadius: 18, offset: Offset(0, 6)),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.shield, color: AppColors.gold, size: 34),
          const SizedBox(height: 8),
          Text(
            text,
            textAlign: TextAlign.center,
            style: GoogleFonts.cinzelDecorative(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: const Color(0xFFFFE9B0),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'The castle gates are closed.',
            style: GoogleFonts.nunito(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.white70,
            ),
          ),
        ],
      ),
    );
  }
}

class _DoorPainter extends CustomPainter {
  _DoorPainter({required this.left});

  final bool left;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final rect = Offset.zero & size;

    // Wood
    canvas.drawRect(
      rect,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF8B5A2B), Color(0xFF5E3A1A)],
        ).createShader(rect),
    );

    // Planks
    const planks = 4;
    final seam = Paint()
      ..color = const Color(0x55000000)
      ..strokeWidth = 3;
    final grain = Paint()
      ..color = const Color(0x18000000)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;
    for (var i = 1; i < planks; i++) {
      final x = w * i / planks;
      canvas.drawLine(Offset(x, 0), Offset(x, h), seam);
    }
    for (var i = 0; i < planks * 3; i++) {
      final x = w * (i + 0.5) / (planks * 3);
      final path = Path()..moveTo(x, 0);
      for (var y = 0.0; y <= h; y += 30) {
        path.lineTo(x + math.sin(y / 53 + i) * 2.5, y);
      }
      canvas.drawPath(path, grain);
    }

    // Iron bands with rivets
    final iron = Paint()..color = const Color(0xFF2E3236);
    final ironShine = Paint()..color = const Color(0xFF51575D);
    final rivet = Paint()..color = const Color(0xFF8D949A);
    for (final f in const [0.16, 0.5, 0.84]) {
      final y = h * f;
      canvas.drawRect(Rect.fromLTWH(0, y - 11, w, 22), iron);
      canvas.drawRect(Rect.fromLTWH(0, y - 11, w, 4), ironShine);
      for (var x = 18.0; x < w; x += 46) {
        canvas.drawCircle(Offset(x, y), 3.4, rivet);
      }
    }

    // Center seam where the two doors meet
    final edgeX = left ? w : 0.0;
    canvas.drawLine(
      Offset(edgeX, 0),
      Offset(edgeX, h),
      Paint()
        ..color = const Color(0xFF1E1208)
        ..strokeWidth = 4,
    );

    // Ring handle near the middle
    final handleX = left ? w - 38 : 38.0;
    final handleY = h * 0.6;
    canvas.drawCircle(Offset(handleX, handleY - 16), 7, iron);
    canvas.drawCircle(
      Offset(handleX, handleY),
      16,
      Paint()
        ..color = const Color(0xFF2E3236)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 5,
    );
  }

  @override
  bool shouldRepaint(covariant _DoorPainter oldDelegate) =>
      oldDelegate.left != left;
}

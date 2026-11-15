// The castle gate (portcullis) that slams down when someone tries to log in
// with a non-UCF email (like @gmail.com). A "HALT" sign swings under it,
// then the gate rises again.
//
// Usage: put GateBlock(animation: controller) on top of the screen and call
// controller.forward(from: 0).

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class GateBlock extends StatelessWidget {
  const GateBlock({super.key, required this.animation});

  final Animation<double> animation;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: AnimatedBuilder(
        animation: animation,
        builder: (context, _) {
          final v = animation.value;
          if (v <= 0 || v >= 1) return const SizedBox.shrink();

          // 0 = gate hidden above the screen, 1 = fully down.
          double drop;
          if (v < 0.2) {
            drop = Curves.bounceOut.transform(v / 0.2);
          } else if (v < 0.82) {
            drop = 1;
          } else {
            drop = 1 - Curves.easeInCubic.transform((v - 0.82) / 0.18);
          }
          final swing = math.sin(v * 38) * 0.06 * (1 - v);

          return LayoutBuilder(
            builder: (context, constraints) {
              final gateH = constraints.maxHeight * 0.72;
              final top = -gateH + drop * gateH;
              return Stack(
                children: [
                  Positioned.fill(
                    child: ColoredBox(
                      color: Colors.black.withValues(alpha: 0.28 * drop),
                    ),
                  ),
                  Positioned(
                    left: 0,
                    right: 0,
                    top: top,
                    height: gateH,
                    child: CustomPaint(painter: _PortcullisPainter()),
                  ),
                  Positioned(
                    left: 24,
                    right: 24,
                    top: top + gateH - 24,
                    child: Center(
                      child: Transform.rotate(
                        angle: swing,
                        alignment: Alignment.topCenter,
                        child: const _HaltSign(),
                      ),
                    ),
                  ),
                ],
              );
            },
          );
        },
      ),
    );
  }
}

class _HaltSign extends StatelessWidget {
  const _HaltSign();

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 360),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF9C6B3C), Color(0xFF7A4E27)],
        ),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF4A2E14), width: 3),
        boxShadow: const [
          BoxShadow(color: Color(0x66000000), blurRadius: 14, offset: Offset(0, 6)),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              'HALT, TRAVELER!',
              style: GoogleFonts.cinzelDecorative(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: const Color(0xFFFFE9B0),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Only @ucf.edu Knights may enter the castle.',
            textAlign: TextAlign.center,
            style: GoogleFonts.nunito(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

class _PortcullisPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final bar = Paint()..color = const Color(0xFF3B3F44);
    final shine = Paint()..color = const Color(0xFF5A6066);
    final rivet = Paint()..color = const Color(0xFF22262A);
    final cols = (w / 46).round().clamp(5, 12);
    final rows = (h / 60).round().clamp(4, 14);
    const bw = 12.0;
    const spike = 18.0;

    // Horizontal bars
    for (var r = 0; r < rows; r++) {
      final y = (r + 0.5) * (h - spike) / rows;
      canvas.drawRect(Rect.fromLTWH(0, y - bw / 2, w, bw), bar);
      canvas.drawRect(Rect.fromLTWH(0, y - bw / 2, w, 3), shine);
    }
    // Vertical bars with spikes on the bottom
    for (var c = 0; c < cols; c++) {
      final x = (c + 0.5) * w / cols;
      canvas.drawRect(Rect.fromLTWH(x - bw / 2, 0, bw, h - spike), bar);
      canvas.drawRect(Rect.fromLTWH(x - bw / 2, 0, 3, h - spike), shine);
      final tip = Path()
        ..moveTo(x - bw / 2, h - spike)
        ..lineTo(x + bw / 2, h - spike)
        ..lineTo(x, h)
        ..close();
      canvas.drawPath(tip, bar);
    }
    // Rivets where bars cross
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        canvas.drawCircle(
          Offset((c + 0.5) * w / cols, (r + 0.5) * (h - spike) / rows),
          3.2,
          rivet,
        );
      }
    }
  }

  @override
  bool shouldRepaint(covariant _PortcullisPainter oldDelegate) => false;
}

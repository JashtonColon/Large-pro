// Welcome page: the first thing people see. Explains what Knight Study Buddy
// is and how it works, with buttons to create an account or log in.

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../widgets/auth_widgets.dart';
import '../widgets/castle_scene.dart';
import '../widgets/fade_route.dart';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _intro = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1300),
  )..forward();

  @override
  void dispose() {
    _intro.dispose();
    super.dispose();
  }

  // Sections fade and slide up one after another.
  Widget _reveal(int index, Widget child) {
    final start = math.min(index * 0.12, 0.6);
    final animation = CurvedAnimation(
      parent: _intro,
      curve: Interval(start, math.min(start + 0.4, 1.0), curve: Curves.easeOutCubic),
    );
    return FadeTransition(
      opacity: animation,
      child: SlideTransition(
        position: Tween(begin: const Offset(0, 0.08), end: Offset.zero)
            .animate(animation),
        child: child,
      ),
    );
  }

  void _open(String route) {
    Navigator.pushNamed(context, route, arguments: kFadeTransition);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          const Positioned.fill(child: CastleScene()),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 480),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _reveal(0, const TitleBanner()),
                      const SizedBox(height: 18),
                      _reveal(
                        1,
                        _HeroPanel(
                          onSignUp: () => _open('/register'),
                          onLogIn: () => _open('/login'),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _reveal(2, const _HowItWorks()),
                      const SizedBox(height: 16),
                      _reveal(3, const _Features()),
                      const SizedBox(height: 20),
                      _reveal(
                        4,
                        Text(
                          'Built by Knights, for Knights  ·  COP 4331',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.cinzel(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF0F3D4C),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroPanel extends StatelessWidget {
  const _HeroPanel({required this.onSignUp, required this.onLogIn});

  final VoidCallback onSignUp;
  final VoidCallback onLogIn;

  @override
  Widget build(BuildContext context) {
    return ParchmentPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Never study alone again.',
            textAlign: TextAlign.center,
            style: GoogleFonts.cinzel(
              fontSize: 25,
              fontWeight: FontWeight.w900,
              color: AppColors.heading,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Knight Study Buddy connects UCF students taking the same courses. '
            'Post what you\'re working on, find classmates whose schedules '
            'match yours, and form a study group in minutes.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 15.5, height: 1.45, color: AppColors.body),
          ),
          const SizedBox(height: 20),
          PrimaryButton(label: 'Create Account', onPressed: onSignUp),
          const SizedBox(height: 12),
          SecondaryButton(label: 'Log In', onPressed: onLogIn),
          const SizedBox(height: 12),
          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.verified_user_outlined, size: 16, color: AppColors.subtitle),
              SizedBox(width: 6),
              Text(
                'Free for UCF students  ·  @ucf.edu email required',
                style: TextStyle(fontSize: 12.5, color: AppColors.subtitle),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(Icons.shield, size: 20, color: AppColors.wood),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.cinzel(
              fontSize: 19,
              fontWeight: FontWeight.w900,
              color: AppColors.heading,
            ),
          ),
        ),
      ],
    );
  }
}

class _HowItWorks extends StatelessWidget {
  const _HowItWorks();

  static const _steps = [
    (
      'Create your account',
      'Sign up with your @ucf.edu email and confirm it with a verification code.'
    ),
    (
      'Find or post a quest',
      'Browse the Quest Board by course, or post what you need help with, '
          'when, and where.'
    ),
    (
      'Team up',
      'Send a request to join. Contact info is shared only after both of '
          'you agree.'
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return ParchmentPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _SectionTitle('How it works'),
          const SizedBox(height: 14),
          for (var i = 0; i < _steps.length; i++)
            Padding(
              padding: EdgeInsets.only(bottom: i == _steps.length - 1 ? 0 : 14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _NumberSeal(number: i + 1),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _steps[i].$1,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            color: AppColors.heading,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _steps[i].$2,
                          style: const TextStyle(
                              fontSize: 14, height: 1.4, color: AppColors.body),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// Red wax seal with a step number.
class _NumberSeal extends StatelessWidget {
  const _NumberSeal({required this.number});

  final int number;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 36,
      height: 36,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          center: Alignment(-0.3, -0.4),
          colors: [Color(0xFFE0394F), Color(0xFFB3122A), Color(0xFF7E0A1C)],
        ),
        boxShadow: [
          BoxShadow(color: Color(0x55000000), blurRadius: 4, offset: Offset(1, 2)),
        ],
      ),
      child: Text(
        '$number',
        style: GoogleFonts.cinzelDecorative(
          fontSize: 17,
          fontWeight: FontWeight.w900,
          color: const Color(0xFFFFE9B0),
        ),
      ),
    );
  }
}

class _Features extends StatelessWidget {
  const _Features();

  static const _items = [
    (Icons.menu_book_rounded, 'Course matching', 'See who is studying the same classes.'),
    (Icons.calendar_month_rounded, 'Schedule fit', 'Pick times and places that work for everyone.'),
    (Icons.lock_person_rounded, 'Privacy first', 'Your email stays hidden until you both agree.'),
    (Icons.school_rounded, 'UCF only', 'Every member is verified with a UCF email.'),
  ];

  @override
  Widget build(BuildContext context) {
    Widget tile((IconData, String, String) item) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.fieldFill,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.fieldBorder, width: 1.5),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(item.$1, color: AppColors.wood, size: 26),
            const SizedBox(height: 8),
            Text(
              item.$2,
              style: GoogleFonts.cinzel(
                fontSize: 14.5,
                fontWeight: FontWeight.w800,
                color: AppColors.heading,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              item.$3,
              style: const TextStyle(fontSize: 13, height: 1.35, color: AppColors.body),
            ),
          ],
        ),
      );
    }

    return ParchmentPanel(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _SectionTitle('Why Knight Study Buddy'),
          const SizedBox(height: 14),
          for (var row = 0; row < 2; row++)
            Padding(
              padding: EdgeInsets.only(bottom: row == 0 ? 12 : 0),
              child: IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(child: tile(_items[row * 2])),
                    const SizedBox(width: 12),
                    Expanded(child: tile(_items[row * 2 + 1])),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

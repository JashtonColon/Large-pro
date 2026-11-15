import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'screens/auth_screen.dart';
import 'screens/forgot_password_screen.dart';
import 'screens/home_screen.dart';
import 'screens/landing_screen.dart';
import 'screens/verify_email_screen.dart';
import 'widgets/auth_widgets.dart';
import 'widgets/fade_route.dart';
import 'widgets/fireball_route.dart';
import 'widgets/knight_slash_route.dart';
import 'widgets/scroll_route.dart';

void main() {
  runApp(const StudyBuddyApp());
}

class StudyBuddyApp extends StatelessWidget {
  const StudyBuddyApp({super.key});

  // Every page in the app. The transition for each page change is picked in
  // onGenerateRoute below.
  static Map<String, WidgetBuilder> get _pages => {
    '/welcome': (_) => const LandingScreen(),
    '/login': (_) => const AuthScreen(),
    '/register': (_) => const AuthScreen(startOnLogin: false),
    '/verify-email': (_) => const VerifyEmailScreen(),
    '/forgot-password': (_) => const ForgotPasswordScreen(),
    '/home': (_) => const HomeScreen(),
  };

  @override
  Widget build(BuildContext context) {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.gold,
      brightness: Brightness.light,
    ).copyWith(
      primary: AppColors.gold,
      onPrimary: Colors.black,
      surface: Colors.white,
    );

    return MaterialApp(
      title: AppBrand.full,
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: colorScheme,
        scaffoldBackgroundColor: AppColors.background,
        textTheme: GoogleFonts.nunitoTextTheme(),
      ),
      // Opens on the welcome page, which has Create Account / Log In buttons
      // (the assignment requires log in / register to be available at launch).
      initialRoute: '/welcome',
      onGenerateRoute: (settings) {
        final builder = _pages[settings.name];
        if (builder == null) return null;
        if (settings.arguments == kFadeTransition) {
          return FadeRoute<void>(builder: builder, settings: settings);
        }
        if (settings.arguments == kDoorsTransition) {
          return CastleDoorsRoute<void>(builder: builder, settings: settings);
        }
        if (settings.arguments == kFireballTransition) {
          return FireballRoute<void>(builder: builder, settings: settings);
        }
        // Sign up -> Verify Email: the sealed-scroll animation.
        if (settings.name == '/verify-email') {
          return ScrollRoute<void>(builder: builder, settings: settings);
        }
        return KnightSlashRoute<void>(builder: builder, settings: settings);
      },
    );
  }
}

import 'package:flutter/material.dart';

import 'screens/forgot_password_screen.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/verify_email_screen.dart';
import 'widgets/auth_widgets.dart';

void main() {
  runApp(const StudyBuddyApp());
}

class StudyBuddyApp extends StatelessWidget {
  const StudyBuddyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.gold,
      brightness: Brightness.light,
    ).copyWith(
      primary: Colors.black,
      onPrimary: AppColors.gold,
      surface: Colors.white,
    );

    return MaterialApp(
      title: 'UCF Study Buddy',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: colorScheme,
        scaffoldBackgroundColor: AppColors.background,
      ),
      // The assignment requires users to land on log in / register first.
      initialRoute: '/login',
      routes: {
        '/login': (_) => const LoginScreen(),
        '/register': (_) => const RegisterScreen(),
        '/verify-email': (_) => const VerifyEmailScreen(),
        '/forgot-password': (_) => const ForgotPasswordScreen(),
        '/home': (_) => const HomeScreen(),
      },
    );
  }
}

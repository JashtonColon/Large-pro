// Placeholder home screen shown after logging in.
// Later: search for study buddies here (the assignment requires a server-side
// search with partial matching).

import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../widgets/auth_widgets.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  void _logout(BuildContext context) {
    AuthService.logout();
    goToLogin(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: AppColors.gold,
        title: const Text('UCF Study Buddy',
            style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            tooltip: 'Log out',
            icon: const Icon(Icons.logout),
            onPressed: () => _logout(context),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Welcome, ${AuthService.currentUserFirstName ?? 'Knight'}!',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: AppColors.heading,
              ),
            ),
            const SizedBox(height: 4),
            BodyText(
                'You are logged in as ${AuthService.currentUserEmail ?? ''}.'),
            const SizedBox(height: 16),
            TextField(
              decoration: InputDecoration(
                hintText: 'Search by course or name (e.g. COP4331)',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.white,
                border:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
              ),
              // TODO: call the search API as the user types.
            ),
            const Expanded(
              child: Center(child: BodyText('Search results will show here')),
            ),
          ],
        ),
      ),
    );
  }
}

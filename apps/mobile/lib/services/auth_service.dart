// Login, sign-up, email verification and password reset, all against the
// team's Express backend (see api_client.dart for the server address).
//
//   register        -> POST /api/auth/register           (emails a 6-digit code)
//   verify email    -> POST /api/auth/verify-email
//   resend code     -> POST /api/auth/send-verification
//   login           -> POST /api/auth/login              (403 until verified)
//   forgot password -> POST /api/auth/forgot-password    (emails a reset link)

import 'api_client.dart';
import 'board_service.dart';
import 'profile_service.dart';

export 'api_client.dart' show ApiException;

/// Older name kept so the screens' `on AuthException` still works.
typedef AuthException = ApiException;

class AuthService {
  static String? currentUserId;
  static String? currentUserEmail;
  static String? currentUserFirstName;

  static bool get isLoggedIn => Api.token != null;
  static String? get token => Api.token;

  static Future<void> login(String email, String password) async {
    // Server replies: { message, token, user: { id, firstName, lastName, email } }
    final data = await Api.post('/api/auth/login', {
      'email': email,
      'password': password,
    });
    final user = data['user'] as Map<String, dynamic>? ?? {};
    Api.token = data['token'] as String?;
    currentUserId = user['id'] as String?;
    currentUserEmail = user['email'] as String? ?? email;
    currentUserFirstName = user['firstName'] as String?;

    // Load the saved profile so For You and Profile are ready right away.
    try {
      await ProfileService.load();
    } catch (_) {
      // Not fatal: the Profile tab can still be filled in.
    }
  }

  static Future<void> register({
    required String fullName,
    required String email,
    required String password,
  }) async {
    // The screen asks for one "Full Name" box (like the web design), but the
    // backend wants firstName and lastName, so split on the first space.
    final parts = fullName.trim().split(RegExp(r'\s+'));
    final firstName = parts.first;
    final lastName = parts.length > 1 ? parts.sublist(1).join(' ') : '';

    await Api.post('/api/auth/register', {
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'password': password,
    });
  }

  static Future<void> verifyEmail(String email, String code) async {
    await Api.post('/api/auth/verify-email', {'email': email, 'code': code});
  }

  static Future<void> resendVerification(String email) async {
    await Api.post('/api/auth/send-verification', {'email': email});
  }

  static Future<void> sendPasswordReset(String email) async {
    await Api.post('/api/auth/forgot-password', {'email': email});
  }

  static void logout() {
    BoardService.requestedIds.clear();
    Api.token = null;
    currentUserId = null;
    currentUserEmail = null;
    currentUserFirstName = null;
  }
}

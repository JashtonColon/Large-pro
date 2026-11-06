// Talks to the team's Express backend (the `api` branch) for login,
// registration, email verification and password reset.
//
// What's real right now:
//   register         -> POST /api/auth/register         (real)
//   login            -> POST /api/auth/login            (real, returns a JWT)
//   forgot password  -> POST /api/auth/forgot-password  (real route, but the
//                        backend doesn't send the email yet)
//   verify email     -> FAKE: the backend has no verify route yet.
//
// Set useFakeBackend = true to test the screens without running the server.
// Fake-backend test inputs:
//   login password "wrong"         -> "Invalid email or password."
//   register email taken@ucf.edu  -> "Email already registered"
//   verification code 000000      -> "That code is incorrect or expired."

import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

class AuthException implements Exception {
  AuthException(this.message);
  final String message;

  @override
  String toString() => message;
}

class AuthService {
  // Android emulator -> server running on your PC: http://10.0.2.2:5000
  // (10.0.2.2 is how the emulator reaches your computer's localhost.)
  // Final demo -> your team's real domain, e.g. https://yourdomain.com
  static const String baseUrl = 'http://10.0.2.2:5000';
  static const bool useFakeBackend = false;

  static String? _token; // JWT from the server once logged in
  static String? currentUserEmail;
  static String? currentUserFirstName;

  static bool get isLoggedIn => _token != null;
  static String? get token => _token;

  static Future<void> login(String email, String password) async {
    if (useFakeBackend) {
      await _fakeDelay();
      if (password == 'wrong') {
        throw AuthException('Invalid email or password.');
      }
      _token = 'fake-jwt-token';
      currentUserEmail = email;
      currentUserFirstName = 'Knight';
      return;
    }

    // Server replies: { message, token, user: { id, firstName, lastName, email } }
    final data = await _post('/api/auth/login', {
      'email': email,
      'password': password,
    });
    final user = data['user'] as Map<String, dynamic>? ?? {};
    _token = data['token'] as String?;
    currentUserEmail = user['email'] as String? ?? email;
    currentUserFirstName = user['firstName'] as String?;
  }

  static Future<void> register({
    required String fullName,
    required String email,
    required String password,
  }) async {
    if (useFakeBackend) {
      await _fakeDelay();
      if (email.toLowerCase() == 'taken@ucf.edu') {
        throw AuthException('Email already registered');
      }
      return;
    }

    // The screen asks for one "Full Name" box (like the web design), but the
    // backend wants firstName and lastName, so split on the first space.
    final parts = fullName.trim().split(RegExp(r'\s+'));
    final firstName = parts.first;
    final lastName = parts.length > 1 ? parts.sublist(1).join(' ') : '';

    await _post('/api/auth/register', {
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'password': password,
    });
  }

  static Future<void> verifyEmail(String email, String code) async {
    // Always fake for now: the backend has no verify-email route yet.
    // TODO: when it exists, replace with
    //   await _post('/api/auth/verify-email', {'email': email, 'code': code});
    await _fakeDelay();
    if (code == '000000') {
      throw AuthException('That code is incorrect or expired.');
    }
  }

  static Future<void> sendPasswordReset(String email) async {
    if (useFakeBackend) {
      await _fakeDelay();
      return;
    }
    await _post('/api/auth/forgot-password', {'email': email});
  }

  static void logout() {
    _token = null;
    currentUserEmail = null;
    currentUserFirstName = null;
  }

  // Sends a JSON POST request and returns the JSON reply.
  // Turns network problems and server errors into AuthException so the
  // screens can show a readable message.
  static Future<Map<String, dynamic>> _post(
      String path, Map<String, dynamic> body) async {
    final response = await _send(path, body);

    Map<String, dynamic> data = {};
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) data = decoded;
    } catch (_) {
      // Reply wasn't JSON; fall through with empty data.
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      // The backend sends errors as { "message": "..." }.
      throw AuthException(data['message'] as String? ??
          'Something went wrong (error ${response.statusCode}).');
    }
    return data;
  }

  static Future<http.Response> _send(
      String path, Map<String, dynamic> body) async {
    try {
      return await http
          .post(
            Uri.parse('$baseUrl$path'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 10));
    } on TimeoutException {
      throw AuthException(
          'The server took too long to respond. Is it running?');
    } catch (_) {
      throw AuthException(
          "Can't reach the server. Make sure the backend is running.");
    }
  }

  static Future<void> _fakeDelay() =>
      Future.delayed(const Duration(milliseconds: 800));
}

// One place for every call to the team's Express backend.
//
// The server address comes from a build setting so the same code works on the
// emulator and against the deployed site:
//   flutter run                                         -> http://10.0.2.2:5000
//   flutter run --dart-define=API_URL=https://yourdomain.com
// (10.0.2.2 is how the Android emulator reaches your computer's localhost.)
//
// Every request after login carries the JWT as "Authorization: Bearer <token>".

import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

class ApiException implements Exception {
  ApiException(this.message, {this.statusCode});
  final String message;
  final int? statusCode; // HTTP status from the server, if any

  /// True when the server rejected the email/password (HTTP 401).
  bool get isWrongCredentials => statusCode == 401;

  /// True when login was refused because the email isn't verified yet.
  bool get isUnverified => statusCode == 403;

  @override
  String toString() => message;
}

class Api {
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:5000',
  );

  /// JWT from login. Set by AuthService.
  static String? token;

  static Future<Map<String, dynamic>> get(String path,
          [Map<String, String>? query]) =>
      _send('GET', path, query: query);

  static Future<Map<String, dynamic>> post(String path,
          [Map<String, dynamic>? body]) =>
      _send('POST', path, body: body ?? const {});

  static Future<Map<String, dynamic>> patch(
          String path, Map<String, dynamic> body) =>
      _send('PATCH', path, body: body);

  static Future<Map<String, dynamic>> delete(String path) =>
      _send('DELETE', path);

  static Future<Map<String, dynamic>> _send(
    String method,
    String path, {
    Map<String, String>? query,
    Map<String, dynamic>? body,
  }) async {
    var uri = Uri.parse('$baseUrl$path');
    if (query != null && query.isNotEmpty) {
      uri = uri.replace(queryParameters: query);
    }
    final headers = {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };

    http.Response response;
    try {
      final request = http.Request(method, uri)..headers.addAll(headers);
      if (body != null) request.body = jsonEncode(body);
      final streamed =
          await request.send().timeout(const Duration(seconds: 15));
      response = await http.Response.fromStream(streamed);
    } on TimeoutException {
      throw ApiException('The server took too long to respond. Is it running?');
    } catch (_) {
      throw ApiException(
          "Can't reach the server. Make sure the backend is running.");
    }

    Map<String, dynamic> data = {};
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) data = decoded;
    } catch (_) {
      // Reply wasn't JSON; fall through with empty data.
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      // The backend sends errors as { "message": "..." }.
      throw ApiException(
        data['message'] as String? ??
            'Something went wrong (error ${response.statusCode}).',
        statusCode: response.statusCode,
      );
    }
    return data;
  }
}

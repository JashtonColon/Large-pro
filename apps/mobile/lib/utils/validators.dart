// Form validators. Each returns an error message, or null if the value is OK.

class Validators {
  // Accepts name@ucf.edu and subdomains like name@knights.ucf.edu.
  static final RegExp _ucfEmailRegex =
      RegExp(r'^[^@\s]+@([a-z0-9-]+\.)*ucf\.edu$', caseSensitive: false);

  static final RegExp _anyEmailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');

  /// True for a real-looking email that is NOT a UCF one (e.g. @gmail.com).
  static bool isNonUcfEmail(String? value) {
    final v = value?.trim() ?? '';
    return _anyEmailRegex.hasMatch(v) && !_ucfEmailRegex.hasMatch(v);
  }

  static String? ucfEmail(String? value) {
    final v = value?.trim() ?? '';
    if (v.isEmpty) return 'Enter your UCF email';
    if (!_ucfEmailRegex.hasMatch(v)) return 'Use your UCF email (@ucf.edu)';
    return null;
  }

  static String? password(String? value) {
    final v = value ?? '';
    if (v.isEmpty) return 'Create a password';
    if (v.length < 8) return 'Use at least 8 characters';
    if (!RegExp(r'[A-Za-z]').hasMatch(v) || !RegExp(r'\d').hasMatch(v)) {
      return 'Use both letters and numbers';
    }
    return null;
  }

  static String? fullName(String? value) {
    final v = value?.trim() ?? '';
    if (v.isEmpty) return 'Enter your full name';
    if (!v.contains(' ')) return 'Enter your first and last name';
    return null;
  }

  static String? Function(String?) required(String fieldName) {
    return (value) =>
        (value == null || value.trim().isEmpty) ? 'Enter your $fieldName' : null;
  }
}

// Shared look for the login, register, verify-email and forgot-password
// screens. Matches the web design: light gray page, white card with a gold
// top bar, black buttons with gold text, dark-gold links.

import 'package:flutter/material.dart';

class AppColors {
  static const background = Color(0xFFF1F5F9);
  static const gold = Color(0xFFFFC904);
  static const linkGold = Color(0xFF9A7800);
  static const heading = Color(0xFF1F2937);
  static const body = Color(0xFF4B5563);
  static const subtitle = Color(0xFF6B7280);
  static const border = Color(0xFFD1D5DB);
  static const hint = Color(0xFF9CA3AF);
  static const emailHighlight = Color(0xFF4338CA);
}

/// Sends the user back to the login screen, clearing the back stack.
void goToLogin(BuildContext context) {
  Navigator.pushNamedAndRemoveUntil(context, '/login', (route) => false);
}

/// Gray page with the white "UCF Study Buddy" card in the middle.
class AuthCard extends StatelessWidget {
  const AuthCard({
    super.key,
    required this.subtitle,
    required this.heading,
    required this.children,
  });

  final String subtitle;
  final String heading;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460),
              child: Container(
                clipBehavior: Clip.antiAlias,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x1A000000),
                      blurRadius: 24,
                      offset: Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(height: 6, color: AppColors.gold),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(28, 32, 28, 28),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Text(
                            'UCF Study Buddy',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            subtitle,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                                fontSize: 16, color: AppColors.subtitle),
                          ),
                          const SizedBox(height: 32),
                          Text(
                            heading,
                            style: const TextStyle(
                              fontSize: 23,
                              fontWeight: FontWeight.bold,
                              color: AppColors.heading,
                            ),
                          ),
                          const SizedBox(height: 20),
                          ...children,
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Label above a text box, like "UCF Email".
class AuthTextField extends StatelessWidget {
  const AuthTextField({
    super.key,
    required this.label,
    required this.hint,
    required this.controller,
    this.validator,
    this.obscureText = false,
    this.keyboardType,
    this.textInputAction = TextInputAction.next,
    this.textCapitalization = TextCapitalization.none,
    this.onSubmitted,
    this.suffixIcon,
  });

  final String label;
  final String hint;
  final TextEditingController controller;
  final String? Function(String?)? validator;
  final bool obscureText;
  final TextInputType? keyboardType;
  final TextInputAction textInputAction;
  final TextCapitalization textCapitalization;
  final ValueChanged<String>? onSubmitted;
  final Widget? suffixIcon;

  @override
  Widget build(BuildContext context) {
    OutlineInputBorder border(Color color, [double width = 1]) =>
        OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: color, width: width),
        );

    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(fontSize: 14, color: AppColors.heading)),
          const SizedBox(height: 8),
          TextFormField(
            controller: controller,
            validator: validator,
            obscureText: obscureText,
            keyboardType: keyboardType,
            textInputAction: textInputAction,
            textCapitalization: textCapitalization,
            onFieldSubmitted: onSubmitted,
            style: const TextStyle(fontSize: 16, color: Colors.black),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(color: AppColors.hint),
              filled: true,
              fillColor: Colors.white,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
              suffixIcon: suffixIcon,
              enabledBorder: border(AppColors.border),
              focusedBorder: border(AppColors.gold, 2),
              errorBorder: border(Colors.red),
              focusedErrorBorder: border(Colors.red, 2),
            ),
          ),
        ],
      ),
    );
  }
}

/// Eye icon that shows/hides a password.
class PasswordToggle extends StatelessWidget {
  const PasswordToggle({super.key, required this.hidden, required this.onTap});

  final bool hidden;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: Icon(
        hidden ? Icons.visibility_outlined : Icons.visibility_off_outlined,
        color: AppColors.hint,
      ),
      onPressed: onTap,
    );
  }
}

/// Black button with gold text. Shows a spinner while [loading] is true.
class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
  });

  final String label;
  final VoidCallback onPressed;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return FilledButton(
      onPressed: loading ? null : onPressed,
      style: FilledButton.styleFrom(
        backgroundColor: Colors.black,
        foregroundColor: AppColors.gold,
        disabledBackgroundColor: Colors.black,
        disabledForegroundColor: AppColors.gold,
        minimumSize: const Size.fromHeight(50),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
      ),
      child: loading
          ? const SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(
                  strokeWidth: 2.5, color: AppColors.gold),
            )
          : Text(label),
    );
  }
}

/// Dark-gold text link, like "Forgot Password?".
class GoldLink extends StatelessWidget {
  const GoldLink({super.key, required this.text, required this.onTap});

  final String text;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(4),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 2),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: AppColors.linkGold,
          ),
        ),
      ),
    );
  }
}

/// Bottom line of a card, like "Don't have an account? Create Account".
class FooterLink extends StatelessWidget {
  const FooterLink({
    super.key,
    required this.text,
    required this.linkText,
    required this.onTap,
  });

  final String text;
  final String linkText;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 20),
      child: Wrap(
        alignment: WrapAlignment.center,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          Text('$text ',
              style: const TextStyle(fontSize: 15, color: AppColors.body)),
          GoldLink(text: linkText, onTap: onTap),
        ],
      ),
    );
  }
}

/// Red box that shows an error from the server.
class ErrorBanner extends StatelessWidget {
  const ErrorBanner({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        border: Border.all(color: const Color(0xFFFCA5A5)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(message, style: const TextStyle(color: Color(0xFFB91C1C))),
    );
  }
}

/// Gray paragraph text inside a card.
class BodyText extends StatelessWidget {
  const BodyText(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(text,
        style: const TextStyle(
            fontSize: 15, height: 1.4, color: AppColors.body));
  }
}

import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../utils/validators.dart';
import '../widgets/auth_widgets.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _loading = false;
  bool _sent = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await AuthService.sendPasswordReset(_emailController.text.trim());
      if (!mounted) return;
      setState(() => _sent = true);
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_sent) {
      return AuthCard(
        subtitle: 'Find your perfect study partner.',
        heading: 'Check Your Email',
        children: [
          BodyText('If an account exists for '
              '${_emailController.text.trim()}, we sent instructions to '
              'reset your password.'),
          const SizedBox(height: 24),
          PrimaryButton(
              label: 'Back to Log In', onPressed: () => goToLogin(context)),
        ],
      );
    }

    return AuthCard(
      subtitle: 'Find your perfect study partner.',
      heading: 'Forgot Password?',
      children: [
        const BodyText("Enter your UCF email address and we'll send you "
            'instructions to reset your password.'),
        const SizedBox(height: 22),
        Form(
          key: _formKey,
          child: AuthTextField(
            label: 'UCF Email',
            hint: 'yourname@ucf.edu',
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _submit(),
            validator: Validators.ucfEmail,
          ),
        ),
        const SizedBox(height: 4),
        if (_error != null) ErrorBanner(message: _error!),
        PrimaryButton(
            label: 'Send Reset Instructions',
            loading: _loading,
            onPressed: _submit),
        FooterLink(
          text: 'Remember your password?',
          linkText: 'Log In',
          onTap: () => goToLogin(context),
        ),
      ],
    );
  }
}

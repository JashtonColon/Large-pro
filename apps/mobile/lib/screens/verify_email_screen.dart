import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../utils/validators.dart';
import '../widgets/auth_widgets.dart';

/// Shown after sign-up. Open it with:
///   Navigator.pushNamed(context, '/verify-email', arguments: email);
class VerifyEmailScreen extends StatefulWidget {
  const VerifyEmailScreen({super.key});

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  final _formKey = GlobalKey<FormState>();
  final _codeController = TextEditingController();
  bool _loading = false;
  String? _error;

  String get _email =>
      (ModalRoute.of(context)?.settings.arguments as String?) ?? '';

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await AuthService.verifyEmail(_email, _codeController.text.trim());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Email verified! You can log in now.')),
      );
      goToLogin(context);
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthCard(
      subtitle: 'Almost there!',
      heading: 'Verify Your Email',
      children: [
        const BodyText('Verification code sent to:'),
        const SizedBox(height: 2),
        Text(
          _email,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: AppColors.emailHighlight,
          ),
        ),
        const SizedBox(height: 22),
        const BodyText("We've sent a verification code to your email. "
            'Enter the code below to verify your account.'),
        const SizedBox(height: 22),
        Form(
          key: _formKey,
          child: AuthTextField(
            label: 'Verification Code',
            hint: 'Enter your code',
            controller: _codeController,
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _submit(),
            validator: Validators.required('code'),
          ),
        ),
        const SizedBox(height: 4),
        if (_error != null) ErrorBanner(message: _error!),
        PrimaryButton(
            label: 'Verify Email', loading: _loading, onPressed: _submit),
        FooterLink(
          text: 'Already verified?',
          linkText: 'Log In',
          onTap: () => goToLogin(context),
        ),
      ],
    );
  }
}

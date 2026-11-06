import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../utils/validators.dart';
import '../widgets/auth_widgets.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  bool _loading = false;
  bool _hidePassword = true;
  String? _error;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    final email = _emailController.text.trim();
    try {
      await AuthService.register(
        fullName: _nameController.text.trim(),
        email: email,
        password: _passwordController.text,
      );
      if (!mounted) return;
      // Go to the code-entry screen, passing the email along.
      Navigator.pushReplacementNamed(context, '/verify-email',
          arguments: email);
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthCard(
      subtitle: 'Join Study Buddy and find your study partner.',
      heading: 'Create Your Account',
      children: [
        Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AuthTextField(
                label: 'Full Name',
                hint: 'Enter your full name',
                controller: _nameController,
                textCapitalization: TextCapitalization.words,
                validator: Validators.fullName,
              ),
              AuthTextField(
                label: 'UCF Email',
                hint: 'yourname@ucf.edu',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                validator: Validators.ucfEmail,
              ),
              AuthTextField(
                label: 'Password',
                hint: 'Create a password',
                controller: _passwordController,
                obscureText: _hidePassword,
                validator: Validators.password,
                suffixIcon: PasswordToggle(
                  hidden: _hidePassword,
                  onTap: () => setState(() => _hidePassword = !_hidePassword),
                ),
              ),
              AuthTextField(
                label: 'Confirm Password',
                hint: 'Re-enter your password',
                controller: _confirmController,
                obscureText: _hidePassword,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _submit(),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Re-enter your password';
                  }
                  if (value != _passwordController.text) {
                    return 'Passwords do not match';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        if (_error != null) ErrorBanner(message: _error!),
        PrimaryButton(
            label: 'Create Account', loading: _loading, onPressed: _submit),
        FooterLink(
          text: 'Already have an account?',
          linkText: 'Log In',
          onTap: () => goToLogin(context),
        ),
      ],
    );
  }
}

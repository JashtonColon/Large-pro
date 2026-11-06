import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../utils/validators.dart';
import '../widgets/auth_widgets.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  bool _hidePassword = true;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await AuthService.login(
          _emailController.text.trim(), _passwordController.text);
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, '/home');
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthCard(
      subtitle: 'Find your perfect study partner.',
      heading: 'Welcome Knights!',
      children: [
        Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AuthTextField(
                label: 'UCF Email',
                hint: 'yourname@ucf.edu',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                validator: Validators.ucfEmail,
              ),
              AuthTextField(
                label: 'Password',
                hint: 'Enter your password',
                controller: _passwordController,
                obscureText: _hidePassword,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _submit(),
                validator: Validators.required('password'),
                suffixIcon: PasswordToggle(
                  hidden: _hidePassword,
                  onTap: () => setState(() => _hidePassword = !_hidePassword),
                ),
              ),
            ],
          ),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: GoldLink(
            text: 'Forgot Password?',
            onTap: () => Navigator.pushNamed(context, '/forgot-password'),
          ),
        ),
        const SizedBox(height: 20),
        if (_error != null) ErrorBanner(message: _error!),
        PrimaryButton(label: 'Log In', loading: _loading, onPressed: _submit),
        FooterLink(
          text: "Don't have an account?",
          linkText: 'Create Account',
          onTap: () => Navigator.pushNamed(context, '/register'),
        ),
      ],
    );
  }
}

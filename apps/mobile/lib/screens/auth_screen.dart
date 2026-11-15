// Sign Up / Log In screen (one card with tabs, like the drawing).
// A wrong password summons the dragon.

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../services/auth_service.dart';
import '../utils/validators.dart';
import '../widgets/auth_widgets.dart';
import '../widgets/dragon_attack.dart';
import '../widgets/fade_route.dart';
import '../widgets/fireball_route.dart';
import '../widgets/gate_block.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, this.startOnLogin = true});

  final bool startOnLogin;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  late bool _isLogin = widget.startOnLogin;
  bool _loading = false;
  bool _hidePassword = true;
  String? _error;

  late final AnimationController _dragon = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2800),
  );
  late final AnimationController _shake = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 500),
  );
  late final AnimationController _gate = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2600),
  );
  Timer? _shakeTimer;

  @override
  void dispose() {
    _shakeTimer?.cancel();
    _dragon.dispose();
    _shake.dispose();
    _gate.dispose();
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  void _switchTab(bool login) {
    if (login == _isLogin) return;
    setState(() {
      _isLogin = login;
      _error = null;
    });
  }

  void _unleashDragon() {
    HapticFeedback.mediumImpact();
    _dragon.forward(from: 0);
    // Shake the card once the fire hits it.
    _shakeTimer?.cancel();
    _shakeTimer = Timer(const Duration(milliseconds: 700), () {
      if (!mounted) return;
      HapticFeedback.heavyImpact();
      _shake.forward(from: 0);
    });
  }

  // Non-UCF email on the login tab: drop the castle gate.
  void _blockAtGate() {
    HapticFeedback.heavyImpact();
    _gate.forward(from: 0);
    setState(() => _error = 'Only @ucf.edu emails can log in.');
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus(); // hide the keyboard so the animations show
    if (_isLogin && Validators.isNonUcfEmail(_emailController.text)) {
      _blockAtGate();
      return;
    }
    if (!_formKey.currentState!.validate()) {
      _shake.forward(from: 0);
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    final email = _emailController.text.trim();
    try {
      if (_isLogin) {
        await AuthService.login(email, _passwordController.text);
        if (!mounted) return;
        Navigator.pushReplacementNamed(context, '/home',
            arguments: kFireballTransition);
      } else {
        await AuthService.register(
          fullName: _nameController.text.trim(),
          email: email,
          password: _passwordController.text,
        );
        if (!mounted) return;
        Navigator.pushNamed(context, '/verify-email', arguments: email);
      }
    } on AuthException catch (e) {
      if (!mounted) return;
      if (_isLogin && e.isUnverified) {
        // Account exists but the email isn't verified: send a fresh code
        // and go straight to the verify page.
        try {
          await AuthService.resendVerification(email);
        } catch (_) {
          // The page has a resend button if this fails.
        }
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Verify your email first. We sent you a new code.')),
        );
        Navigator.pushNamed(context, '/verify-email', arguments: email);
        return;
      }
      setState(() => _error = e.message);
      if (_isLogin && e.isWrongCredentials) {
        _unleashDragon();
      } else {
        _shake.forward(from: 0);
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthCard(
      shake: _shake,
      overlay: Stack(
        fit: StackFit.expand,
        children: [
          DragonAttack(animation: _dragon),
          GateBlock(animation: _gate),
        ],
      ),
      children: [
        AuthTabs(isLogin: _isLogin, onChanged: _switchTab),
        const SizedBox(height: 20),
        Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _Reveal(
                visible: !_isLogin,
                child: AuthTextField(
                  label: 'Full Name',
                  icon: Icons.person_outline,
                  hint: 'Enter your full name',
                  controller: _nameController,
                  textCapitalization: TextCapitalization.words,
                  validator: Validators.fullName,
                ),
              ),
              AuthTextField(
                label: 'UCF Email',
                  icon: Icons.mail_outline,
                hint: 'yourname@ucf.edu',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                validator: Validators.ucfEmail,
              ),
              AuthTextField(
                label: 'Password',
                  icon: Icons.lock_outline,
                hint: _isLogin ? 'Enter your password' : 'Create a password',
                controller: _passwordController,
                obscureText: _hidePassword,
                textInputAction:
                    _isLogin ? TextInputAction.done : TextInputAction.next,
                onSubmitted: _isLogin ? (_) => _submit() : null,
                validator: _isLogin
                    ? Validators.required('password')
                    : Validators.password,
                suffixIcon: PasswordToggle(
                  hidden: _hidePassword,
                  onTap: () => setState(() => _hidePassword = !_hidePassword),
                ),
              ),
              _Reveal(
                visible: !_isLogin,
                child: AuthTextField(
                  label: 'Confirm Password',
                  icon: Icons.lock_reset,
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
              ),
            ],
          ),
        ),
        _Reveal(
          visible: _isLogin,
          child: Align(
            alignment: Alignment.centerRight,
            child: GoldLink(
              text: 'Forgot Password?',
              onTap: () => Navigator.pushNamed(context, '/forgot-password'),
            ),
          ),
        ),
        const SizedBox(height: 10),
        if (_error != null) ErrorBanner(key: ValueKey(_error), message: _error!),
        PrimaryButton(
          label: _isLogin ? 'Log In' : 'Create Account',
          loading: _loading,
          onPressed: _submit,
        ),
        const SizedBox(height: 6),
        Center(
          child: GoldLink(
            text: '\u2190 Back to welcome',
            onTap: () => Navigator.pushNamedAndRemoveUntil(
              context,
              '/welcome',
              (route) => false,
              arguments: kFadeTransition,
            ),
          ),
        ),
      ],
    );
  }
}

/// Smoothly grows/fades a widget in and out (used when switching tabs).
class _Reveal extends StatelessWidget {
  const _Reveal({required this.visible, required this.child});

  final bool visible;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return AnimatedSize(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOutCubic,
      alignment: Alignment.topCenter,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 250),
        child: visible
            ? KeyedSubtree(key: const ValueKey(true), child: child)
            : const SizedBox(key: ValueKey(false), width: double.infinity),
      ),
    );
  }
}

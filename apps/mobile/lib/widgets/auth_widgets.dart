// Shared look for the auth screens: castle background, small
// "KNIGHT Study Buddy" sign in the corner, and a parchment card framed in wood with parchment fields,
// wooden plaque tabs and a gold shield button.

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'castle_scene.dart';

/// App name shown in the banner. Change it here to rename it everywhere.
class AppBrand {
  static const top = 'KNIGHT';
  static const bottom = 'Study Buddy';
  static const full = 'Knight Study Buddy';
}

class AppColors {
  static const background = Color(0xFFEAF9FD);
  static const card = Color(0xFFFBF0D0);
  static const banner = Color(0xFFDADADA);
  static const gold = Color(0xFFFFC904);
  static const goldBorder = Color(0xFFFFE14D);
  static const linkGold = Color(0xFF8B5A2B);
  static const ink = Color(0xFF1F1F1F);
  static const heading = Color(0xFF3B2412);
  static const body = Color(0xFF5C4630);
  static const subtitle = Color(0xFF7A5C3A);
  static const hint = Color(0xFFA08A6A);
  static const error = Color(0xFFB3122A);
  static const emailHighlight = Color(0xFF8C1C2B);
  // Medieval parchment & wood
  static const parchment = Color(0xFFFBF0D0);
  static const parchmentDark = Color(0xFFEFD9A4);
  static const fieldFill = Color(0xFFFFF8E6);
  static const fieldBorder = Color(0xFFB08850);
  static const wood = Color(0xFF8B5A2B);
  static const woodDark = Color(0xFF4A2E14);
}

/// Sends the user back to the login screen. Keeps the welcome page
/// underneath (if it's there) so Back still works.
void goToLogin(BuildContext context) {
  Navigator.pushNamedAndRemoveUntil(
      context, '/login', ModalRoute.withName('/welcome'));
}

/// Parchment panel framed in dark wood (used on the welcome page).
class ParchmentPanel extends StatelessWidget {
  const ParchmentPanel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.fromLTRB(20, 20, 20, 18),
  });

  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.parchment, AppColors.parchmentDark],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.woodDark, width: 4),
        boxShadow: const [
          BoxShadow(color: Color(0x44000000), blurRadius: 20, offset: Offset(0, 8)),
        ],
      ),
      child: Container(
        margin: const EdgeInsets.all(5),
        padding: padding,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
              color: AppColors.gold.withValues(alpha: 0.8), width: 1.5),
        ),
        child: child,
      ),
    );
  }
}

/// Section heading inside a parchment panel: shield icon + medieval title.
class PanelTitle extends StatelessWidget {
  const PanelTitle(this.text, {super.key, this.icon = Icons.shield});

  final String text;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.wood),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: GoogleFonts.cinzel(
              fontSize: 19,
              fontWeight: FontWeight.w900,
              color: AppColors.heading,
            ),
          ),
        ),
      ],
    );
  }
}

/// Wooden plaque button (the second choice next to the gold PrimaryButton).
class SecondaryButton extends StatelessWidget {
  const SecondaryButton({super.key, required this.label, required this.onPressed});

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: Ink(
        height: 54,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF9C6B3C), AppColors.wood, Color(0xFF6B4423)],
          ),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.woodDark, width: 2.5),
          boxShadow: const [
            BoxShadow(color: Color(0x55000000), blurRadius: 6, offset: Offset(0, 3)),
          ],
        ),
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(12),
          splashColor: const Color(0x22FFFFFF),
          child: Center(
            child: Text(
              label,
              style: GoogleFonts.cinzel(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: const Color(0xFFFFE9B0),
                letterSpacing: 1,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Full auth page: castle scene, banner, and a white card holding [children].
/// The banner and card slide in when the screen opens.
/// [shake] (optional) wiggles the card, e.g. after a failed login.
/// [overlay] (optional) is drawn on top of everything, e.g. the dragon.
class AuthCard extends StatefulWidget {
  const AuthCard({
    super.key,
    this.heading,
    this.subtitle,
    required this.children,
    this.shake,
    this.overlay,
  });

  final String? heading;
  final String? subtitle;
  final List<Widget> children;
  final Animation<double>? shake;
  final Widget? overlay;

  @override
  State<AuthCard> createState() => _AuthCardState();
}

class _AuthCardState extends State<AuthCard>
    with SingleTickerProviderStateMixin {
  late final AnimationController _intro = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  );
  bool _introStarted = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_introStarted) return;
    _introStarted = true;
    // Arriving through a page transition: show the card right away so it
    // doesn't animate twice. First screen of the app: play the slide-in.
    final routeAnimation = ModalRoute.of(context)?.animation;
    if (routeAnimation != null &&
        routeAnimation.status == AnimationStatus.forward) {
      _intro.value = 1;
    } else {
      _intro.forward();
    }
  }

  @override
  void dispose() {
    _intro.dispose();
    super.dispose();
  }

  Animation<double> _interval(double begin, double end) => CurvedAnimation(
        parent: _intro,
        curve: Interval(begin, end, curve: Curves.easeOutCubic),
      );

  @override
  Widget build(BuildContext context) {
    final keyboard = MediaQuery.viewInsetsOf(context).bottom;
    final hasHeader = widget.heading != null || widget.subtitle != null;

    final card = Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.parchment, AppColors.parchmentDark],
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.woodDark, width: 4),
        boxShadow: const [
          BoxShadow(
            color: Color(0x44000000),
            blurRadius: 24,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Container(
      margin: const EdgeInsets.all(5),
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.8), width: 1.5),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (widget.heading != null)
            Text(
              widget.heading!,
              style: GoogleFonts.cinzel(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: AppColors.heading,
              ),
            ),
          if (widget.subtitle != null) ...[
            const SizedBox(height: 4),
            Text(widget.subtitle!,
                style: const TextStyle(fontSize: 15, color: AppColors.subtitle)),
          ],
          if (hasHeader) const SizedBox(height: 18),
          ...widget.children,
        ],
      ),
      ),
    );

    final shake = widget.shake;
    final movingCard = shake == null
        ? card
        : AnimatedBuilder(
            animation: shake,
            child: card,
            builder: (context, child) {
              final v = shake.value;
              final dx = math.sin(v * math.pi * 10) * 14 * (1 - v);
              return Transform.translate(offset: Offset(dx, 0), child: child);
            },
          );

    return Scaffold(
      // The background stays put when the keyboard opens; only the card
      // scrolls up.
      resizeToAvoidBottomInset: false,
      body: Stack(
        children: [
          const Positioned.fill(child: CastleScene()),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: EdgeInsets.fromLTRB(20, 76, 20, 24 + keyboard),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 440),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _FadeSlide(
                        animation: _interval(0.25, 1.0),
                        from: const Offset(0, 0.15),
                        child: movingCard,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          // Small app sign in the top-left corner
          SafeArea(
            child: Align(
              alignment: Alignment.topLeft,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: _FadeSlide(
                  animation: _interval(0.0, 0.6),
                  from: const Offset(0, -0.4),
                  child: const TitleBanner(compact: true),
                ),
              ),
            ),
          ),
          if (widget.overlay != null) Positioned.fill(child: widget.overlay!),
        ],
      ),
    );
  }
}

class _FadeSlide extends StatelessWidget {
  const _FadeSlide({
    required this.animation,
    required this.from,
    required this.child,
  });

  final Animation<double> animation;
  final Offset from;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: animation,
      child: SlideTransition(
        position: Tween(begin: from, end: Offset.zero).animate(animation),
        child: child,
      ),
    );
  }
}

/// Gray sign with a gold frame: "KNIGHT Study Buddy".
class TitleBanner extends StatelessWidget {
  const TitleBanner({super.key, this.compact = false});

  /// Smaller version for the top of the quest board.
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: compact
          ? const EdgeInsets.symmetric(horizontal: 12, vertical: 6)
          : const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      decoration: BoxDecoration(
        color: AppColors.banner,
        border: Border.all(color: AppColors.goldBorder, width: compact ? 4 : 6),
        borderRadius: BorderRadius.circular(6),
        boxShadow: const [
          BoxShadow(
            color: Color(0x33000000),
            blurRadius: 16,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              AppBrand.top,
              style: GoogleFonts.cinzelDecorative(
                fontSize: compact ? 24 : 46,
                fontWeight: FontWeight.w900,
                color: AppColors.ink,
                letterSpacing: compact ? 2 : 4,
                height: 1.0,
              ),
            ),
          ),
          SizedBox(height: compact ? 1 : 4),
          Text(
            AppBrand.bottom,
            style: GoogleFonts.cinzel(
              fontSize: compact ? 12 : 22,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF333333),
              letterSpacing: compact ? 4 : 6,
            ),
          ),
        ],
      ),
    );
  }
}

/// The "Sign Up | Log In" switch at the top of the card.
class AuthTabs extends StatelessWidget {
  const AuthTabs({super.key, required this.isLogin, required this.onChanged});

  final bool isLogin;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(child: _tab('Sign Up', !isLogin, () => onChanged(false))),
        const SizedBox(width: 12),
        Expanded(child: _tab('Log In', isLogin, () => onChanged(true))),
      ],
    );
  }

  Widget _tab(String label, bool selected, VoidCallback onTap) {
    final icon = label == 'Log In' ? Icons.key_rounded : Icons.how_to_reg_rounded;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
        padding: const EdgeInsets.symmetric(vertical: 11),
        transform: Matrix4.translationValues(0, selected ? -2 : 0, 0),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: selected
                ? const [Color(0xFFFFE07A), AppColors.gold, Color(0xFFC99A00)]
                : const [Color(0xFF9C6B3C), AppColors.wood, Color(0xFF6B4423)],
          ),
          border: Border.all(color: AppColors.woodDark, width: 2.5),
          borderRadius: BorderRadius.circular(10),
          boxShadow: [
            BoxShadow(
              color: selected ? const Color(0x66C99A00) : const Color(0x44000000),
              blurRadius: selected ? 12 : 4,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon,
                size: 18,
                color: selected ? AppColors.woodDark : const Color(0xFFFFE9B0)),
            const SizedBox(width: 6),
            AnimatedDefaultTextStyle(
              duration: const Duration(milliseconds: 250),
              style: GoogleFonts.cinzel(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: selected ? AppColors.woodDark : const Color(0xFFFFE9B0),
              ),
              child: Text(label),
            ),
          ],
        ),
      ),
    );
  }
}

/// Parchment text box with a brown ink border, icon and floating label.
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
    this.icon,
  });

  final IconData? icon;
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
    OutlineInputBorder border(Color color, double width) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: color, width: width),
        );

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextFormField(
        controller: controller,
        validator: validator,
        obscureText: obscureText,
        keyboardType: keyboardType,
        textInputAction: textInputAction,
        textCapitalization: textCapitalization,
        onFieldSubmitted: onSubmitted,
        style: const TextStyle(fontSize: 16, color: AppColors.heading),
        cursorColor: AppColors.wood,
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          labelStyle: const TextStyle(color: AppColors.subtitle),
          floatingLabelStyle: GoogleFonts.cinzel(
              color: AppColors.wood, fontWeight: FontWeight.w800),
          hintStyle: const TextStyle(color: AppColors.hint),
          filled: true,
          fillColor: AppColors.fieldFill,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          prefixIcon: icon == null
              ? null
              : Icon(icon, color: AppColors.wood, size: 22),
          suffixIcon: suffixIcon,
          enabledBorder: border(AppColors.fieldBorder, 2),
          focusedBorder: border(const Color(0xFFC99A00), 2.6),
          errorBorder: border(AppColors.error, 2),
          focusedErrorBorder: border(AppColors.error, 2.6),
        ),
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

/// Big gold button. Shrinks slightly when pressed and shows a spinner while
/// [loading] is true.
class PrimaryButton extends StatefulWidget {
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
  State<PrimaryButton> createState() => _PrimaryButtonState();
}

class _PrimaryButtonState extends State<PrimaryButton> {
  bool _pressed = false;

  void _setPressed(bool value) {
    if (_pressed != value) setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    final enabled = !widget.loading;
    return Listener(
      onPointerDown: (_) => _setPressed(true),
      onPointerUp: (_) => _setPressed(false),
      onPointerCancel: (_) => _setPressed(false),
      child: AnimatedScale(
        scale: _pressed ? 0.96 : 1.0,
        duration: const Duration(milliseconds: 120),
        child: Material(
          color: Colors.transparent,
          child: Ink(
            height: 54,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFFFFE07A), AppColors.gold, Color(0xFFC99A00)],
              ),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.woodDark, width: 2.5),
              boxShadow: const [
                BoxShadow(color: Color(0x66000000), blurRadius: 8, offset: Offset(0, 4)),
              ],
            ),
            child: InkWell(
              onTap: enabled ? widget.onPressed : null,
              borderRadius: BorderRadius.circular(12),
              splashColor: const Color(0x33FFFFFF),
              child: Center(
                child: widget.loading
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                            strokeWidth: 2.5, color: AppColors.woodDark),
                      )
                    : Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.shield, size: 18, color: AppColors.woodDark),
                          const SizedBox(width: 8),
                          Flexible(
                            child: Text(
                              widget.label,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.cinzel(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFF2B1B0E),
                                letterSpacing: 1,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Icon(Icons.shield, size: 18, color: AppColors.woodDark),
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

/// Bottom line of a card, like "Already verified? Log In".
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
      padding: const EdgeInsets.only(top: 16),
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

/// Red box that shows an error. Fades in when it appears.
class ErrorBanner extends StatelessWidget {
  const ErrorBanner({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 300),
      builder: (context, v, child) => Opacity(
        opacity: v,
        child: Transform.translate(offset: Offset(0, (1 - v) * -8), child: child),
      ),
      child: Container(
        padding: const EdgeInsets.all(12),
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFF8DCCB),
          border: Border.all(color: AppColors.error, width: 1.5),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            const Icon(Icons.local_fire_department, color: AppColors.error),
            const SizedBox(width: 8),
            Expanded(
              child: Text(message,
                  style: const TextStyle(
                      color: Color(0xFF8C1C2B), fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
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
        style: const TextStyle(fontSize: 15, height: 1.4, color: AppColors.body));
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import 'sign_in_screen.dart';
import 'home_screen.dart';

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool _bioChecked = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _maybeBiometric();
  }

  Future<void> _maybeBiometric() async {
    if (_bioChecked) return;
    final auth = context.read<AuthService>();
    if (auth.isSignedIn && auth.biometricEnabled) {
      final ok = await auth.authenticateBiometric();
      if (!ok && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Biometric auth failed')),
        );
      }
    }
    _bioChecked = true;
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    if (!auth.isSignedIn) return const SignInScreen();
    return const HomeScreen();
  }
}

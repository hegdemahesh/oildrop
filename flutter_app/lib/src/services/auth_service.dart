import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';

class AuthService extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final _storage = const FlutterSecureStorage();
  final LocalAuthentication _localAuth = LocalAuthentication();

  User? get user => _auth.currentUser;
  bool get isSignedIn => user != null;
  bool _biometricEnabled = false;
  bool get biometricEnabled => _biometricEnabled;

  AuthService() {
    _auth.authStateChanges().listen((_) => notifyListeners());
    _loadBiometricPref();
  }

  Future<void> _loadBiometricPref() async {
    final v = await _storage.read(key: 'biometric_enabled');
    _biometricEnabled = v == 'true';
    notifyListeners();
  }

  Future<void> setBiometricEnabled(bool enabled) async {
    _biometricEnabled = enabled;
    await _storage.write(key: 'biometric_enabled', value: enabled.toString());
    notifyListeners();
  }

  Future<UserCredential> signInEmail(String email, String password) async {
    return _auth.signInWithEmailAndPassword(email: email, password: password);
  }

  Future<UserCredential> registerEmail(String email, String password) async {
    return _auth.createUserWithEmailAndPassword(email: email, password: password);
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }

  Future<bool> authenticateBiometric() async {
    try {
      final canCheck = await _localAuth.canCheckBiometrics;
      final isDeviceSupported = await _localAuth.isDeviceSupported();
      if (!(canCheck || isDeviceSupported)) return false;
      return await _localAuth.authenticate(
        localizedReason: 'Authenticate to access Oildrop',
        options: const AuthenticationOptions(biometricOnly: true),
      );
    } catch (_) {
      return false;
    }
  }
}

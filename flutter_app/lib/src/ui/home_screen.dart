import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cloud_functions/cloud_functions.dart';
import '../services/auth_service.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Oildrop Home'),
        actions: [
          Switch(
            value: auth.biometricEnabled,
            onChanged: (v) => auth.setBiometricEnabled(v),
            thumbIcon: MaterialStateProperty.resolveWith((states) => const Icon(Icons.fingerprint)),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: auth.signOut,
          )
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Signed in as: ${auth.user?.email ?? '-'}'),
            const SizedBox(height: 16),
            Text('Biometric security: ${auth.biometricEnabled ? 'Enabled' : 'Disabled'}'),
            const SizedBox(height: 40),
            ElevatedButton.icon(
              onPressed: () async {
                try {
                  final callable = FirebaseFunctions.instance.httpsCallable('ping');
                  final result = await callable.call();
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Ping: ${result.data['status']} @ ${result.data['time']}')),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Ping failed: $e')),
                    );
                  }
                }
              },
              icon: const Icon(Icons.flash_on),
              label: const Text('Test Cloud Function'),
            ),
            const SizedBox(height: 16),
            const Text('Next steps: Integrate Firestore data, call Cloud Functions, add navigation...'),
          ],
        ),
      ),
    );
  }
}

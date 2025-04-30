import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:uni_links/uni_links.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter onesso Integration',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  bool _isLoading = true;
  Map<String, dynamic>? _user;
  final String _onessoBaseUrl = 'http://localhost:3002';

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    // Check for deep links (for mobile)
    _handleIncomingLinks();
    
    // Check if there's a stored token
    await _checkStoredToken();
  }

  void _handleIncomingLinks() {
    // Handle incoming links (for mobile deep linking)
    uriLinkStream.listen((Uri? uri) {
      if (uri != null) {
        final token = uri.queryParameters['token'];
        if (token != null) {
          _handleToken(token);
        }
      }
    }, onError: (err) {
      print('Error handling incoming links: $err');
    });
  }

  Future<void> _checkStoredToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('onesso_token');
    
    if (token != null) {
      await _fetchUserInfo(token);
    } else {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _handleToken(String token) async {
    // Store the token
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('onesso_token', token);
    
    // Fetch user info
    await _fetchUserInfo(token);
  }

  Future<void> _fetchUserInfo(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$_onessoBaseUrl/api/auth/me'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );
      
      if (response.statusCode == 200) {
        final userData = jsonDecode(response.body);
        setState(() {
          _user = userData;
          _isLoading = false;
        });
      } else {
        // Token is invalid, clear it
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('onesso_token');
        setState(() {
          _user = null;
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error fetching user info: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _handleLogin() async {
    // For web, we can directly navigate
    // For mobile, we need to use a custom URL scheme
    final url = '$_onessoBaseUrl/api/auth/login/onesso';
    
    if (await canLaunch(url)) {
      await launch(url);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not launch the login URL')),
      );
    }
  }

  Future<void> _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('onesso_token');
    setState(() {
      _user = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Flutter onesso Integration'),
      ),
      body: Center(
        child: _isLoading
            ? const CircularProgressIndicator()
            : Padding(
                padding: const EdgeInsets.all(20.0),
                child: Card(
                  elevation: 4,
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: _user != null
                        ? _buildUserProfile()
                        : _buildLoginPrompt(),
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildUserProfile() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.account_circle, size: 80, color: Colors.blue),
        const SizedBox(height: 16),
        Text(
          'Welcome, ${_user!['username']}!',
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Email: ${_user!['email']}'),
              const SizedBox(height: 8),
              Text('Roles: ${(_user!['roles'] as List).join(', ')}'),
              const SizedBox(height: 8),
              Text('Tenants: ${(_user!['tenants'] as List).join(', ')}'),
            ],
          ),
        ),
        const SizedBox(height: 16),
        ElevatedButton(
          onPressed: _handleLogout,
          style: ElevatedButton.styleFrom(
            minimumSize: const Size(double.infinity, 50),
          ),
          child: const Text('Logout'),
        ),
      ],
    );
  }

  Widget _buildLoginPrompt() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.lock, size: 80, color: Colors.grey),
        const SizedBox(height: 16),
        const Text(
          'You are not logged in',
          style: TextStyle(fontSize: 18),
        ),
        const SizedBox(height: 24),
        ElevatedButton(
          onPressed: _handleLogin,
          style: ElevatedButton.styleFrom(
            minimumSize: const Size(double.infinity, 50),
          ),
          child: const Text('Login with onesso'),
        ),
      ],
    );
  }
}

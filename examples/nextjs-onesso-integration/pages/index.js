import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if there's a token in the URL (after redirect from onesso)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      // Store the token in localStorage
      localStorage.setItem('onesso_token', token);
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Fetch user info
      fetchUserInfo(token);
    } else {
      // Check if there's a token in localStorage
      const storedToken = localStorage.getItem('onesso_token');
      if (storedToken) {
        fetchUserInfo(storedToken);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch('http://localhost:3002/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('onesso_token');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    // Redirect to onesso login
    window.location.href = 'http://localhost:3002/api/auth/login/onesso';
  };

  const handleLogout = () => {
    // Clear the token and user state
    localStorage.removeItem('onesso_token');
    setUser(null);
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Next.js onesso Integration</title>
        <meta name="description" content="Next.js onesso Integration Example" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Next.js <span className={styles.highlight}>onesso</span> Integration
        </h1>

        <div className={styles.card}>
          {loading ? (
            <p>Loading...</p>
          ) : user ? (
            <div className={styles.profile}>
              <h2>Welcome, {user.username}!</h2>
              <div className={styles.userInfo}>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Roles:</strong> {user.roles.join(', ')}</p>
                <p><strong>Tenants:</strong> {user.tenants.join(', ')}</p>
              </div>
              <button className={styles.button} onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <div className={styles.loginContainer}>
              <p>You are not logged in.</p>
              <button className={styles.button} onClick={handleLogin}>Login with onesso</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

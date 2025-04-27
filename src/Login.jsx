import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (email && password) {
      try {
        const response = await fetch(
          "https://daapx8kxod.execute-api.us-east-1.amazonaws.com/PROD/Login",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Invalid credentials");
        }

        alert(`Logged in as: ${email}`);
        navigate("/");
      } catch (error) {
        alert("Login failed: " + error.message);
      }
    } else {
      alert("Please enter both email and password.");
    }
  };

  return (
    <div className="login-container">
      <header className="header-layout">
        <div className="header-title">Resume-to-job Matcher</div>
        <nav className="header-nav">
          <ul className="header-menu">
            <li className="header-menu-item">
              <Link to="/signup" className="header-link">
                SignUp
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <div className="glass-card">
        <h2>Login to Your Account</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        <p className="signup-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

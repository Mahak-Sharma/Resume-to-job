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
        const rawResponse = await response.text();

        let result;
        try {
          const parsedGatewayResponse = JSON.parse(rawResponse); // Parse outer
          result = JSON.parse(parsedGatewayResponse.body); // Parse inner
        } catch (e) {
          console.error("Error parsing JSON:", e);
          alert("Error parsing server response.");
          return;
        }

        if (response.ok) {
          switch (result.message) {
            case "Login successful.":
              alert(`Logged in as: ${email}`);
              sessionStorage.setItem("userEmail", email);
              // Dispatch custom event to notify other components
              window.dispatchEvent(new CustomEvent('userLogin'));
              navigate("/");
              break;

            case "User not found.":
              alert("User not found. Please Sign Up first.");
              navigate("/Signup");
              break;

            case "Incorrect password.":
              alert("Incorrect password. Please try again.");
              break;

            default:
              alert(
                "Unknown error occurred: " + (result.message || "Unknown error")
              );
              break;
          }
        } else {
          alert("Error: " + (result.message || "Something went wrong"));
        }
      } catch (error) {
        console.error("Login error:", error);
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
              <Link to="/" className="header-link home-link">
                🏠 Home
              </Link>
            </li>
            <li className="header-menu-item">
              <Link to="/Signup" className="header-link">
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
          Don't have an account? <Link to="/Signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

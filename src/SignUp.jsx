import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";

const Signup = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    year: "",
    branch: "",
    semester: "",
    gender: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, year, branch, semester, gender, password } = form;

    try {
      const response = await fetch(
        "https://daapx8kxod.execute-api.us-east-1.amazonaws.com/PROD/Signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            year,
            branch,
            semester,
            gender,
            password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Signup failed");
      }

      alert(`Signed up as: ${form.name} (${form.email})`);
      navigate("/Login");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="signup-container">
      {/* Header */}
      <header className="header-layout">
        <div className="header-title">Resume-to-job Matcher</div>
        <nav className="header-nav">
          <ul className="header-menu">
            <li className="header-menu-item">
              <Link to="/Login" className="header-link">
                Login
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      {/* Glass Signup Card */}
      <div className="glass-card-signup">
        <h2>Create Your Account</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="year"
            placeholder="College Year (e.g., 2nd, 3rd)"
            value={form.year}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="branch"
            placeholder="Branch (e.g., CSE, ECE)"
            value={form.branch}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="semester"
            placeholder="Semester"
            value={form.semester}
            onChange={handleChange}
            required
          />
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            required
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit">Sign Up</button>
        </form>
        <p className="login-link">
          Already have an account? <a href="/Login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;

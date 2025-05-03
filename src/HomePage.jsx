import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Homepage.css";

const Homepage = () => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [action, setAction] = useState("match");
  const navigate = useNavigate();

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    setUserEmail(email);
  }, []);

  useEffect(() => {
    if (userEmail) {
      sessionStorage.setItem("userEmail", userEmail);
    }
  }, [userEmail]);

  const encodeFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (!userEmail) {
      alert("You need to login first to upload your resume.");
      navigate("/Login");
      return;
    }

    if (!file || !action) {
      return;
    }

    try {
      setUploading(true);
      const fileContent = await encodeFileToBase64(file);

      const uploadData = {
        fileContent,
        fileName: file.name,
        email: userEmail,
      };

      const apiUrl =
        "https://daapx8kxod.execute-api.us-east-1.amazonaws.com/PROD/Upload";

      const response = await axios.post(apiUrl, uploadData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        alert("Resume uploaded successfully!");
        navigate("/Data");
      } else {
        alert("Upload failed. Try again.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Something went wrong!");
    } finally {
      setUploading(false);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="background-container">
      <header className="header-layout">
        <div className="header-title">Resume-to-job Matcher</div>
        <nav className="header-nav">
          <ul className="header-menu">
            {userEmail ? (
              <>
                <li className="header-menu-item">
                  <Link to="/History" className="header-link">
                    History
                  </Link>
                </li>
                <li className="header-menu-item">
                  <button
                    className="header-link logout-btn"
                    onClick={() => {
                      sessionStorage.removeItem("userEmail");
                      setUserEmail(null);
                      navigate("/");
                    }}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="header-menu-item">
                  <Link to="/Login" className="header-link">
                    Login
                  </Link>
                </li>
                <li className="header-menu-item">
                  <Link to="/SignUp" className="header-link">
                    SignUp
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </header>

      <section className="placeorder-overlay">
        <article>
          <h2>Upload Your Resume to Find Matching Job Opportunities</h2>
          <input
            id="resume-upload"
            type="file"
            className="file-upload-section"
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files[0])}
            accept=".pdf,.doc,.docx,.txt"
            required
          />
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="upload-btn"
          >
            {uploading ? "Uploading..." : "Upload and Match"}
          </button>
        </article>
      </section>

      <section className="services">
        <h2>Key Features</h2>
        <div className="service-cards">
          <div className="service-card">
            <h3>Skill Extraction</h3>
            <p>
              Automatically extract technical and soft skills from your resume
              using AI and NLP.
            </p>
          </div>
          <div className="service-card">
            <h3>Live Job Matching</h3>
            <p>
              Instantly match your profile with real-time job listings from
              multiple platforms.
            </p>
          </div>
          <div className="service-card">
            <h3>Smart Recommendations</h3>
            <p>
              Receive personalized job suggestions based on your resume content
              and experience.
            </p>
          </div>
        </div>
      </section>

      <section className="about-us">
        <h2>About Us</h2>
        <p>
          Our AI-powered platform helps job seekers find tailored job
          opportunities by intelligently analyzing resumes and comparing them
          with real-time job listings via public APIs.
        </p>
      </section>
    </div>
  );
};

export default Homepage;

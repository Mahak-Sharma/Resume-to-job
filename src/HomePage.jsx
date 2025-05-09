import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Homepage.css";

const Homepage = () => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email); // just set it
    }
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchResume(userEmail); // wait until state is updated
    }
  }, [userEmail]); // 👈 new effect watches for userEmail changes

  const encodeFileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  const fetchResume = async (email) => {
    try {
      console.log("Calling fetchResume: ", email);
      const res = await axios.get(
        "https://daapx8kxod.execute-api.us-east-1.amazonaws.com/PROD/GetResume",
        { params: { email } }
      );
      console.log("Resume fetch response:", res.data);
      if (res.data?.fileUrl) {
        setResumeUrl(res.data.fileUrl);
      } else {
        console.warn("No resume URL returned for this user.");
      }
    } catch (err) {
      console.error(
        "Error fetching resume:",
        err?.response?.data || err.message
      );
    }
  };

  const handleUpload = async () => {
    if (!userEmail) {
      alert("You need to login first to upload your resume.");
      navigate("/Login");
      return;
    }

    if (!file) return;

    try {
      setUploading(true);
      const fileContent = await encodeFileToBase64(file);

      const uploadData = {
        fileContent,
        fileName: file.name,
        email: userEmail,
      };

      const response = await axios.post(
        "https://daapx8kxod.execute-api.us-east-1.amazonaws.com/PROD/Upload",
        uploadData,
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200) {
        alert("Resume uploaded successfully!");
        navigate("/Resume-data/Data");
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
                  <button
                    className="header-link"
                    onClick={() => setShowHistory(true)}
                  >
                    History
                  </button>
                </li>
                <li className="header-menu-item">
                  <button
                    className="header-link logout-btn"
                    onClick={() => {
                      sessionStorage.removeItem("userEmail");
                      setUserEmail(null);
                      setResumeUrl(null);
                      setShowHistory(false);
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
              Automatically extract skills from your resume using AI and NLP.
            </p>
          </div>
          <div className="service-card">
            <h3>Live Job Matching</h3>
            <p>Match your resume with real-time job listings.</p>
          </div>
          <div className="service-card">
            <h3>Smart Recommendations</h3>
            <p>
              Get job suggestions based on your resume content and experience.
            </p>
          </div>
        </div>
      </section>

      <section className="about-us">
        <h2>About Us</h2>
        <p>
          Our AI-powered platform analyzes resumes and finds tailored job
          matches using real-time data.
        </p>
      </section>

      {showHistory && (
        <div className="history-panel">
          <div className="history-header">
            <h3>History</h3>
            <button onClick={() => setShowHistory(false)} className="close-btn">
              ×
            </button>
          </div>
          <div className="history-content">
            <p>
              <strong>Email:</strong> {userEmail}
            </p>
            <p>
              <strong>Resume Uploaded:</strong>
            </p>
            {resumeUrl ? (
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                View Resume
              </a>
            ) : (
              <p>No resume found.</p>
            )}

            <p>
              <strong>Jobs Applied For:</strong>
            </p>
            <ul>
              <li>Frontend Developer at XYZ Corp</li>
              <li>Software Engineer at ABC Inc</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage;

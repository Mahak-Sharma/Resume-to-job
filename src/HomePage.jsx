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
  const [selectedSkills, setSelectedSkills] = useState([]); // State to store selected skills
  const navigate = useNavigate();

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) {
      setUserEmail(email);
    }
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchResume(userEmail);
    }
  }, [userEmail]);

  const encodeFileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const fetchResume = async (email) => {
    try {
      const response = await fetch(
        `https://daapx8kxod.execute-api.us-east-1.amazonaws.com/PROD/GetResume`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.body) {
        const bodyData = JSON.parse(data.body);
        if (bodyData.fileUrl) {
          setResumeUrl(bodyData.fileUrl);
        } else {
          setResumeUrl(null);
        }
      } else {
        setResumeUrl(null);
      }
    } catch (error) {
      console.error("Error fetching resume:", error);
      setResumeUrl(null);
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

  const handleSkillSelect = async (e) => {
    const selectedSkill = e.target.value;
    if (selectedSkill) {
      setSelectedSkills((prevSkills) => [...prevSkills, selectedSkill]);

      try {
        // Send the selected skill to the backend
        await axios.post("http://localhost:5000/api/add-skill", {
          skill: selectedSkill,
        });
        console.log(`Skill "${selectedSkill}" stored successfully.`);
      } catch (error) {
        console.error("Error storing skill:", error);
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
        <article>
          <h2>Select your skills</h2>
          <select className="skills-dropdown" onChange={handleSkillSelect}>
            <option value="">-- Select a Skill --</option>
            <option value="frontend">Frontend Development</option>
            <option value="backend">Backend Development</option>
            <option value="data-science">Data Science</option>
            <option value="ui-ux">UI/UX Design</option>
            <option value="devops">DevOps</option>
          </select>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="upload-btn"
          >
            {uploading ? "Uploading..." : "Upload and Match"}
          </button>
        </article>
      </section>

      <section className="selected-skills">
        <h2>Selected Skills</h2>
        <ul>
          {selectedSkills.map((skill, index) => (
            <li key={index}>{skill}</li>
          ))}
        </ul>
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
    </div>
  );
};

export default Homepage;

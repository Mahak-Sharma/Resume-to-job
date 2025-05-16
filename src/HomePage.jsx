import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Homepage.css";

const skillOptions = {
  frontend: ["HTML", "CSS", "JavaScript", "React", "Vue", "Angular"],
  backend: [
    "Node.js",
    "Express",
    "Django",
    "Flask",
    "Ruby on Rails",
    "Spring Boot",
  ],
  "data-science": [
    "Python",
    "R",
    "Pandas",
    "TensorFlow",
    "PyTorch",
    "Scikit-learn",
  ],
  "ui-ux": [
    "Figma",
    "Sketch",
    "Adobe XD",
    "InVision",
    "Wireframing",
    "Prototyping",
  ],
  devops: ["Docker", "Kubernetes", "AWS", "Azure", "CI/CD", "Terraform"],
};

const Homepage = () => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const [mainSkill, setMainSkill] = useState("");
  const [selectedSubSkills, setSelectedSubSkills] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const email = sessionStorage.getItem("userEmail");
    if (email) setUserEmail(email);
  }, []);

  useEffect(() => {
    if (userEmail) fetchResume(userEmail);
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();
      const bodyData = JSON.parse(data.body);
      setResumeUrl(bodyData?.fileUrl || null);
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
      const uploadData = { fileContent, fileName: file.name, email: userEmail };

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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMainSkillChange = (e) => {
    setMainSkill(e.target.value);
    setSelectedSubSkills([]);
  };

  const handleSubSkillToggle = async (skill) => {
    const updatedSkills = selectedSubSkills.includes(skill)
      ? selectedSubSkills.filter((s) => s !== skill)
      : [...selectedSubSkills, skill];

    setSelectedSubSkills(updatedSkills);

    try {
      await axios.post("http://localhost:5000/api/add-skill", {
        skill,
      });
      console.log(`Skill "${skill}" stored successfully.`);
    } catch (error) {
      console.error("Error storing skill:", error);
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

      <section className="select-skills">
        <h2>Select Main Skill</h2>
        <select
          className="skills-dropdown"
          value={mainSkill}
          onChange={handleMainSkillChange}
        >
          <option value="">-- Select a Skill Category --</option>
          {Object.keys(skillOptions).map((key) => (
            <option key={key} value={key}>
              {key.replace("-", " ").toUpperCase()}
            </option>
          ))}
        </select>

        {mainSkill && (
          <div className="sub-skills-checkboxes">
            <h3>Select Sub-skills</h3>
            {skillOptions[mainSkill].map((subSkill) => (
              <label key={subSkill} className="checkbox-label">
                <input
                  type="checkbox"
                  value={subSkill}
                  checked={selectedSubSkills.includes(subSkill)}
                  onChange={() => handleSubSkillToggle(subSkill)}
                />
                {subSkill}
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="selected-skills">
        <h2>Selected Sub-Skills</h2>
        <ul>
          {selectedSubSkills.map((skill, index) => (
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

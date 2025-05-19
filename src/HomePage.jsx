import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiUploadCloud, FiFile, FiCheck } from "react-icons/fi";
import "./Homepage.css";

const Homepage = () => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [userEmail, setUserEmail] = useState(null);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [error, setError] = useState("");

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [otherSkill, setOtherSkill] = useState("");
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

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
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
      setProgress(0);
      setError("");

      // Simulate upload progress
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? 90 : prev + 10));
      }, 200);

      const fileContent = await encodeFileToBase64(file);
      const uploadData = { fileContent, fileName: file.name, email: userEmail };

      const response = await axios.post(
        "https://daapx8kxod.execute-api.us-east-1.amazonaws.com/PROD/Upload",
        uploadData,
        { headers: { "Content-Type": "application/json" } }
      );

      clearInterval(interval);
      setProgress(100);

      if (response.status === 200) {
        // After successful S3 upload, navigate to parser
        navigate("/Resume-data/Data");
      } else {
        setError("Upload failed. Please try again.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Something went wrong! Please try again.");
    } finally {
      setUploading(false);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const skillsMapping = {
    "Software Development": {
      description: "Programming & Software Development Skills",
      subCategories: {
        "Frontend Development": [
          "HTML/CSS",
          "JavaScript",
          "React",
          "Angular",
          "Vue.js",
          "TypeScript",
          "Redux",
          "Webpack",
          "Bootstrap",
          "Sass",
        ],
        "Backend Development": [
          "Node.js",
          "Python",
          "Java",
          "C#",
          "PHP",
          "Express.js",
          "Django",
          "Spring Boot",
          "ASP.NET",
          "Laravel",
        ],
        "Mobile Development": [
          "React Native",
          "Flutter",
          "iOS",
          "Android",
          "Kotlin",
          "Swift",
          "Mobile UI/UX",
        ],
      },
    },
    "Database Management": {
      description: "Database & Data Management Skills",
      subCategories: {
        "SQL Databases": [
          "MySQL",
          "PostgreSQL",
          "Oracle",
          "SQL Server",
          "Database Design",
          "Query Optimization",
        ],
        "NoSQL Databases": [
          "MongoDB",
          "Redis",
          "Cassandra",
          "Firebase",
          "DynamoDB",
          "Neo4j",
        ],
        "Data Tools": [
          "Data Modeling",
          "ETL",
          "Data Migration",
          "Data Warehousing",
          "Database Administration",
        ],
      },
    },
    "Cloud Computing": {
      description: "Cloud Platforms & Services",
      subCategories: {
        "Cloud Platforms": [
          "AWS",
          "Azure",
          "Google Cloud",
          "DigitalOcean",
          "Heroku",
          "IBM Cloud",
        ],
        "DevOps Tools": [
          "Docker",
          "Kubernetes",
          "Jenkins",
          "GitLab CI",
          "GitHub Actions",
          "Terraform",
        ],
        "Cloud Services": [
          "Serverless",
          "Microservices",
          "Cloud Security",
          "Load Balancing",
          "Auto Scaling",
        ],
      },
    },
    "Data Science": {
      description: "Data Science & Analytics",
      subCategories: {
        "Machine Learning": [
          "TensorFlow",
          "PyTorch",
          "Scikit-learn",
          "Deep Learning",
          "Neural Networks",
        ],
        "Data Analysis": [
          "Python",
          "R",
          "Pandas",
          "NumPy",
          "Data Visualization",
          "Statistical Analysis",
        ],
        "Big Data": [
          "Hadoop",
          "Spark",
          "Kafka",
          "Big Data Analytics",
          "Data Pipeline",
        ],
      },
    },
  };

  const toggleSubCategory = (category, subCategory) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [`${category}-${subCategory}`]: !prev[`${category}-${subCategory}`],
    }));
  };

  const handleSubSkillToggle = (category, subCategory, skill) => {
    const skillWithCategory = `${category} - ${subCategory}: ${skill}`;
    setSelectedSkills((prev) =>
      prev.includes(skillWithCategory)
        ? prev.filter((s) => s !== skillWithCategory)
        : [...prev, skillWithCategory]
    );
  };

  const handleOtherSkillAdd = (e) => {
    e.preventDefault();
    if (otherSkill.trim()) {
      setSelectedSkills((prev) => [...prev, `Other: ${otherSkill.trim()}`]);
      setOtherSkill("");
    }
  };

  const removeSkill = (skill) => {
    setSelectedSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleSearchJobs = () => {
    // Format selected skills into a simpler array
    const formattedSkills = selectedSkills.map(skill => {
        // Extract just the skill name from the format "Category - SubCategory: SkillName"
        const skillName = skill.split(': ')[1];
        return skillName;
    });

    // Save to a JSON file
    const jsonData = JSON.stringify({
        skills: formattedSkills
    }, null, 2);
    
    // Save to localStorage for Data.jsx to access
    localStorage.setItem('selectedSkills', jsonData);

    // Navigate to Data component
    navigate('/Resume-data/Data');
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
                      setResumeUrl(null);
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
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </article>
      </section>

      <section className="select-skills">
        <article>
          <h2>Select Your Skills</h2>
          <div className="skills-container">
            <div className="all-skills-sections">
              {Object.entries(skillsMapping).map(([category, data]) => (
                <div key={category} className="skill-section">
                  <h3 className="skill-category-title">{category}</h3>
                  <p className="skill-category-description">
                    {data.description}
                  </p>

                  <div className="sub-categories">
                    {Object.entries(data.subCategories).map(
                      ([subCategory, skills]) => (
                        <div key={subCategory} className="sub-category">
                          <button
                            className={`sub-category-header ${
                              expandedCategories[`${category}-${subCategory}`]
                                ? "expanded"
                                : ""
                            }`}
                            onClick={() =>
                              toggleSubCategory(category, subCategory)
                            }
                          >
                            <span>{subCategory}</span>
                            <span className="dropdown-arrow">▼</span>
                          </button>

                          {expandedCategories[`${category}-${subCategory}`] && (
                            <div className="sub-skills-grid">
                              {skills.map((skill) => (
                                <div key={skill} className="skill-checkbox">
                  <input
                    type="checkbox"
                                    id={`${category}-${subCategory}-${skill}`}
                                    checked={selectedSkills.includes(
                                      `${category} - ${subCategory}: ${skill}`
                                    )}
                                    onChange={() =>
                                      handleSubSkillToggle(
                                        category,
                                        subCategory,
                                        skill
                                      )
                                    }
                  />
                                  <label
                                    htmlFor={`${category}-${subCategory}-${skill}`}
                                  >
                                    {skill}
                </label>
                                </div>
              ))}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Other Skills Input */}
            <div className="other-skills-container">
              <form
                onSubmit={handleOtherSkillAdd}
                className="other-skills-form"
              >
                <input
                  type="text"
                  className="other-skills-input"
                  placeholder="Add other skills"
                  value={otherSkill}
                  onChange={(e) => setOtherSkill(e.target.value)}
                />
                <button
                  type="submit"
                  className="add-skill-btn"
                  disabled={!otherSkill.trim()}
                >
                  Add Skill
                </button>
              </form>
            </div>

            {/* Selected Skills Display */}
            {selectedSkills.length > 0 && (
              <div className="selected-skills">
                <h3>Selected Skills</h3>
                <div className="selected-skills-list-container">
                  <div className="selected-skills-list">
                    {selectedSkills.map((skill) => (
                      <span key={skill} className="selected-skill-tag">
                        {skill}
                        <button
                          className="remove-skill"
                          onClick={() => removeSkill(skill)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
            </div>
          )}

            {/* Search Jobs Button */}
            <button
              className="search-jobs-btn"
              onClick={handleSearchJobs}
              disabled={selectedSkills.length === 0}
            >
              Search Jobs ({selectedSkills.length} skills selected)
            </button>
          </div>
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
    </div>
  );
};

export default Homepage;

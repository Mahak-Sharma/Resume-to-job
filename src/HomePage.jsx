import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./HomePage.css";

const Homepage = () => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resumeUrl, setResumeUrl] = useState(null);
  const [error, setError] = useState("");

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [otherSkills, setOtherSkills] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentFeaturesSlide, setCurrentFeaturesSlide] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Add authentication state
  const navigate = useNavigate();

  // Check if user is already logged in on component mount
  useEffect(() => {
    const userEmail = sessionStorage.getItem("userEmail");
    if (userEmail) {
      setIsLoggedIn(true);
      fetchResume(userEmail);
    }

    // Listen for storage changes (when login/logout happens in other tabs/windows)
    const handleStorageChange = () => {
      const userEmail = sessionStorage.getItem("userEmail");
      setIsLoggedIn(!!userEmail);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom login event
    const handleLoginEvent = () => {
      setIsLoggedIn(true);
    };
    
    window.addEventListener('userLogin', handleLoginEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLogin', handleLoginEvent);
    };
  }, []);

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

  const encodeFileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleFileSelect = (file) => {
    setFile(file);
  };

  const handleUpload = async () => {
    if (!isLoggedIn) {
      alert("You need to login first to upload your resume.");
      navigate("/login");
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

      // First upload to S3
      const fileContent = await encodeFileToBase64(file);
      const userEmail = sessionStorage.getItem("userEmail");
      const uploadData = { fileContent, fileName: file.name, email: userEmail };

      const response = await axios.post(
        "https://daapx8kxod.execute-api.us-east-1.amazonaws.com/PROD/Upload",
        uploadData,
        { headers: { "Content-Type": "application/json" } }
      );

      clearInterval(interval);
      setProgress(100);

      if (response.status === 200) {
        // Get the S3 file URL from the response
        const s3FileUrl = response.data.fileUrl;

        // Create FormData for the resume parser
        const formData = new FormData();
        formData.append('file', file);

        // Call the resume parser API
        const parserResponse = await axios.post(
          "http://localhost:5000/upload-resume",
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        // Store the parsed data in sessionStorage for Data.jsx to access
        sessionStorage.setItem('parsedResumeData', JSON.stringify(parserResponse.data));

        // Store recommended jobs separately for easier access
        sessionStorage.setItem('recommendedJobs', JSON.stringify(parserResponse.data.recommendedJobs));

        // Update selected skills based on extracted skills
        const extractedSkills = parserResponse.data.extractedInfo.Skills;
        const formattedSkills = extractedSkills.map(skill => `Extracted: ${skill}`);
        setSelectedSkills(prev => [...new Set([...prev, ...formattedSkills])]);

        // Navigate to Data component
        navigate("/Resume-data/Data");
      } else {
        setError("Upload failed. Please try again.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(error.response?.data?.detail || "Something went wrong! Please try again.");
    } finally {
      setUploading(false);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSearchJobs = () => {
    // Get recommended jobs from sessionStorage
    const recommendedJobs = JSON.parse(sessionStorage.getItem('recommendedJobs') || '[]');
    
    // Format selected skills into a simpler array
    const formattedSkills = selectedSkills.map(skill => {
        // Extract just the skill name from the format "Category - SubCategory: SkillName"
        const skillName = skill.split(': ')[1];
        return skillName;
    });

    // Save to sessionStorage for Data.jsx to access
    sessionStorage.setItem('selectedSkills', JSON.stringify({
        skills: formattedSkills,
        recommendedJobs: recommendedJobs // Include recommended jobs in the data
    }));

    // Navigate to Data component
    navigate('/Resume-data/Data');
  };

  const skillsMapping = {
    "Programming Languages": {
      icon: "💻",
      description: "Core programming and development skills",
      subCategories: {
        "Frontend": ["JavaScript", "React", "HTML", "CSS", "TypeScript", "Vue.js", "Angular"],
        "Backend": ["Python", "Java", "Node.js", "PHP", "C#", "Ruby", "Go"],
        "Mobile": ["Swift", "Kotlin", "React Native", "Flutter", "Xamarin"]
      }
    },
    "Data & Analytics": {
      icon: "📊",
      description: "Data science and analytical capabilities",
      subCategories: {
        "Data Science": ["Python", "R", "SQL", "Machine Learning", "Deep Learning", "Statistics"],
        "Big Data": ["Hadoop", "Spark", "Kafka", "MongoDB", "Cassandra", "Elasticsearch"],
        "Business Intelligence": ["Tableau", "Power BI", "QlikView", "Looker", "SAS"]
      }
    },
    "Cloud & DevOps": {
      icon: "☁️",
      description: "Cloud infrastructure and development operations",
      subCategories: {
        "Cloud Platforms": ["AWS", "Azure", "Google Cloud", "IBM Cloud", "Oracle Cloud"],
        "DevOps Tools": ["Docker", "Kubernetes", "Jenkins", "GitLab", "Ansible", "Terraform"],
        "Monitoring": ["Prometheus", "Grafana", "ELK Stack", "New Relic", "Datadog"]
      }
    },
    "Design & Creative": {
      icon: "🎨",
      description: "Creative and design-related skills",
      subCategories: {
        "UI/UX Design": ["Figma", "Adobe XD", "Sketch", "InVision", "Prototyping"],
        "Graphic Design": ["Photoshop", "Illustrator", "InDesign", "Canva", "Affinity Designer"],
        "3D & Animation": ["Blender", "Maya", "Cinema 4D", "After Effects", "Unity"]
      }
    }
  };

  const handleSkillToggle = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleAddSkill = () => {
    if (otherSkills.trim() && !selectedSkills.includes(otherSkills.trim())) {
      setSelectedSkills(prev => [...prev, otherSkills.trim()]);
      setOtherSkills("");
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSelectedSkills(prev => prev.filter(skill => skill !== skillToRemove));
  };

  // Toggle sub-category expansion
  const toggleSubCategory = (category, subCategory) => {
    const key = `${category}-${subCategory}`;
    setExpandedCategories(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Handle login/logout
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSelectedSkills([]); // Clear selected skills on logout
    sessionStorage.removeItem("userEmail"); // Clear session storage
    navigate('/'); // Redirect to home page
  };

  // Auto-play for features carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeaturesSlide((prev) => (prev + 1) % 3); // 3 slides for features
    }, 3000); // Faster transition for continuous movement
    return () => clearInterval(interval);
  }, []); // Remove autoPlayFeatures dependency for continuous movement

  // Features carousel functions
  const goToFeaturesSlide = (index) => {
    setCurrentFeaturesSlide(index);
  };

  const nextFeaturesSlide = () => {
    setCurrentFeaturesSlide((prev) => (prev + 1) % 3);
  };

  const prevFeaturesSlide = () => {
    setCurrentFeaturesSlide((prev) => (prev - 1 + 3) % 3);
  };

  return (
    <div className="background-container">
      <header className="header-layout">
        <div className="header-title">Resume-to-Job Matcher</div>
        <nav className="header-nav">
          <ul className="header-menu">
                <li className="header-menu-item">
              <a href="/" className="header-link">Home</a>
                </li>
            {!isLoggedIn && (
                <li className="header-menu-item">
                <a href="/SignUp" className="header-link">Sign Up</a>
                </li>
            )}
            <li className="header-menu-item">
              {isLoggedIn ? (
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
              ) : (
                <button className="login-btn" onClick={() => navigate('/login')}>Login</button>
              )}
            </li>
          </ul>
        </nav>
      </header>

      <div className="dashboard-container">
        {/* Left Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <h3>🎯 Skills Dashboard</h3>
          <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
          >
              {sidebarOpen ? '◀' : '▶'}
          </button>
          </div>

          <div className="sidebar-content">
            <div className="skills-dashboard">
            <div className="all-skills-sections">
              {Object.entries(skillsMapping).map(([category, data]) => (
                <div key={category} className="skill-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.5rem' }}>{data.icon}</span>
                  <h3 className="skill-category-title">{category}</h3>
                    </div>
                    <p className="skill-category-description">{data.description}</p>

                    {Object.entries(data.subCategories).map(([subCategory, skills]) => (
                        <div key={subCategory} className="sub-category">
                          <button
                          className="sub-category-header"
                          onClick={() => toggleSubCategory(category, subCategory)}
                        >
                          {subCategory}
                          <span className={`dropdown-arrow ${expandedCategories[`${category}-${subCategory}`] ? 'expanded' : ''}`}>
                            ▼
                          </span>
                          </button>
                        <div className={`sub-skills-grid ${expandedCategories[`${category}-${subCategory}`] ? 'expanded' : 'collapsed'}`}>
                              {skills.map((skill) => (
                                <div key={skill} className="skill-checkbox">
                                  <input
                                    type="checkbox"
                                id={skill}
                                checked={selectedSkills.includes(skill)}
                                onChange={() => handleSkillToggle(skill)}
                              />
                              <label htmlFor={skill}>{skill}</label>
                            </div>
                          ))}
                  </div>
                </div>
              ))}
            </div>
                ))}

            <div className="other-skills-container">
                  <h3>➕ Add Custom Skills</h3>
                  <div className="other-skills-form">
                <input
                  type="text"
                  className="other-skills-input"
                      placeholder="Enter custom skill..."
                      value={otherSkills}
                      onChange={(e) => setOtherSkills(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                />
                <button
                  className="add-skill-btn"
                      onClick={handleAddSkill}
                      disabled={!otherSkills.trim()}
                >
                  Add Skill
                </button>
                  </div>
            </div>

            {/* Selected Skills Display */}
            {selectedSkills.length > 0 && (
              <div className="selected-skills">
                <h3>Selected Skills</h3>
                  <div className="selected-skills-list">
                    {selectedSkills.map((skill) => (
                      <span key={skill} className="selected-skill-tag">
                        {skill}
                        <button
                          className="remove-skill"
                        onClick={() => handleRemoveSkill(skill)}
                        >
                          ×
                        </button>
                      </span>
                    ))}
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
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`main-content ${sidebarOpen ? 'with-sidebar' : 'full-width'}`}>
          <section className="placeorder-overlay">
            <article>
              <h2>Upload Your Resume to Find Matching Job Opportunities</h2>
              <div 
                className={`file-upload-section ${dragActive ? 'drag-active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  id="resume-upload"
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setFile(e.target.files[0])}
                  accept=".pdf,.doc,.docx,.txt"
                  required
                  style={{ display: 'none' }}
                />
                <div className="upload-content">
                  {file ? (
                    <div className="file-selected">
                      <p>Selected file: {file.name}</p>
                      <button 
                        className="remove-file-btn"
                        onClick={() => setFile(null)}
                      >
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <div className="upload-prompt">
                      <p>Drag and drop your resume here or click to browse</p>
                      <button 
                        className="browse-btn"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Browse Files
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {uploading && (
                <div className="progress-container">
                  <div className="progress-header">
                    <span>Uploading...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
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
              
              {resumeUrl && (
                <div className="resume-info">
                  <p>Current Resume: <a href={resumeUrl} target="_blank" rel="noopener noreferrer">View Resume</a></p>
                </div>
              )}
        </article>
      </section>

          {/* Key Features Section */}
          <div className="project-features">
            <h3>Key Features</h3>
            
            <div className="features-carousel-container">
              <button
                className="features-carousel-arrow prev"
                onClick={prevFeaturesSlide}
                disabled={currentFeaturesSlide === 0}
              >
                ‹
              </button>
              
              <div className="features-carousel-track">
                {/* First set of slides */}
                <div className="features-carousel-slide">
                  <div className="features-grid">
                    <div className="feature-card">
                      <div className="feature-icon">🤖</div>
                      <h4>AI-Powered Matching</h4>
                      <p>Advanced machine learning algorithms analyze your resume and skills to find the most relevant job opportunities.</p>
                    </div>
                    
                    <div className="feature-card">
                      <div className="feature-icon">📊</div>
                      <h4>Skill Analysis</h4>
                      <p>Comprehensive skill assessment and categorization to identify your strengths and areas for growth.</p>
                    </div>
                  </div>
                </div>
                
                <div className="features-carousel-slide">
                  <div className="features-grid">
                    <div className="feature-card">
                      <div className="feature-icon">🎯</div>
                      <h4>Smart Recommendations</h4>
                      <p>Personalized job suggestions based on your experience, skills, and career preferences.</p>
                    </div>
                    
                    <div className="feature-card">
                      <div className="feature-icon">📈</div>
                      <h4>Career Insights</h4>
                      <p>Data-driven insights into market trends, salary expectations, and career progression paths.</p>
                    </div>
                  </div>
                </div>
                
                <div className="features-carousel-slide">
                  <div className="features-grid">
                    <div className="feature-card">
                      <div className="feature-icon">🔍</div>
                      <h4>Advanced Search</h4>
                      <p>Powerful filtering and search capabilities to find jobs that match your specific criteria.</p>
                    </div>
                    
                    <div className="feature-card">
                      <div className="feature-icon">💼</div>
                      <h4>Resume Optimization</h4>
                      <p>AI-powered suggestions to improve your resume and increase your chances of getting hired.</p>
                    </div>
                  </div>
                </div>
                
                {/* Duplicate slides for seamless loop */}
                <div className="features-carousel-slide">
                  <div className="features-grid">
                    <div className="feature-card">
                      <div className="feature-icon">🤖</div>
                      <h4>AI-Powered Matching</h4>
                      <p>Advanced machine learning algorithms analyze your resume and skills to find the most relevant job opportunities.</p>
                    </div>
                    
                    <div className="feature-card">
                      <div className="feature-icon">📊</div>
                      <h4>Skill Analysis</h4>
                      <p>Comprehensive skill assessment and categorization to identify your strengths and areas for growth.</p>
                    </div>
                  </div>
                </div>
                
                <div className="features-carousel-slide">
                  <div className="features-grid">
                    <div className="feature-card">
                      <div className="feature-icon">🎯</div>
                      <h4>Smart Recommendations</h4>
                      <p>Personalized job suggestions based on your experience, skills, and career preferences.</p>
                    </div>
                    
                    <div className="feature-card">
                      <div className="feature-icon">📈</div>
                      <h4>Career Insights</h4>
                      <p>Data-driven insights into market trends, salary expectations, and career progression paths.</p>
                    </div>
                  </div>
                </div>
                
                <div className="features-carousel-slide">
                  <div className="features-grid">
                    <div className="feature-card">
                      <div className="feature-icon">🔍</div>
                      <h4>Advanced Search</h4>
                      <p>Powerful filtering and search capabilities to find jobs that match your specific criteria.</p>
                    </div>
                    
                    <div className="feature-card">
                      <div className="feature-icon">💼</div>
                      <h4>Resume Optimization</h4>
                      <p>AI-powered suggestions to improve your resume and increase your chances of getting hired.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                className="features-carousel-arrow next"
                onClick={nextFeaturesSlide}
                disabled={currentFeaturesSlide === 2}
              >
                ›
              </button>
            </div>
            
            <div className="features-carousel-nav">
              {Array.from({ length: 3 }, (_, index) => (
                <button
                  key={index}
                  className={`features-carousel-dot ${index === currentFeaturesSlide ? 'active' : ''}`}
                  onClick={() => goToFeaturesSlide(index)}
                />
              ))}
          </div>
          </div>

          {/* Professional Footer */}
          <footer className="footer">
            <div className="footer-content">
              <h3>Ready to Transform Your Career?</h3>
              <p>
                Join thousands of professionals who have already discovered their perfect job matches through our AI-powered platform. 
                Start your journey today and unlock new opportunities that align with your skills and aspirations.
              </p>
              
              <div className="footer-links">
                <a href="#features">Features</a>
                <a href="#how-it-works">How It Works</a>
                <a href="#pricing">Pricing</a>
                <a href="#contact">Contact</a>
              </div>
              
              <div className="footer-bottom">
                <p>&copy; 2024 Resume to Job Matcher. All rights reserved.</p>
                <p>Powered by AI Technology</p>
          </div>
        </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Homepage;

import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AWS from "aws-sdk";
import "./Homepage.css";

const Homepage = () => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
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

  // Configure AWS S3
  AWS.config.update({
    accessKeyId: "YOUR_ACCESS_KEY", // <-- Replace
    secretAccessKey: "YOUR_SECRET_ACCESS_KEY", // <-- Replace
    region: "YOUR_BUCKET_REGION", // e.g., "us-east-1"
  });

  const s3 = new AWS.S3();

  const handleUpload = async () => {
    if (!userEmail) {
      alert("You need to login first to upload your resume.");
      navigate("/Login");
      return;
    }

    if (!file) {
      alert("Please select a resume file first.");
      return;
    }

    const params = {
      Bucket: "YOUR_BUCKET_NAME", // <-- Replace
      Key: `resumes/${file.name}`, // Save inside a 'resumes' folder in your bucket
      Body: file,
      ContentType: file.type,
      ACL: "private", // or "public-read" if you want public access
    };

    try {
      setUploading(true);

      s3.upload(params, (err, data) => {
        setUploading(false);

        if (err) {
          console.error("Error uploading resume:", err);
          alert("Something went wrong. Please try again.");
        } else {
          console.log("Upload successful:", data.Location);
          setFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          alert("Resume uploaded successfully!");
          navigate("/Data");
        }
      });
    } catch (error) {
      console.error("Unexpected error uploading resume:", error);
      alert("Something went wrong. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="background-container">
      <header className="header-layout">
        <div className="header-title">Resume-to-job Matcher</div>
        <nav className="header-nav">
          <ul className="header-menu">
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

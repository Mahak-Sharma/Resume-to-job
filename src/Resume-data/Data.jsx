import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Data.css"; // Or whatever your CSS file is
import adzuna_jobs_clean from "./adzuna_jobs_clean.json";
const ITEMS_PER_PAGE = 30;

const Data = () => {
  const [jobs, setJobs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const userEmail = sessionStorage.getItem("userEmail");

  useEffect(() => {
    if (!userEmail) {
      alert("Please login first.");
      navigate("/Login");
      return;
    }
    setJobs(adzuna_jobs_clean);





  }, [userEmail, navigate]);

  const totalPages = Math.ceil(jobs.length / ITEMS_PER_PAGE);
  const currentJobs = jobs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="job-matches-container">
      <h2>Matching Jobs</h2>
      <div className="job-list">
        {currentJobs.length > 0 ? (
          currentJobs.map((job, index) => (
            <div key={index} className="job-card">
              <div className="job-header">
                <h3>{job.title}</h3>
              </div>
              <p>
                <strong>Company:</strong> {job.company_name}
              </p>
              <p>
                <strong>Location:</strong> {job.location}
              </p>
              <p>
                <strong>Description:</strong> {job.description}
              </p>
              <a
                href={job.apply_link}
                rel="noopener noreferrer"
                className="apply-button"
              >
                Apply Job
              </a>
            </div>
          ))
        ) : (
          <p>No job matches found.</p>
        )}
      </div>

      {jobs.length > ITEMS_PER_PAGE && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Data;

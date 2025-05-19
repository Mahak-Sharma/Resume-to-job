import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Data.css";
const ITEMS_PER_PAGE = 50;

const Data = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const navigate = useNavigate();
  const userEmail = sessionStorage.getItem("userEmail");

  useEffect(() => {
    if (!userEmail) {
      alert("Please login first.");
      navigate("/Login");
      return;
    }

    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get selected skills from localStorage
        const selectedSkillsJson = localStorage.getItem("selectedSkills");
        if (!selectedSkillsJson) {
          setError("No skills selected");
          setLoading(false);
          return;
        }

        const selectedSkills = JSON.parse(selectedSkillsJson);

        // Format skills for URL
        const skillsQuery = selectedSkills.skills
          .map((skill) => encodeURIComponent(skill))
          .join("%20OR%20");

        // Fetch jobs from multiple pages
        const allJobs = [];
        const pagesToFetch = 5;
        const jobsPerPage = 50;

        for (let page = 1; page <= pagesToFetch; page++) {
          // Construct Adzuna API URL with pagination
          const baseUrl = "http://api.adzuna.com/v1/api/jobs/in/search";
          const apiId = "f66bacc5";
          const apiKey = "ea685254132fbfdb7cce7e5477886a38";
          const url = `${baseUrl}/${page}?app_id=${apiId}&app_key=${apiKey}&results_per_page=${jobsPerPage}&what=${skillsQuery}&content-type=application/json&sort_by=relevance`;

          const response = await fetch(url);
          const data = await response.json();

          if (data.results) {
            // Format jobs data
            const formattedJobs = data.results.map((job) => ({
              title: job.title,
              company_name: job.company.display_name,
              location: job.location.display_name,
              description: job.description,
              apply_link: job.redirect_url,
              category: job.category.label,
              salary_min: job.salary_min,
              salary_max: job.salary_max,
              contract_type: job.contract_type,
              created_at: new Date(job.created).toLocaleDateString(),
            }));

            allJobs.push(...formattedJobs);
            setTotalResults(data.count || 0);
          }
        }

        // Remove duplicates based on title and company
        const uniqueJobs = allJobs.filter(
          (job, index, self) =>
            index ===
            self.findIndex(
              (j) =>
                j.title === job.title && j.company_name === job.company_name
            )
        );

        setJobs(uniqueJobs);
      } catch (err) {
        setError("Failed to fetch jobs. Please try again.");
        console.error("Error fetching jobs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [userEmail, navigate]);

  const totalPages = Math.ceil(jobs.length / ITEMS_PER_PAGE);
  const currentJobs = jobs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="loading">
        Loading jobs... Please wait while we fetch all available positions.
      </div>
    );
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="job-matches-container">
      <h2>Matching Jobs</h2>
      <div className="total-results">
        Found {jobs.length} matching positions out of {totalResults} total jobs
      </div>
      <div className="job-list">
        {currentJobs.length > 0 ? (
          currentJobs.map((job, index) => (
            <div key={index} className="job-card">
              <div className="job-header">
                <h3>{job.title}</h3>
                <span className="job-category">{job.category}</span>
              </div>
              <p>
                <strong>Company:</strong> {job.company_name}
              </p>
              <p>
                <strong>Location:</strong> {job.location}
              </p>
              {(job.salary_min || job.salary_max) && (
                <p className="salary-range">
                  <strong>Salary Range:</strong>{" "}
                  {job.salary_min
                    ? `₹${Math.round(job.salary_min).toLocaleString()}`
                    : "N/A"}{" "}
                  -
                  {job.salary_max
                    ? `₹${Math.round(job.salary_max).toLocaleString()}`
                    : "N/A"}
                </p>
              )}
              {job.contract_type && (
                <p>
                  <strong>Contract Type:</strong> {job.contract_type}
                </p>
              )}
              <p>
                <strong>Posted:</strong> {job.created_at}
              </p>
              <p className="job-description">
                <strong>Description:</strong> {job.description}
              </p>
              <a
                href={job.apply_link}
                target="_blank"
                rel="noopener noreferrer"
                className="apply-button"
              >
                Apply Now
              </a>
            </div>
          ))
        ) : (
          <p>No job matches found for the selected skills.</p>
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

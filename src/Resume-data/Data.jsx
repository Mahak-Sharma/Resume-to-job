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
  const [parsedResumeData, setParsedResumeData] = useState(null);
  const navigate = useNavigate();
  const userEmail = sessionStorage.getItem("userEmail");

  useEffect(() => {
    if (!userEmail) {
      alert("Please login first.");
      navigate("/Login");
      return;
    }

    // Get parsed resume data from sessionStorage
    const storedParsedData = sessionStorage.getItem("parsedResumeData");
    if (storedParsedData) {
      setParsedResumeData(JSON.parse(storedParsedData));
    }

    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get selected skills and parsed resume data from sessionStorage
        const selectedSkillsJson = sessionStorage.getItem("selectedSkills");
        const parsedResumeData = JSON.parse(
          sessionStorage.getItem("parsedResumeData") || "{}"
        );

        if (!selectedSkillsJson && !parsedResumeData?.extractedInfo?.Skills) {
          setError("No skills available for job search");
          setLoading(false);
          return;
        }

        // Combine extracted skills from resume with manually selected skills
        let allSkills = [];

        // Add extracted skills from resume
        if (parsedResumeData?.extractedInfo?.Skills) {
          allSkills = [...parsedResumeData.extractedInfo.Skills];
        }

        // Add manually selected skills
        if (selectedSkillsJson) {
          const selectedSkills = JSON.parse(selectedSkillsJson);
          if (selectedSkills.skills) {
            // Add only unique skills that aren't already in allSkills
            selectedSkills.skills.forEach((skill) => {
              if (!allSkills.includes(skill)) {
                allSkills.push(skill);
              }
            });
          }
        }

        // Remove any "Extracted: " prefix from skills
        allSkills = allSkills.map((skill) => skill.replace("Extracted: ", ""));

        // Fetch jobs for each skill individually
        const allJobs = [];
        const jobsPerSkill = 10; // Number of jobs to fetch per skill
        const baseUrl = "http://api.adzuna.com/v1/api/jobs/in/search";
        const apiId = "f66bacc5";
        const apiKey = "ea685254132fbfdb7cce7e5477886a38";

        // Create a Set to track unique job IDs
        const uniqueJobIds = new Set();

        // Fetch jobs for each skill
        for (const skill of allSkills) {
          const encodedSkill = encodeURIComponent(skill);
          const url = `${baseUrl}/1?app_id=${apiId}&app_key=${apiKey}&results_per_page=${jobsPerSkill}&what=${encodedSkill}&content-type=application/json&sort_by=relevance`;

          try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.results) {
              // Format jobs data and add skill match information
              const formattedJobs = data.results.map((job) => {
                // Calculate how many of the user's skills match this job's description
                const jobDescription = job.description.toLowerCase();
                const matchingSkills = allSkills.filter((s) =>
                  jobDescription.includes(s.toLowerCase())
                );

                return {
                  id: job.id, // Add job ID for uniqueness check
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
                  matching_skills: matchingSkills,
                  skill_match_score: Math.round(
                    (matchingSkills.length / allSkills.length) * 100
                  ),
                  matched_skill: skill, // Track which skill matched this job
                };
              });

              // Add only unique jobs based on job ID
              formattedJobs.forEach((job) => {
                if (!uniqueJobIds.has(job.id)) {
                  uniqueJobIds.add(job.id);
                  allJobs.push(job);
                }
              });

              setTotalResults((prev) => prev + (data.count || 0));
            }
          } catch (err) {
            console.error(`Error fetching jobs for skill ${skill}:`, err);
            // Continue with next skill even if one fails
            continue;
          }
        }

        // Sort jobs by skill match score
        allJobs.sort((a, b) => b.skill_match_score - a.skill_match_score);

        setJobs(allJobs);
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
      {parsedResumeData && (
        <div className="resume-analysis">
          <h2>Resume Analysis</h2>
          <div className="extracted-skills">
            <h3>Extracted Skills</h3>
            <div className="skills-list">
              {parsedResumeData.extractedInfo.Skills.map((skill, index) => (
                <span key={index} className="skill-tag">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="recommended-jobs">
            <h3>AI-Recommended Jobs</h3>
            <div className="recommended-jobs-list">
              {parsedResumeData.recommendedJobs
                .slice(0, 5)
                .map((job, index) => (
                  <div key={index} className="recommended-job-card">
                    <h4>{job.title}</h4>
                    <p>Match Score: {job.similarity_score}%</p>
                    {job.matching_skills && (
                      <div className="matching-skills">
                        <strong>Matching Skills:</strong>
                        <div className="matching-skills-list">
                          {job.matching_skills.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="matching-skill-tag">
                              {skill}
                            </span>
                          ))}
                          {job.matching_skills.length > 3 && (
                            <span className="more-skills">
                              +{job.matching_skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

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
                <div className="job-meta">
                  <span className="job-category">{job.category}</span>
                  <span className="skill-match-score">
                    Skill Match: {job.skill_match_score}%
                  </span>
                  <span className="matched-skill">
                    Matched via: {job.matched_skill}
                  </span>
                </div>
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
              {job.matching_skills && job.matching_skills.length > 0 && (
                <div className="matching-skills">
                  <strong>Matching Skills:</strong>
                  <div className="matching-skills-list">
                    {job.matching_skills.map((skill, idx) => (
                      <span key={idx} className="matching-skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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

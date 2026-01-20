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

        const selectedSkillsJson = sessionStorage.getItem("selectedSkills");
        const parsedResumeData = JSON.parse(
          sessionStorage.getItem("parsedResumeData") || "{}",
        );

        let allSkills = [];

        if (parsedResumeData?.extractedInfo?.Skills) {
          console.log("parsedResumeData: ", parsedResumeData);
          allSkills = [...parsedResumeData.extractedInfo.Skills];
          console.log("All Skills: ", allSkills);
        }
        console.log(parsedResumeData.recommendedJobs);
        if (selectedSkillsJson) {
          const selectedSkills = JSON.parse(selectedSkillsJson);
          selectedSkills.skills?.forEach((skill) => {
            if (!allSkills.includes(skill)) {
              allSkills.push(skill);
            }
          });
        }

        allSkills = allSkills
          .map((s) => s.replace("Extracted: ", "").trim())
          .filter(Boolean);

        if (allSkills.length === 0) {
          setError("No skills available for job search");
          return;
        }

        const params = new URLSearchParams();

        // 1️⃣ Try recommender titles first (resume upload)
        if (
          parsedResumeData?.recommendedJobs &&
          parsedResumeData.recommendedJobs.length > 0
        ) {
          parsedResumeData.recommendedJobs.slice(0, 5).forEach((job) => {
            if (job?.title) {
              params.append("job_titles", job.title);
            }
          });
        }

        // 2️⃣ Fallback to skills (manual search)
        if (!params.toString()) {
          parsedResumeData?.extractedInfo?.Skills?.slice(0, 5).forEach(
            (skill) => {
              if (typeof skill === "string") {
                params.append("job_titles", skill);
              }
            },
          );
        }

        // 3️⃣ Absolute safety check (prevents 422)
        if (!params.toString()) {
          setError("No job titles or skills available for search");
          return;
        }

        console.log("QUERY STRING:", params.toString());

        const response = await fetch(
          `http://localhost:5000/jobs/search?${params.toString()}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch jobs");
        }

        const data = await response.json();
        const formattedJobs = data.jobs.map((job) => {
          const description = (job.description || "").toLowerCase();

          // ✅ calculate matching skills properly
          // ✅ calculate matching skills per job
          const matchingSkills = allSkills.filter((skill) =>
            description.includes(skill.toLowerCase()),
          );

          // ✅ count ONLY job-related words (job-specific denominator)
          const jobWords = new Set(description.split(/\W+/)).size;

          // ✅ job-specific normalized score
          const skillMatchScore =
            matchingSkills.length > 0
              ? Math.round((matchingSkills.length / jobWords) * 300)
              : 0;

          return {
            ...job,
            matching_skills: matchingSkills,
            skill_match_score: skillMatchScore,
            created_at: new Date(job.created_at).toLocaleDateString(),
          };
        });

        // ✅ SORT JOBS BY SKILL MATCH (HIGH → LOW)
        formattedJobs.sort((a, b) => b.skill_match_score - a.skill_match_score);

        setJobs(formattedJobs);
        setTotalResults(data.count);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [userEmail, navigate]);

  const totalPages = Math.ceil(jobs.length / ITEMS_PER_PAGE);
  console.log(jobs);
  const currentJobs = jobs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
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
        </div>
      )}

      <h2>Matching Jobs</h2>
      <div className="total-results">
        Found {jobs.length} matching positions out of {totalResults} total jobs
      </div>
      <div className="job-list">
        <div>{console.log("Job-list dikhri")}</div>
        <div>{console.log(currentJobs)}</div>
        {currentJobs.length > 0 ? (
          currentJobs.map((job, index) => (
            <div key={index} className="job-card">
              <div className="job-header">
                <h3>{job.title}</h3>
                <div className="job-meta">
                  <span className="job-category">{job.category}</span>
                  <span className="skill-match-score">
                    Skill Match: {job.skill_match_score ?? 0}%
                  </span>
                  {/* <span className="matched-skill">
                    Matched via: {job.matched_skill}
                  </span> */}
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
              <div>{console.log("dabba dikh gaya")}</div>
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

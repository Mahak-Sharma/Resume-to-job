# Resume-to-Job Matcher

A modern web application that helps job seekers find matching opportunities by analyzing their resumes and matching them with relevant job listings.

## Features

- **Resume Upload & Analysis**
  - Support for PDF, DOC, DOCX, and TXT formats
  - Automatic skill extraction using AI and NLP
  - Secure file storage in AWS S3
  - Real-time upload progress tracking

- **Smart Skill Management**
  - Categorized skill selection interface
  - Pre-defined skill categories:
    - Software Development
    - Database Management
    - Cloud Computing
    - Data Science
  - Custom skill addition capability
  - Extracted skills from resume integration

- **Job Matching**
  - Real-time job matching based on resume content
  - Skill-based job recommendations
  - Historical job search tracking
  - Personalized job suggestions

- **User Management**
  - User authentication system
  - Session management
  - Secure login/logout functionality
  - User history tracking

## Tech Stack

- **Frontend**
  - React.js
  - React Router for navigation
  - Axios for API requests
  - Modern CSS styling

- **Backend Infrastructure**
  - AWS Lambda Functions
    - User authentication (login/signup)
    - Resume processing
    - Job matching algorithms
  - AWS API Gateway
    - RESTful API endpoints
    - Request/response handling
    - API security
  - AWS S3
    - Secure resume storage
    - File management
  - Amazon DynamoDB
    - User data storage
    - Session management
    - Application state persistence

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- AWS account (for backend services)
- Local resume parser service running on port 5000

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd Resume_To_Job_Matcher
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   REACT_APP_API_ENDPOINT=https://daapx8kxod.execute-api.us-east-1.amazonaws.com/PROD
   ```

4. Start the development server:
   ```bash
   npm start
   ```

### Running the Resume Parser Service

1. Navigate to the resume parser service directory
2. Install dependencies
3. Start the service:
   ```bash
   npm start
   ```

## Usage

1. **Upload Resume**
   - Click on the upload section or drag and drop your resume
   - Supported formats: PDF, DOC, DOCX, TXT
   - Wait for the upload and analysis to complete

2. **Select Skills**
   - Browse through predefined skill categories
   - Select relevant skills from each category
   - Add custom skills if needed
   - View and manage selected skills

3. **Find Jobs**
   - Click "Search Jobs" to find matching opportunities
   - View recommended jobs based on your resume and selected skills
   - Access your search history through the History page

## API Endpoints

- `POST /Upload` - Upload resume to S3
- `POST /GetResume` - Retrieve user's resume
- `POST /upload-resume` - Parse resume content (local service)

## Future Enhancements

The following features are planned for future releases:

1. **Enhanced Authentication**
   - Integration with Amazon Cognito
   - Google OAuth authentication
   - Multi-factor authentication support

2. **Advanced Job Matching**
   - Experience-based job recommendations
   - Entry-level positions for freshers
   - Internship opportunities
   - Industry-specific job listings

3. **Application Tracking**
   - Track applied job positions
   - Application status monitoring
   - Interview scheduling integration
   - Application history analytics

4. **User Experience Improvements**
   - Personalized dashboard
   - Job application analytics
   - Skill development recommendations
   - Career path suggestions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- AWS for cloud infrastructure
- React community for frontend framework
- All contributors who have helped shape this project

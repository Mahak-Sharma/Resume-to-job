import re
import spacy
from utils.spacy_model import load_spacy_model
import pandas as pd
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import string
import os

# Download NLTK resources if not present
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)
try:
    # Also download punkt_tab resource to fix the error
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt', quiet=True)

# Load the spaCy NLP model for text processing
print("Loading NLP models...")
nlp = load_spacy_model()
stop_words = set(stopwords.words('english'))

# Initialize additional skill lists
TECH_KEYWORDS = [
    'python', 'java', 'javascript', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'typescript',
    'html', 'css', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'oracle', 'redis',
    'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'hibernate',
    'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'jenkins', 'terraform',
    'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'agile', 'scrum', 'kanban',
    'linux', 'unix', 'windows', 'macos', 'android', 'ios', 'rest', 'graphql', 'api',
    'machine learning', 'deep learning', 'ai', 'artificial intelligence', 'data science',
    'hadoop', 'spark', 'tableau', 'power bi', 'excel', 'word', 'powerpoint', 'photoshop',
    'illustrator', 'sketch', 'figma', 'ui', 'ux', 'seo', 'automation', 'testing'
]

# Let's add education-related keywords to help extract education info
EDUCATION_KEYWORDS = [
    'bachelor', 'b.tech', 'b.e.', 'btech', 'be', 'bs', 'b.s.',
    'master', 'm.tech', 'mtech', 'ms', 'm.s.', 'mba', 'phd',
    'engineering', 'computer science', 'information technology',
    'university', 'college', 'institute', 'school',
    'graduate', 'undergraduate', 'postgraduate',
    'degree', 'diploma', 'certification'
]

def preprocess_text(text):
    """
    Clean and preprocess text for better extraction
    
    Args:
        text: Raw text to process
        
    Returns:
        Cleaned and normalized text
    """
    # Remove punctuation
    text = re.sub(r'[^\w\s]', ' ', text)
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def extract_batch_year(text):
    """
    Extract the graduation/batch year from resume text using regex patterns
    
    Args:
        text: The resume text to extract from
        
    Returns:
        Extracted batch year or None if not found
    """
    # Common education year patterns
    patterns = [
        r'batch of (20\d{2})',  # "batch of 2023"
        r'class of (20\d{2})',  # "class of 2023"
        r'(20\d{2})\s*graduate',  # "2023 graduate"
        r'graduating\s*in\s*(20\d{2})',  # "graduating in 2023"
        r'expected graduation:?\s*(20\d{2})',  # "expected graduation: 2023"
        r'graduation year:?\s*(20\d{2})',  # "graduation year: 2023"
        r'b\.?tech\.?\s*\(?\s*(20\d{2})',  # "B.Tech (2023"
        r'b\.?e\.?\s*\(?\s*(20\d{2})',  # "B.E (2023"
        r'completed in (20\d{2})',  # "completed in 2023"
        r'passed.{1,20}?(20\d{2})',  # "passed out in 2023"
        r'degree.{1,30}?(20\d{2})',  # "degree in 2023"
        r'education.{1,50}?(20\d{2})',  # education section with year
        # Additional patterns for OCR text which might have errors
        r'graduated.{1,20}(20\d{2})',  # "graduated in 2023"
        r'passing.{1,20}(20\d{2})',   # "passing year 2023"
        r'\b(20\d{2})\b'  # fallback: any 4 digit year starting with 20
    ]
    
    # Try each pattern in sequence until a match is found
    for pattern in patterns:
        match = re.search(pattern, text.lower(), re.IGNORECASE)
        if match:
            return match.group(1)
    
    # Look for education section with years
    education_section = get_section_text(text, "EDUCATION")
    if education_section:
        # Find all years in the education section
        years = re.findall(r'\b(20\d{2})\b', education_section)
        if years:
            # Return the most recent year (assuming it's the graduation year)
            return max(years)
    
    return None

def extract_skills(text):
    """
    Extract skills from resume text using pattern matching and NLP techniques
    
    Args:
        text: The resume text to extract skills from
        
    Returns:
        List of identified skills
    """
    # Additional technical skills to supplement the main skills database
    ADDITIONAL_SKILLS = [
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Terraform',
        'Flask', 'Django', 'FastAPI', 'Spring Boot', 'Express.js', 'Vue.js',
        'Angular', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy',
        'Redux', 'GraphQL', 'TypeScript', 'Sass', 'Less', 'Webpack', 'Babel',
        'Jest', 'Mocha', 'Selenium', 'Cypress', 'JUnit', 'Maven', 'Gradle',
        'Redis', 'PostgreSQL', 'MySQL', 'Oracle', 'ElasticSearch', 'Kafka',
        'RabbitMQ', 'Microservices', 'RESTful APIs', 'SOAP', 'OAuth',
        'JWT', 'LDAP', 'Active Directory', 'Nginx', 'Apache', 'Linux',
        'Bash', 'PowerShell', 'Ansible', 'Puppet', 'Chef', 'Prometheus',
        'Grafana', 'ELK Stack', 'Tableau', 'Power BI', 'Looker'
    ]

    # Base skills database
    SKILLS_DB = ['3D Design', '3D Graphics', '3D Mathematics', '3D Modeling', '3D Modeling Tools', '3D Programming', 'Adobe Creative Suite', 'Agile Methodology', 'Ai', 'Ajax', 'Algorithms', 'Animation', 'Animation Software', 'Apis', 'App Distribution Process', 'Application Frameworks', 'Ar Toolkits', 'Assembly Language', 'Audio Editing Software', 'Auditory Aesthetics', 'Back-End Programming', 'Big Data', 'Blockchain Technology', 'Branding', 'Bus Communications', 'Business Acumen', 'C', 'C#', 'C++', 'Cad', 'Ci/Cd', 'Cloud Platforms', 'Cloud Security', 'Code Efficiency', 'Color Theory', 'Command Line', 'Consensus Methods', 'Consistency', 'Containerization', 'Content Organization', 'Content Strategy', 'Copywriting', 'Cross-Browser Compatibility', 'Cross-Functional Collaboration', 'Cryptography', 'Css', 'Css Pre-Processors', 'Customer Journey Mapping', 'Cyber Security', 'Data Analysis', 'Data Backup And Recovery', 'Data Modeling', 'Data Science', 'Data Structures', 'Data Visualization', 'Data Warehousing', 'Database Design Principles', 'Database Management', 'Database Performance', 'Database Security Principles', 'Database Structures', 'Database Systems', 'Databases', 'Debugging', 'Deep Learning', 'Design Systems', 'Devops Practices', 'Distributed Computing', 'Embedded C/C++', 'Embedded Systems', 'Emerging Technology Familiarity', 'Ergonomic Design', 'Etl Processes', 'Front-End Frameworks', 'Game Design Principles', 'Game Distribution Platforms', 'Game Mechanics', 'Game Physics', 'Game Testing And Debugging', 'Git', 'Go', 'Graphic Design', 'Graphics Programming', 'Hardware Architecture', 'Hardware Tools', 'High-Performance Computing', 'Html', 'Incident Management', 'Incident Response', 'Infrastructure As Code (Iac)', 'Java', 'Javascript', 'Javascript Frameworks', 'Jquery', 'Kotlin', 'Lighting', 'Machine Learning', 'Market Research', 'Material Knowledge', 'Mathematics', 'Microcontroller Programming', 'Mobile App Lifecycle', 'Mobile App Security', 'Mobile Sdks', 'Mobile Ui/Ux', 'Mongodb', 'Monitoring And Alerting Tools', 'Multiplayer Network Programming', 'Multithreading', 'Network Configuration', 'Network Programming', 'Networking', 'Node.Js', 'Nosql Databases', 'Operating Systems', 'Orchestration', 'P2P Networks', 'Package Managers', 'Print Design', 'Product Design', 'Prototyping', 'Prototyping Tools', 'Python', 'R', 'React Native', 'Reactjs', 'Real-Time Operating Systems', 'Recording Equipment', 'Responsive Design', 'Restful Apis', 'Rtos', 'Ruby', 'Schema Design', 'Seo Basics', 'Server Architecture', 'Server-Side Frameworks', 'Serverless Architecture', 'Service Design', 'Smart Contract Development', 'Software Proficiency', 'Software Testing', 'Solidity', 'Sound Design', 'Spatial Audio', 'Spatial Design', 'Spatial Understanding', 'Sql', 'Statistical Analysis', 'Storyboarding', 'Storytelling', 'Surveys', 'Swift', 'System Administration', 'System Architecture', 'Taxonomy Development', 'Testing And Qa', 'Texture Mapping', 'Timing', 'Typography', 'Unity & Unreal Engine', 'Unix/Linux Environments', 'Usability Testing', 'User Empathy', 'User Experience Design', 'User Interface Design', 'User Interviews', 'User Personas', 'User Research', 'User Testing', 'User-Centered Design', 'Ux Design Principles', 'Ux Research', 'Version Control', 'Video Editing', 'Vr And Ar Sdks', 'Vr Platform Knowledge', 'Web Accessibility', 'Web Security', 'Wireframing']
    # Combine all skills into one comprehensive database
    SKILLS_DB = SKILLS_DB + ADDITIONAL_SKILLS  
    
    # Set to store found skills (prevents duplicates)
    found_skills = set()
    
    # Prepare a list of skills in lower case for matching
    skills_lower = [skill.lower() for skill in SKILLS_DB]
    skills_dict = {skill.lower(): skill for skill in SKILLS_DB}
    
    # Preprocess text for better matching
    text_normalized = preprocess_text(text)
    
    # APPROACH 1: Extract skills using word tokenization
    # This helps with OCR text which might have spacing issues
    tokens = word_tokenize(text_normalized)
    
    # Check for single-word skills
    for token in tokens:
        if token.lower() in skills_dict and token.lower() not in stop_words:
            found_skills.add(skills_dict[token.lower()])
    
    # Check for multi-word skills (bigrams, trigrams)
    for i in range(len(tokens)):
        # Check bigrams (2-word phrases)
        if i < len(tokens) - 1:
            bigram = tokens[i] + ' ' + tokens[i+1]
            if bigram.lower() in skills_dict:
                found_skills.add(skills_dict[bigram.lower()])
                
        # Check trigrams (3-word phrases)
        if i < len(tokens) - 2:
            trigram = tokens[i] + ' ' + tokens[i+1] + ' ' + tokens[i+2]
            if trigram.lower() in skills_dict:
                found_skills.add(skills_dict[trigram.lower()])
    
    # APPROACH 2: Use regular expressions with word boundaries
    # This helps find skills that are distinct words
    text_lower = text.lower()
    for skill, original in skills_dict.items():
        # Skip single-character skills (too many false positives)
        if len(skill) <= 1:
            continue
            
        # For skills that are common words, only match if they are distinct
        if len(skill) <= 3 or skill in stop_words:
            try:
                # Use word boundary to ensure it's a complete word
                pattern = r'\b' + re.escape(skill) + r'\b'
                if re.search(pattern, text_lower):
                    found_skills.add(original)
            except:
                # Skip if regex fails
                continue
        else:
            # For technical terms, direct matching is usually fine
            if skill in text_lower:
                found_skills.add(original)
                
    # APPROACH 3: Look for technical keywords specific to OCR text
    # OCR might introduce errors in exact matches, so use fuzzy matching for key technologies
    for keyword in TECH_KEYWORDS:
        # Simplified matching for OCR errors
        variations = [
            keyword,
            keyword.replace(' ', ''),  # remove spaces
            keyword.replace('-', ''),  # remove hyphens
            keyword.replace('.', '')   # remove periods
        ]
        
        for var in variations:
            if var in text_lower:
                # Map back to a skill in our database if possible
                for skill, original in skills_dict.items():
                    if var in skill.lower() or skill.lower() in var:
                        found_skills.add(original)
                        break
    
    # APPROACH 4: Use NLP for entity recognition
    # This can help identify technology mentions that might be missed
    try:
        doc = nlp(text)
        
        # Extract entities that might be technologies
        for ent in doc.ents:
            if ent.label_ in ['PRODUCT', 'ORG', 'GPE']:
                ent_text = ent.text.lower()
                
                # Check if this entity matches any known skill
                for skill, original in skills_dict.items():
                    if skill == ent_text or skill in ent_text or ent_text in skill:
                        found_skills.add(original)
    except:
        # Continue if NLP processing fails
        pass

    # Return unique skills sorted alphabetically
    return sorted(list(found_skills))

def extract_experience(text):
    """
    Extract years of work experience from resume text
    
    Args:
        text: The resume text to extract from
        
    Returns:
        Number of years of experience, or 0 if not found
    """
    # Look for patterns like "5 years" or "5+ years"
    exp_match = re.search(r'(\d+)\+?\s*(years|yrs)', text, re.IGNORECASE)
    if exp_match:
        return int(exp_match.group(1))
        
    # Check for "fresher" indication
    if "fresher" in text.lower():
        return 0
        
    return 0

def get_section_text(text, section_name):
    """
    Extract text from a specific section of the resume
    
    Args:
        text: The full resume text
        section_name: The section to extract (e.g., 'EDUCATION', 'SKILLS')
        
    Returns:
        The text content of the specified section, or empty string if not found
    """
    # Pattern to match from section heading to the next heading or end of text
    pattern = rf"{section_name}(.*?)(?=\n[A-Z][A-Z ]+\n|$)"
    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1)
    
    # Try alternative section headings for common sections
    alternatives = {
        'EDUCATION': ['ACADEMIC BACKGROUND', 'EDUCATIONAL QUALIFICATIONS', 'EDUCATION DETAILS', 'QUALIFICATION'],
        'SKILLS': ['TECHNICAL SKILLS', 'CORE COMPETENCIES', 'TECHNOLOGIES', 'SKILL SET', 'PROGRAMMING'],
        'EXPERIENCE': ['WORK EXPERIENCE', 'PROFESSIONAL EXPERIENCE', 'WORK HISTORY', 'EMPLOYMENT']
    }
    
    if section_name in alternatives:
        for alt in alternatives[section_name]:
            pattern = rf"{alt}(.*?)(?=\n[A-Z][A-Z ]+\n|$)"
            match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
            if match:
                return match.group(1)
    
    return ""

def process_resume(text):
    """
    Main function to process a resume and extract key information
    
    Args:
        text: The full resume text
        
    Returns:
        Dictionary with extracted information
    """
    print("\n--- Starting resume analysis ---")
    
    # Handle potential empty or invalid text
    if not text or len(text.strip()) < 10:
        print("Error: Text is too short or empty")
        return {'Skills': [], 'Batch Year': None}
        
    # Save the extracted text for debugging
    try:
        os.makedirs('output/debug', exist_ok=True)
        with open('output/debug/extracted_text.txt', 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"Saved extracted text to output/debug/extracted_text.txt")
    except:
        pass
    
    # Extract text from specific sections if they exist
    skills_section = get_section_text(text, "SKILLS")
    education_section = get_section_text(text, "EDUCATION")
    
    print(f"Found skills section: {'Yes' if skills_section else 'No'}")
    print(f"Found education section: {'Yes' if education_section else 'No'}")

    # Extract skills from the skills section or the entire text if section not found
    skills = extract_skills(skills_section if skills_section else text)
    print(f"Extracted {len(skills)} skills")
    
    # Extract batch year
    batch_year = extract_batch_year(education_section if education_section else text)
    print(f"Extracted batch year: {batch_year}")
    
    # Extract experience
    experience = extract_experience(text)
    
    # Build and return the extracted information
    result = {
        'Batch Year': batch_year,
        'Skills': skills,
        'Experience': experience
    }
    
    print("--- Resume analysis completed ---")
    return result

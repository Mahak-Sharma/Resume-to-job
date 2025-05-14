"""def recommend_jobs(skills, experience):
    JOB_ROLES = {
        'Data Scientist': ['Python', 'Machine Learning', 'Data Analysis', 'SQL'],
        'Backend Developer': ['Python', 'Django', 'Flask', 'SQL'],
        'Frontend Developer': ['React', 'HTML', 'CSS', 'JavaScript'],
        'Cloud Engineer': ['AWS', 'Azure', 'GCP', 'DevOps'],
        'NLP Engineer': ['NLP', 'Python', 'Deep Learning'],
    }

    recommendations = []
    for role, required_skills in JOB_ROLES.items():
        match_count = len(set(skills).intersection(set(required_skills)))
        if match_count >= 1:
            recommendations.append((role, match_count))
    
    recommendations = sorted(recommendations, key=lambda x: x[1], reverse=True)
    return [role for role, _ in recommendations[:5]]

"""

import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

def recommend_jobs(user_skills, df, top_n=10):
    """
    Recommend jobs based on user skills using cosine similarity
    
    Args:
        user_skills: List of user skills extracted from resume
        df: DataFrame containing job title and required skills
        top_n: Number of top recommendations to return
        
    Returns:
        List of dicts with job title and matching skills
    """
    # Filter out invalid job titles
    invalid_job_titles = ["No additional information found", "No additional information"]
    
    # Create a filtered dataframe without invalid job titles
    filtered_df = df[~df['job_title'].isin(invalid_job_titles)].copy()
    
    # If no skills found, return empty list
    if not user_skills:
        return []
    
    # Convert user skills to a single string for vectorization
    user_skills_text = ' '.join(user_skills).lower()
    
    # Process job skills from the dataset
    job_skills_texts = []
    job_titles = []
    all_skills_lists = []
    
    for _, row in filtered_df.iterrows():
        # Process skills string into a list
        if isinstance(row['skills'], str):
            job_skills_str = row['skills'].replace('"', '')
            job_skills = [skill.strip() for skill in job_skills_str.split(',')]
        else:
            job_skills = row['skills']
        
        # Convert to lowercase for better matching
        job_skills = [skill.lower() for skill in job_skills]
        
        # Store the job title and skills
        job_titles.append(row['job_title'])
        job_skills_text = ' '.join(job_skills)
        job_skills_texts.append(job_skills_text)
        all_skills_lists.append(job_skills)
    
    # Use ML approach: Convert skills to vectors using CountVectorizer
    # This creates a document-term matrix where each skill is a feature
    vectorizer = CountVectorizer()
    
    # Combine user skills and job skills for vectorization
    all_texts = [user_skills_text] + job_skills_texts
    
    # Transform skills into a numerical matrix
    try:
        # Fit and transform the vectorizer on all skill texts
        skills_matrix = vectorizer.fit_transform(all_texts)
        
        # User skills vector is the first row in the matrix
        user_vector = skills_matrix[0]
        
        # Job skills vectors are the remaining rows
        job_vectors = skills_matrix[1:]
        
        # Calculate cosine similarity between user skills and each job's skills
        # Cosine similarity measures the angle between vectors, giving a score from 0-1
        # Higher values indicate greater similarity
        similarities = cosine_similarity(user_vector, job_vectors).flatten()
        
        # Create recommendations with similarity scores
        recommendations = []
        for i, similarity in enumerate(similarities):
            # Only include if there's some similarity
            if similarity > 0:
                # Extract matching skills
                user_skills_set = set(user_skills_text.split())
                job_skills_set = set(job_skills_texts[i].split())
                matching_skills = list(user_skills_set.intersection(job_skills_set))
                
                # Create recommendation entry
                recommendations.append({
                    'title': job_titles[i],
                    'similarity_score': round(float(similarity) * 100, 2),  # Convert to percentage
                    'matching_skills': matching_skills
                })
        
        # Sort by similarity score (highest first)
        recommendations = sorted(recommendations, key=lambda x: x['similarity_score'], reverse=True)
        
        return recommendations[:top_n]
    
    except Exception as e:
        # Fallback to a simpler approach if vectorization fails
        print(f"Warning: Cosine similarity calculation failed: {str(e)}")
        print("Using fallback matching method")
        
        # Simple fallback matching
        recommendations = []
        user_skills_set = set([s.lower() for s in user_skills])
        
        for i, job_skills in enumerate(all_skills_lists):
            job_skills_set = set([s.lower() for s in job_skills])
            matching_skills = list(user_skills_set.intersection(job_skills_set))
            
            if len(matching_skills) > 0:
                # Calculate simple match ratio
                match_ratio = len(matching_skills) / max(len(user_skills_set), len(job_skills_set))
                
                recommendations.append({
                    'title': job_titles[i],
                    'similarity_score': round(match_ratio * 100, 2),
                    'matching_skills': matching_skills
                })
        
        # Sort by match ratio
        recommendations = sorted(recommendations, key=lambda x: x['similarity_score'], reverse=True)
        
        return recommendations[:top_n]

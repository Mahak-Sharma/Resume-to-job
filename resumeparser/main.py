import os
import json
from utils.pdf_reader import extract_text_from_pdf
from utils.image_reader import extract_text_from_image
from utils.extractor import process_resume
from utils.recommender import recommend_jobs
import pandas as pd
import re

def main():
    """
    Main function to run the resume parser and job recommender
    This function:
    1. Takes a resume file (PDF or image)
    2. Extracts text using OCR or PDF parsing
    3. Analyzes the text to extract skills and education details
    4. Uses ML-based cosine similarity to recommend matching jobs
    """
    print("\n" + "="*50)
    print("RESUME PARSER AND JOB RECOMMENDER")
    print("="*50)
    
    # Ask user to upload a file (PDF or Image)
    file_path=input("\nEnter the full path of your resume file (.pdf, .jpg, .png): ").strip()
    
    # Remove quotes if user copied path with quotes
    file_path = file_path.strip('"\'')
    
    if not os.path.exists(file_path):
        print("\n❌ File does not exist. Please check the path and try again.")
        return

    print(f"\n📄 Processing file: {file_path}")
    file_ext = file_path.lower().split('.')[-1]
    
    # Extract text based on file type
    if file_ext == 'pdf':
        print("\n📚 Extracting text from PDF...")
        text = extract_text_from_pdf(file_path)
    elif file_ext in ['jpg', 'jpeg', 'png']:
        print("\n🔍 Extracting text from image using OCR...")
        text = extract_text_from_image(file_path)
    else:
        print("\n❌ Unsupported file format. Please upload PDF or Image only.")
        return

    # Validate text extraction
    if not text:
        print("\n❌ No text could be extracted from the file. Please check the file content.")
        return

    print("\n🧠 Text extraction completed. Processing resume...")
    
    try:
        # Load job skills dataset
        print("\n📊 Loading job database...")
        df = pd.read_csv("job_skill_dataset.csv")
        
        # Extract information from resume text
        info = process_resume(text)
        
        # Check if any skills were detected
        if not info.get('Skills') or len(info['Skills']) == 0:
            print("\n⚠️ No skills were detected in the resume.")
            print("Please ensure the resume contains clear technical skills or try another file.")
            return
            
        # Use ML-based approach to recommend jobs
        print("\n✨ Applying cosine similarity for job recommendations...")
        recommended_jobs = recommend_jobs(info['Skills'], df)

        # Combine all info for output
        output_data = {
            'Resume File': os.path.basename(file_path),
            'Extracted Info': info,
            'Recommended Jobs': recommended_jobs
        }

        # Save to output folder
        os.makedirs('output', exist_ok=True)
        output_filename = os.path.basename(file_path).replace('.', '_') + '_output.json'
        output_path = os.path.join('output', output_filename)
        with open(output_path, 'w') as f:
            json.dump(output_data, f, indent=4)

        # Print output
        print("\n" + "="*50)
        print("✅ RESUME ANALYSIS RESULTS")
        print("="*50)
        
        print(f"\n📋 SKILLS EXTRACTED: {len(info['Skills'])}")
        print("-" * 20)
        # Print skills in columns
        skills_per_row = 3
        for i in range(0, len(info['Skills']), skills_per_row):
            row = info['Skills'][i:i+skills_per_row]
            print("  ".join([f"• {skill}" for skill in row]))
        
        print(f"\n🎓 EDUCATION")
        print("-" * 20)
        print(f"Graduation Year: {info['Batch Year'] or 'Not detected'}")
        
        # Display ML-based job recommendations
        print(f"\n💼 TOP JOB RECOMMENDATIONS")
        print("-" * 20)
        
        if not recommended_jobs:
            print("No matching jobs found. Please add more skills to your resume.")
        else:
            for i, job in enumerate(recommended_jobs[:7], 1):  # Show top 7 jobs
                print(f"{i}. {job['title']} - {job['similarity_score']}% match")
                if 'matching_skills' in job and job['matching_skills']:
                    print(f"   Matching: {', '.join(job['matching_skills'][:5])}")
                    if len(job['matching_skills']) > 5:
                        print(f"   ...and {len(job['matching_skills']) - 5} more")
                print()
            
        print(f"\n📁 Detailed output saved to: {output_path}")
        print("\n" + "="*50 + "\n")
        
    except Exception as e:
        print(f"\n❌ An error occurred: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()

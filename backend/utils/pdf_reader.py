import pdfplumber
import re
import os
import traceback
from PyPDF2 import PdfReader

def clean_text(text):
    """Clean and normalize text"""
    if not text:
        return ""
    # Replace multiple spaces with single space
    text = re.sub(r'\s+', ' ', text)
    # Replace multiple newlines with single newline
    text = re.sub(r'\n+', '\n', text)
    # Remove special characters but keep periods and commas for better context
    text = re.sub(r'[^\w\s.,\-]', ' ', text)
    return text.strip()

def extract_text_with_pypdf2(pdf_path):
    """Extract text using PyPDF2 as a fallback method"""
    try:
        reader = PdfReader(pdf_path)
        text_chunks = []
        
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_chunks.append(clean_text(text))
                
        return '\n\n'.join(text_chunks)
    except Exception as e:
        print(f"PyPDF2 extraction failed: {str(e)}")
        return ""

def extract_text_with_ocr(pdf_path):
    """Extract text using OCR as a last resort method for scanned PDFs"""
    try:
        # Check if pytesseract is installed
        import importlib.util
        tesseract_spec = importlib.util.find_spec("pytesseract")
        pdf2image_spec = importlib.util.find_spec("pdf2image")
        
        if tesseract_spec is None or pdf2image_spec is None:
            print("OCR extraction requires pytesseract and pdf2image libraries.")
            print("Install with: pip install pytesseract pdf2image")
            print("You also need to install Tesseract OCR on your system.")
            return ""
        
        # Import the required libraries
        import pytesseract
        from pdf2image import convert_from_path
        
        print(f"Attempting OCR extraction on {pdf_path}...")
        
        # Convert PDF pages to images
        images = convert_from_path(pdf_path)
        text_chunks = []
        
        # Extract text from each image using OCR
        for i, img in enumerate(images):
            try:
                text = pytesseract.image_to_string(img)
                if text:
                    text_chunks.append(clean_text(text))
                    print(f"OCR extracted text from page {i+1}")
            except Exception as e:
                print(f"OCR failed on page {i+1}: {str(e)}")
                
        if not text_chunks:
            print("OCR extraction failed to extract any text")
            return ""
            
        return '\n\n'.join(text_chunks)
        
    except Exception as e:
        print(f"OCR extraction failed: {str(e)}")
        return ""

def extract_text_from_pdf(pdf_path, try_ocr=True):
    """Extract text from PDF with improved formatting preservation"""
    try:
        # First check if file exists
        if not os.path.exists(pdf_path):
            print(f"Error: PDF file not found at {pdf_path}")
            return ""
            
        # Check file size - empty or too small files might be corrupt
        file_size = os.path.getsize(pdf_path)
        if file_size < 100:  # Arbitrary small size threshold
            print(f"Warning: PDF file is very small ({file_size} bytes), might be corrupt")
            
        full_text = []
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    try:
                        # Extract text while preserving formatting
                        text = page.extract_text(x_tolerance=3, y_tolerance=3)
                        if text:
                            # Clean the text
                            text = clean_text(text)
                            full_text.append(text)
                    except Exception as e:
                        print(f"Warning: Issue extracting text from page in PDF: {str(e)}")
                        continue
        except Exception as e:
            print(f"Error with pdfplumber: {str(e)}")
            print("Trying fallback method...")

        if not full_text:
            print(f"Warning: No text could be extracted from {pdf_path} with pdfplumber. Trying PyPDF2...")
            fallback_text = extract_text_with_pypdf2(pdf_path)
            if fallback_text:
                print(f"Successfully extracted text using PyPDF2 fallback for {pdf_path}")
                full_text = [fallback_text]
            elif try_ocr:
                print(f"Warning: No text could be extracted with standard methods for {pdf_path}")
                print("This PDF might be scanned/image-based or encrypted. Trying OCR...")
                ocr_text = extract_text_with_ocr(pdf_path)
                if ocr_text:
                    print(f"Successfully extracted text using OCR for {pdf_path}")
                    return ocr_text
                else:
                    print(f"Failed to extract text from {pdf_path} with any method.")
                    return ""
            else:
                print(f"Warning: No text could be extracted from {pdf_path} with any method.")
                return ""
            
        # Join all pages with proper spacing
        final_text = '\n\n'.join(full_text)

        # Add section markers if they don't exist
        sections = ['EDUCATION', 'EXPERIENCE', 'SKILLS', 'PROJECTS']
        for section in sections:
            if section.lower() not in final_text.lower():
                # Look for alternative headings
                alternatives = {
                    'EDUCATION': ['ACADEMIC BACKGROUND', 'EDUCATIONAL QUALIFICATIONS', 'QUALIFICATION', 'DEGREE', 'UNIVERSITY'],
                    'EXPERIENCE': ['WORK HISTORY', 'PROFESSIONAL EXPERIENCE', 'INTERNSHIPS', 'WORK EXPERIENCE', 'EMPLOYMENT'],
                    'SKILLS': ['TECHNICAL SKILLS', 'CORE COMPETENCIES', 'TECHNOLOGIES', 'EXPERTISE', 'PROFICIENCY'],
                    'PROJECTS': ['PROJECT WORK', 'ACADEMIC PROJECTS', 'PERSONAL PROJECTS', 'KEY PROJECTS', 'RESEARCH']
                }
                
                found = False
                for alt in alternatives[section]:
                    if alt.lower() in final_text.lower():
                        found = True
                        break
                
                if not found:
                    # Try to identify section content and add appropriate heading
                    if section == 'EDUCATION' and re.search(r'B\.?Tech|B\.?E\.|M\.?Tech|Bachelor|Master|Ph\.?D|Degree|University|College', final_text, re.IGNORECASE):
                        final_text = f"EDUCATION\n{final_text}"
                    elif section == 'SKILLS' and re.search(r'Python|Java|C\+\+|JavaScript|SQL|Machine Learning|Data|Analysis', final_text, re.IGNORECASE):
                        final_text = f"SKILLS\n{final_text}"
                    elif section == 'EXPERIENCE' and re.search(r'Manager|Engineer|Developer|Designer|Intern|Lead|Director', final_text, re.IGNORECASE):
                        final_text = f"EXPERIENCE\n{final_text}"
                    elif section == 'PROJECTS' and re.search(r'Project|Developed|Created|Built|Implemented', final_text, re.IGNORECASE):
                        final_text = f"PROJECTS\n{final_text}"

        return final_text

    except Exception as e:
        print(f"Error reading PDF {pdf_path}: {str(e)}")
        print(f"Stack trace: {traceback.format_exc()}")
        # Try the fallback method
        print("Attempting to extract with fallback method...")
        fallback_text = extract_text_with_pypdf2(pdf_path)
        if fallback_text:
            print("Fallback extraction successful")
            return fallback_text
        elif try_ocr:
            print("Regular extraction methods failed. Attempting OCR...")
            return extract_text_with_ocr(pdf_path)
        return ""

def debug_pdf_extraction(pdf_path):
    """Function to debug PDF extraction issues"""
    print(f"Debugging PDF extraction for: {pdf_path}")
    try:
        # Check file existence and size
        if not os.path.exists(pdf_path):
            print(f"Error: File does not exist at {pdf_path}")
            return
            
        file_size = os.path.getsize(pdf_path)
        print(f"File size: {file_size} bytes")
        
        # Try different extraction methods
        print("Attempting extraction with pdfplumber...")
        try:
            with pdfplumber.open(pdf_path) as pdf:
                page_count = len(pdf.pages)
                print(f"PDF has {page_count} pages")
                for i, page in enumerate(pdf.pages):
                    try:
                        text = page.extract_text(x_tolerance=3, y_tolerance=3)
                        print(f"Page {i+1}: {'Text extracted successfully' if text else 'No text found'}")
                        if text and len(text) < 100:  # Show brief sample of short text
                            print(f"Sample text: {text[:100]}")
                    except Exception as e:
                        print(f"Error extracting text from page {i+1}: {str(e)}")
        except Exception as e:
            print(f"pdfplumber failed: {str(e)}")
            
        print("\nAttempting extraction with PyPDF2...")
        try:
            reader = PdfReader(pdf_path)
            page_count = len(reader.pages)
            print(f"PDF has {page_count} pages according to PyPDF2")
            for i in range(page_count):
                try:
                    text = reader.pages[i].extract_text()
                    print(f"Page {i+1}: {'Text extracted successfully' if text else 'No text found'}")
                    if text and len(text) < 100:  # Show brief sample of short text
                        print(f"Sample text: {text[:100]}")
                except Exception as e:
                    print(f"Error extracting text from page {i+1}: {str(e)}")
        except Exception as e:
            print(f"PyPDF2 failed: {str(e)}")
            
        return "Debug complete"
    except Exception as e:
        print(f"Debug failed: {str(e)}")
        print(traceback.format_exc())
        return "Debug failed"

# Example usage
# pdf_path = r"D:/ResumeParser/utils/Uploaded_Resumes/Pratiksha Rawat.pdf"
# extract_text_from_pdf(pdf_path)
# print(extract_text_from_pdf(pdf_path))

# Test the problematic PDF file
if __name__ == "__main__":
    problem_pdf = r"D:\ResumeParser\Bright_Kyeremeh_Data_Scientist.pdf"
    print("Debugging problematic PDF file...")
    debug_pdf_extraction(problem_pdf)
    print("\nAttempting text extraction with regular methods...")
    extracted_text = extract_text_from_pdf(problem_pdf)
    if extracted_text:
        print(f"Successfully extracted {len(extracted_text)} characters of text")
        print("First 200 characters of extracted text:")
        print(extracted_text[:200])
    else:
        print("Failed to extract text with regular methods")

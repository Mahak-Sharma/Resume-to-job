from PIL import Image
import pytesseract
import cv2
import numpy as np
import os
import re
import logging
from datetime import datetime

# Set up logging
log_dir = os.path.join('output', 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, f'ocr_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log')
logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def setup_tesseract():
    """Find and set up Tesseract OCR"""
    # Common Tesseract installation paths
    tesseract_paths = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        r"C:\Users\prati\AppData\Local\Programs\Tesseract-OCR\tesseract.exe",
    ]
    
    # Try each path
    for path in tesseract_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            logging.info(f"Using Tesseract at: {path}")
            return True
    
    # Try using tesseract from PATH
    try:
        import subprocess
        result = subprocess.run(['tesseract', '--version'], 
                             stdout=subprocess.PIPE, 
                             stderr=subprocess.PIPE,
                             text=True)
        if 'tesseract' in result.stdout.lower():
            logging.info("Using Tesseract from system PATH")
            return True
    except:
        pass
    
    print("Tesseract OCR not found. Please install it from: https://github.com/UB-Mannheim/tesseract/wiki")
    logging.error("Tesseract OCR not found")
    return False

def preprocess_image(image):
    """Apply optimal preprocessing for resume images"""
    # Convert to numpy array if PIL Image
    if isinstance(image, Image.Image):
        image_np = np.array(image)
        image_cv = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
    else:
        image_cv = image
    
    # Convert to grayscale
    gray = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY) if len(image_cv.shape) == 3 else image_cv
    
    # Resize for optimal OCR
    height, width = gray.shape
    if width < 1000 or height < 1000:
        scale = max(1000 / width, 1000 / height)
        new_width, new_height = int(width * scale), int(height * scale)
        gray = cv2.resize(gray, (new_width, new_height), interpolation=cv2.INTER_CUBIC)
    elif width > 3000 or height > 3000:
        scale = min(3000 / width, 3000 / height)
        new_width, new_height = int(width * scale), int(height * scale)
        gray = cv2.resize(gray, (new_width, new_height), interpolation=cv2.INTER_AREA)
    
    # Apply adaptive thresholding
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY, 11, 2
    )
    
    return thresh

def clean_ocr_text(text):
    """Clean OCR-extracted text"""
    if not text:
        return ""
    
    # Replace common OCR errors
    replacements = {
        '|': 'I', '{': '(', '}': ')', '@': 'a', '$': 'S',
        '0': 'O', '[': '(', ']': ')', '<': '(', '>': ')',
    }
    
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove non-printable characters
    text = ''.join(c for c in text if c.isprintable() or c.isspace())
    
    return text.strip()

def extract_text_from_image(img_path):
    """Extract text from resume image"""
    print(f"\nProcessing image: {img_path}")
    logging.info(f"Starting OCR on: {img_path}")
    
    # Check if file exists
    if not os.path.isfile(img_path):
        print(f"Error: Image file not found at {img_path}")
        logging.error(f"File not found: {img_path}")
        return ""
    
    if not setup_tesseract():
        return ""
    
    try:
        # Load and preprocess image
        image = cv2.imread(img_path)
        if image is None:
            logging.error(f"Failed to load image: {img_path}")
            return ""
        
        # Preprocess image
        processed = preprocess_image(image)
        
        # Save debug image
        debug_dir = "output/debug/images"
        os.makedirs(debug_dir, exist_ok=True)
        cv2.imwrite(os.path.join(debug_dir, "processed.jpg"), processed)
        
        # OCR configurations in order of effectiveness
        ocr_configs = [
            '--oem 3 --psm 6',  # Block of text
            '--oem 3 --psm 3',  # Auto-detect layout
        ]
        
        # Try OCR with different configs
        best_text = ""
        best_length = 0
        
        for config in ocr_configs:
            text = pytesseract.image_to_string(processed, config=config)
            cleaned_text = clean_ocr_text(text)
            
            if len(cleaned_text) > best_length:
                best_text = cleaned_text
                best_length = len(cleaned_text)
        
        if best_text:
            print(f"Successfully extracted text ({best_length} characters)")
            
            # Preview of extracted text
            preview = best_text[:200] + "..." if len(best_text) > 200 else best_text
            print("\nText preview:")
            print("-" * 50)
            print(preview)
            print("-" * 50)
            
            # Save text to debug file
            with open(os.path.join("output/debug", "extracted_text.txt"), "w", encoding="utf-8") as f:
                f.write(best_text)
        else:
            print("Failed to extract text from image")
        
        return best_text
        
    except Exception as e:
        logging.error(f"Error in extract_text_from_image: {str(e)}")
        return ""
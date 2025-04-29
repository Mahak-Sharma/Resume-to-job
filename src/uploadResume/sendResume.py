import requests

# Define the base URL for your Flask application
BASE_URL = "http://localhost:5000"

def generate_presigned_url(file_name):
    """Generate a presigned URL for uploading a file."""
    url = f"{BASE_URL}/generate-presigned-url?file_name={file_name}"
    response = requests.get(url)
    
    if response.status_code == 200:
        return response.json().get("url")
    else:
        print(f"Error generating presigned URL: {response.json()}")
        return None

def upload_file(file_name, file_content):
    """Upload a file using the presigned URL."""
    presigned_url = generate_presigned_url(file_name)
    
    if presigned_url:
        # Upload the file to the presigned URL
        response = requests.put(presigned_url, data=file_content)
        
        if response.status_code == 200:
            print("File uploaded successfully!")
        else:
            print(f"Error uploading file: {response.text}")

if __name__ == "__main__":
    # Specify the file name and content to upload
    file_name = "test.pdf"
    file_content = b"This is a test file content."  # Use bytes for file content

    # Call the upload_file function
    upload_file(file_name, file_content)
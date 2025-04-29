import boto3
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import BadRequest
import time

app = Flask(__name__)
CORS(app)

s3_client = boto3.client(
    's3',
    aws_access_key_id='AKIAVMAOGWNQM3FVTEHV',
    aws_secret_access_key='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',
    region_name='us-east-1'
)

@app.route("/generate-presigned-url", methods=["GET"])
def generate_presigned_url():
    file_name = request.args.get('file_name')
    if not file_name:
        raise BadRequest("file_name query parameter is required.")
    
    print(f"Generating presigned URL for file: {file_name}")
    try:
        url = s3_client.generate_presigned_url(
            'put_object',
            Params={'Bucket': 'users-resume-3', 'Key': file_name},
            ExpiresIn=300
        )
        print(f"Presigned URL generated: {url}")
        return jsonify({"url": url})
    except Exception as e:
        print(f"Error generating presigned URL: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/upload-file", methods=["POST"])
def upload_file():
    file_name = request.form.get('file_name')
    file_content = request.files.get('file_content')

    if not file_name or not file_content:
        raise BadRequest("file_name and file_content are required.")

    print(f"Uploading file: {file_name}")
    try:
        s3_client.put_object(Bucket='users-resume-3', Key=file_name, Body=file_content)
        print(f"File uploaded successfully: {file_name}")
        return jsonify({"message": "File uploaded successfully!"}), 200
    except Exception as e:
        print(f"Error uploading file: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("Starting the Flask application...")
    time.sleep(2)  # Delay before starting the app
    print("Flask application will run on http://localhost:5000")
    app.run(debug=True, host="localhost", port=5000)
from flask import Flask, render_template, request, jsonify, send_from_directory
import os
from PyPDF2 import PdfReader
from werkzeug.utils import secure_filename
import pyttsx3

app = Flask(__name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Initialize pyttsx3 engine
engine = pyttsx3.init()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return process_pdf(filepath, filename)

def process_pdf(filepath, filename):
    pdf_reader = PdfReader(filepath)
    num_pages = len(pdf_reader.pages)
    text = []

    for page_num in range(num_pages):
        page = pdf_reader.pages[page_num]
        text.append(page.extract_text())

    return jsonify({
        "text": text,
        "num_pages": num_pages,
        "file_path": f"/uploads/{filename}"
    })

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True)

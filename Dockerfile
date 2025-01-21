# Use an official Python image as the base
FROM python:3.11-slim

# Install system dependencies for pyttsx3
RUN apt-get update && apt-get install -y espeak

# Set the working directory inside the container
WORKDIR /app

# Copy project files to the container
COPY . /app

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose the default Flask port
EXPOSE 5000

# Command to run the Flask app
CMD ["python", "app.py"]

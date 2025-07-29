# Dockerfile
# Changed base image to Python 3.11 slim to support newer package versions like scipy==1.16.1
FROM python:3.11-slim 

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies required for spaCy, LanguageTool, and building Python packages
# default-jre-headless is for LanguageTool (it will install a compatible JRE for Debian Bookworm/Bullseye)
# build-essential is for compiling some Python packages if they have C extensions
# ADDED 'curl' for debugging purposes inside the container
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    default-jre-headless \
    curl && \
    rm -rf /var/lib/apt/lists/*

# Copy the requirements.txt file and install Python dependencies
# This step is done separately to leverage Docker's build cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code into the container
COPY . .

# Expose the port your Flask app runs on
EXPOSE 5002

# Command to run the application using Gunicorn (PRODUCTION)
# NOTE: The first time this runs, it will download large AI models (spaCy, LanguageTool, SentenceTransformer).
# This process can take several minutes and might appear to hang, but it is working.
# Subsequent starts will be much faster as models will be cached.
CMD ["gunicorn", "--bind", "0.0.0.0:5002", "--workers", "4", "app:app"]
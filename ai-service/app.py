import spacy
from textblob import TextBlob
from flask import Flask, request, jsonify
from flask_cors import CORS
import language_tool_python
from difflib import SequenceMatcher
# New imports for semantic search
import faiss
from sentence_transformers import SentenceTransformer
import numpy as np
import os
import json
# New imports for MongoDB
from pymongo import MongoClient
from bson.objectid import ObjectId # Import ObjectId for MongoDB ID handling
from bson.errors import InvalidId # Import InvalidId for handling bad MongoDB IDs

# NEW IMPORTS FOR AI FEATURES
import textstat # For Readability Score
# Load the spaCy and TextBlob models
nlp = spacy.load("en_core_web_sm")
# Initialize LanguageTool for grammar checking
try:
    grammar_tool = language_tool_python.LanguageTool('en-US')
except Exception as e:
    print(f"Error initializing LanguageTool: {e}")
    grammar_tool = None # Handle case where tool might not initialize

app = Flask(__name__)
CORS(app) # Enable CORS for your frontend

# NEW: Add a root endpoint for a basic health check or welcome message
@app.route('/')
def home():
    return "AI Service is running!" # You can customize this message

# --- New MongoDB Setup ---
MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://shuvokumerraycse10:180114Shuvo@cluster0.0doar1z.mongodb.net/digi-thesis_DB?retryWrites=true&w=majority&appName=Cluster0")
DB_NAME = os.environ.get("DB_NAME", "digi-thesis_DB")
COLLECTION_NAME = os.environ.get("COLLECTION_NAME", "theses")
client = None
db = None

try:
    # ADDED: A 5-second timeout for server selection
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    # The ismaster command is cheap and does not require auth.
    client.admin.command('ismaster')
    db = client[DB_NAME]
    print("Connected to MongoDB successfully.")
except Exception as e:
    print(f"Could not connect to MongoDB. Error: {e}")
    db = None # Ensure db is None if connection fails


# --- AI Search Setup ---
# The model that will convert text to vectors.
search_model = SentenceTransformer('all-MiniLM-L6-v2')
faiss_index = None
thesis_data = [] # Stores metadata like titles, authors, etc.

# Helper function to create and save the FAISS index
def create_and_save_index(documents, metadata_list):
    print("Creating and saving FAISS index...")
    # Generate embeddings for all documents
    embeddings = search_model.encode(documents)
    
    # Ensure embeddings are in float32 format for FAISS
    embeddings = np.array(embeddings).astype('float32')
    
    # The dimensionality of the vectors
    d = embeddings.shape[1]
    
    # Create a FAISS index (IndexFlatL2 is a simple, brute-force index)
    index = faiss.IndexFlatL2(d)
    
    # Add the embeddings to the index
    index.add(embeddings)
    
    # Save the index to a file
    faiss.write_index(index, "thesis_index.faiss")
    
    # Save the corresponding metadata (titles, etc.) to a file
    with open("thesis_metadata.json", "w") as f:
        json.dump(metadata_list, f)
        
    print("FAISS index created and saved successfully.")
    return index

# Helper function to load the FAISS index from a file
def load_index():
    global faiss_index, thesis_data
    if os.path.exists("thesis_index.faiss") and os.path.exists("thesis_metadata.json"):
        print("Loading FAISS index from file...")
        faiss_index = faiss.read_index("thesis_index.faiss")
        with open("thesis_metadata.json", "r") as f:
            thesis_data = json.load(f)
        print("FAISS index loaded.")
        return True
    else:
        print("No existing FAISS index found. Running initial data ingestion.")
        return False

# This is the new function to fetch data from MongoDB
def fetch_data_from_db(include_full_text=False): # Added include_full_text parameter
    if db is None:
        print("MongoDB connection not available. Cannot fetch data.")
        return [], []

    print("Fetching documents from MongoDB...")
    documents = []
    metadata_list = []
    
    try:
        theses_collection = db[COLLECTION_NAME]
        
        print(f"DEBUG: Checking collection: {theses_collection.full_name}")
        total_docs = theses_collection.count_documents({})
        print(f"DEBUG: Found {total_docs} documents in the collection.")
        if total_docs == 0:
            print("DEBUG: No documents found, returning empty lists.")
            return [], []

        # Project only necessary fields. If include_full_text is true, also get 'full_text'
        # For recommendations, getting the abstract is usually sufficient to generate an embedding.
        # However, if 'full_text' offers richer context, you might include it.
        # For now, let's ensure 'abstract' and '_id' are always retrieved for recommendation.
        projection = {'abstract': 1, 'title': 1, 'authorName': 1, '_id': 1}
        if include_full_text:
            projection['full_text'] = 1
            
        db_documents = theses_collection.find({}, projection)
        
        for doc in db_documents:
            text_for_embedding = doc.get('abstract', '')
            if include_full_text and doc.get('full_text'):
                text_for_embedding = doc['full_text']

            if text_for_embedding:
                documents.append(text_for_embedding)
                metadata_list.append({
                    'id': str(doc['_id']),
                    'title': doc.get('title', 'No Title'),
                    'author': doc.get('authorName', 'Unknown Author'),
                    'abstract': doc.get('abstract', '') # Include abstract for display in recommendations
                })
        print(f"Fetched {len(documents)} documents from MongoDB.")
        return documents, metadata_list
    except Exception as e:
        print(f"Error fetching data from MongoDB: {e}")
        return [], []


# This is the updated function to build the initial index using data from the DB
def initial_data_ingestion():
    global faiss_index, thesis_data
    
    # Fetch data from MongoDB instead of using dummy data
    # We use only abstracts for semantic search index to keep it lightweight.
    # For recommendations, abstracts are generally good enough.
    documents, metadata_list = fetch_data_from_db(include_full_text=False)

    if not documents:
        print("No documents found in the database. Cannot build index.")
        return
        
    faiss_index = create_and_save_index(documents, metadata_list)
    thesis_data = metadata_list

# Call this function to build the index on server startup if it doesn't exist
if not load_index():
    initial_data_ingestion()


# Removed: --- Text Preprocessing for Topic Modeling ---


# Define the analysis endpoint (existing)
@app.route('/analyze', methods=['POST'])
def analyze_text():
    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text:
            return jsonify({'error': 'No text provided for analysis.'}), 400

        # --- Keyword Extraction with spaCy ---
        doc = nlp(text)
        keywords = list(set([chunk.text.lower() for chunk in doc.noun_chunks]))

        # --- Summarization and Sentiment Analysis with TextBlob ---
        blob = TextBlob(text)
        summary_sentences = blob.sentences[:3] # Get first 3 sentences for summary
        summary = ' '.join([str(s) for s in summary_sentences])

        sentiment_score = blob.sentiment.polarity
        sentiment = 'Neutral'
        if sentiment_score > 0.1:
            sentiment = 'Positive'
        elif sentiment_score < -0.1:
            sentiment = 'Negative'

        return jsonify({
            'summary': summary,
            'keywords': keywords[:10],
            'sentiment': sentiment
        })

    except Exception as e:
        app.logger.error(f"Error in /analyze endpoint: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error during text analysis.'}), 500

# --- Editorial Assistant (Grammar Checker) Endpoint ---
@app.route('/check-grammar', methods=['POST'])
def check_grammar():
    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text:
            return jsonify({'error': 'No text provided for grammar check.'}), 400

        if not grammar_tool:
            return jsonify({'error': 'Grammar checker not initialized. Please check server logs.'}), 500

        matches = grammar_tool.check(text)
        
        # Format grammar issues for easier consumption by frontend
        grammar_issues = []
        for match in matches:
            grammar_issues.append({
                'message': match.message,
                'replacements': match.replacements,
                'offset': match.offset,
                'length': match.errorLength,
                'ruleId': match.ruleId,
                'context': text[max(0, match.offset - 20):match.offset + match.errorLength + 20] # Show context around the error
            })

        return jsonify({'issues': grammar_issues})

    except Exception as e:
        app.logger.error(f"Error in /check-grammar endpoint: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error during grammar check.'}), 500

# --- Plagiarism Scan (Conceptual) Endpoint ---
@app.route('/check-plagiarism', methods=['POST'])
def check_plagiarism():
    try:
        data = request.get_json()
        text_to_check = data.get('text', '')

        if not text_to_check:
            return jsonify({'error': 'No text provided for plagiarism check.'}), 400

        # --- CONCEPTUAL PLAGIARISM CHECK ---
        known_texts = [
            "The quick brown fox jumps over the lazy dog.",
            "Machine learning is a field of study that gives computers the ability to learn without being explicitly programmed. It is a subset of artificial intelligence.",
            "This thesis explores the application of various machine learning algorithms, including Support Vector Machines and neural networks, to analyze and predict climate patterns. By leveraging historical meteorological data, the study evaluates the performance and accuracy of these models in forecasting temperature fluctuations, precipitation, and extreme weather events. The findings provide insights into the efficacy of AI-driven approaches for environmental science and highlight the potential for improving long-term climate models.",
            "Another unrelated piece of text."
        ]

        highest_similarity = 0
        matched_source = "No significant match found in internal conceptual database."

        for i, known_text in enumerate(known_texts):
            similarity = SequenceMatcher(None, text_to_check.lower(), known_text.lower()).ratio()
            
            if similarity > highest_similarity:
                highest_similarity = similarity
                if similarity > 0.8:
                    matched_source = f"Conceptual internal source #{i+1} (Similarity: {highest_similarity:.2f})"
                
        plagiarism_status = "No Plagiarism Detected (Conceptual)"
        if highest_similarity > 0.7:
            plagiarism_status = "Potential Plagiarism Detected (Conceptual)"
        if highest_similarity > 0.9:
            plagiarism_status = "High Plagiarism Risk (Conceptual)"

        return jsonify({
            'plagiarism_score': round(highest_similarity * 100, 2), # Percentage
            'status': plagiarism_status,
            'matched_source': matched_source,
            'note': 'This is a conceptual plagiarism check for demonstration purposes only. A real plagiarism checker requires a vast database and advanced algorithms.'
        })

    except Exception as e:
        app.logger.error(f"Error in /check-plagiarism endpoint: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error during plagiarism check.'}), 500

# --- New: AI-Powered Semantic Search Endpoint ---
@app.route('/semantic-search', methods=['POST'])
def semantic_search():
    try:
        data = request.get_json()
        query = data.get('query', '')
        top_k = data.get('top_k', 5) # Number of results to return

        if not query:
            return jsonify({'error': 'No query provided.'}), 400
        
        if faiss_index is None:
              return jsonify({'error': 'Search index not initialized. Please check server logs.'}), 500

        # Encode the user's query using the same model
        query_embedding = search_model.encode([query])
        
        # Ensure the query embedding is in float32 format
        query_embedding = np.array(query_embedding).astype('float32')

        # Perform the search on the FAISS index
        # For IndexFlatL2, lower distance means higher similarity
        distances, indices = faiss_index.search(query_embedding, top_k)
        
        # Format the results
        search_results = []
        for i, idx in enumerate(indices[0]):
            document_metadata = thesis_data[idx]
            search_results.append({
                'id': str(document_metadata['id']),
                'title': document_metadata['title'],
                'author': document_metadata['author'],
                'relevance_score': float(distances[0][i])
            })
            
        # Sort by relevance score (lowest distance first)
        search_results.sort(key=lambda x: x['relevance_score'])

        return jsonify({'results': search_results})

    except Exception as e:
        app.logger.error(f"Error in /semantic-search endpoint: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error during semantic search.'}), 500

# --- NEW AI FEATURE: Recommendation System Endpoint ---
@app.route('/recommend-theses', methods=['POST'])
def recommend_theses():
    try:
        data = request.get_json()
        thesis_id = data.get('thesis_id')
        top_k = data.get('top_k', 5) # Number of recommendations to return

        if not thesis_id:
            return jsonify({'error': 'No thesis_id provided for recommendation.'}), 400
        
        if db is None:
            return jsonify({'error': 'MongoDB connection not available. Cannot recommend theses.'}), 500
        
        if faiss_index is None or not thesis_data:
            return jsonify({'error': 'Recommendation index not initialized. Please check server logs.'}), 500

        theses_collection = db[COLLECTION_NAME]
        
        # 1. Fetch the target thesis's content from MongoDB
        try:
            target_thesis = theses_collection.find_one({'_id': ObjectId(thesis_id)}, {'abstract': 1, 'full_text': 1})
        except InvalidId: # Catch specific exception for invalid ID format
            return jsonify({'error': 'Invalid thesis ID format.'}), 400
        except Exception:
            return jsonify({'error': 'Database error when fetching target thesis.'}), 500


        if not target_thesis:
            return jsonify({'error': 'Target thesis not found in the database.'}), 404

        # Prioritize full_text if available, otherwise use abstract for embedding
        target_text = target_thesis.get('full_text') or target_thesis.get('abstract', '')
        
        if not target_text:
            return jsonify({'error': 'Target thesis has no content to generate recommendations.'}), 400

        # 2. Generate embedding for target thesis
        target_embedding = search_model.encode([target_text])
        target_embedding = np.array(target_embedding).astype('float32')

        # 3. Perform search on FAISS index
        # We search for top_k + 1 to account for the possibility of the target thesis itself being in the results
        distances, indices = faiss_index.search(target_embedding, top_k + 1)
        
        recommended_theses = []
        target_mongo_id_str = str(thesis_id) # Convert to string for comparison

        # 4. Format results and filter out the target thesis
        for i, idx in enumerate(indices[0]):
            document_metadata = thesis_data[idx]
            
            # Ensure we don't recommend the thesis itself
            if str(document_metadata['id']) != target_mongo_id_str:
                recommended_theses.append({
                    'id': document_metadata['id'], # Already a string from initial ingestion
                    'title': document_metadata['title'],
                    'author': document_metadata['author'],
                    # FIX: Use .get() here to prevent KeyError if 'abstract' is missing in some metadata entries
                    'abstract': document_metadata.get('abstract', 'No abstract available'), 
                    'similarity_score': float(distances[0][i]) # Lower distance = higher similarity
                })
            
            if len(recommended_theses) >= top_k:
                break
        
        # Sort by similarity score (lowest distance first for IndexFlatL2)
        recommended_theses.sort(key=lambda x: x['similarity_score'])

        return jsonify({'recommendations': recommended_theses})

    except Exception as e:
        app.logger.error(f"Error in /recommend-theses endpoint: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error during recommendation.'}), 500

# --- NEW: Endpoint to fetch a single thesis by ID ---
@app.route('/theses/<string:thesis_id>', methods=['GET'])
def get_thesis_by_id(thesis_id):
    try:
        # --- ADDED LOGGING START ---
        app.logger.info(f"Received request for thesis ID: {thesis_id}")
        if db is None:
            app.logger.error("MongoDB connection object 'db' is None in get_thesis_by_id. This should not happen if connection was successful.")
            return jsonify({'error': 'MongoDB connection not available.'}), 500

        theses_collection = db[COLLECTION_NAME]
        app.logger.info(f"Attempting to query collection: {theses_collection.full_name}")
        # --- ADDED LOGGING END ---
        
        try:
            # Convert the string ID from the URL to a MongoDB ObjectId
            object_id = ObjectId(thesis_id)
            # --- ADDED LOGGING START ---
            app.logger.info(f"Successfully converted ID to ObjectId: {object_id}")
            # --- ADDED LOGGING END ---
        except InvalidId:
            # --- ADDED LOGGING START ---
            app.logger.error(f"Invalid thesis ID format received: {thesis_id}. Returning 400.")
            # --- ADDED LOGGING END ---
            return jsonify({'error': 'Invalid thesis ID format.'}), 400

        # Fetch the document by its _id.
        # Project all necessary fields for the ThesisDetailPage.jsx
        thesis = theses_collection.find_one(
            {'_id': object_id},
            {
                '_id': 1, 
                'title': 1, 
                'authorName': 1, 
                'abstract': 1, 
                'publicationDate': 1, 
                'keywords': 1, 
                'full_text': 1,
                'department': 1,     # Added
                'submissionYear': 1,   # Added
                'status': 1,           # Added
                'analysisStatus': 1,   # Added for AI Analysis Section
                'aiSummary': 1,      # Added for AI Analysis Section
                'aiKeywords': 1,       # Added for AI Analysis Section
                'aiSentiment': 1,      # Added for AI Analysis Section
                'filePath': 1            # Added for Download PDF link
            }
        )
        
        # --- ADDED LOGGING START ---
        if thesis:
            app.logger.info(f"Found thesis with ID {object_id}. Title: {thesis.get('title', 'N/A')}")
        else:
            app.logger.warning(f"find_one returned None for thesis ID: {object_id}. Thesis not found in database for this query.")
        # --- ADDED LOGGING END ---

        if not thesis:
            return jsonify({'error': 'Thesis not found.'}), 404
        
        # Convert ObjectId to string for JSON serialization
        thesis['_id'] = str(thesis['_id'])
        
        return jsonify(thesis)

    except Exception as e:
        app.logger.error(f"An unexpected error occurred in /theses/<id> endpoint for ID {thesis_id}: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error fetching thesis details.'}), 500

# --- NEW AI FEATURE: Readability Score Analysis ---
@app.route('/readability', methods=['POST'])
def get_readability_scores():
    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text:
            return jsonify({'error': 'No text provided for readability analysis.'}), 400

        # Calculate various readability scores
        flesch_reading_ease = textstat.flesch_reading_ease(text)
        flesch_kincaid_grade = textstat.flesch_kincaid_grade(text)
        gunning_fog = textstat.gunning_fog(text)
        smog_index = textstat.smog_index(text)
        automated_readability_index = textstat.automated_readability_index(text)
        dale_chall_readability_score = textstat.dale_chall_readability_score(text)
        
        return jsonify({
            'flesch_reading_ease': flesch_reading_ease,
            'flesch_kincaid_grade': flesch_kincaid_grade,
            'gunning_fog': gunning_fog,
            'smog_index': smog_index,
            'automated_readability_index': automated_readability_index,
            'dale_chall_readability_score': dale_chall_readability_score,
            'note': 'Lower Flesch Reading Ease means harder to read. Other scores represent grade levels.'
        })

    except Exception as e:
        app.logger.error(f"Error in /readability endpoint: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error during readability analysis.'}), 500


# --- NEW AI FEATURE: Automated Tagging / Keyword Suggestion (Conceptual) ---
# This is a conceptual example. In a real scenario, you'd train an ML model.
PREDEFINED_TAGS = {
    "Artificial Intelligence": ["ai", "machine learning", "deep learning", "neural network", "computer vision", "nlp", "natural language processing", "robotics"],
    "Computer Science": ["algorithm", "data structure", "software engineering", "programming", "cybersecurity", "networking", "database"],
    "Engineering": ["electrical engineering", "mechanical engineering", "civil engineering", "aerospace engineering", "materials science", "robotics"],
    "Environmental Science": ["climate change", "sustainability", "ecology", "pollution", "conservation", "renewable energy"],
    "Medical Science": ["medicine", "biology", "biotechnology", "genetics", "pharmaceuticals", "public health", "disease"],
    "Social Science": ["sociology", "psychology", "economics", "political science", "anthropology", "education"],
    "Mathematics": ["algebra", "calculus", "statistics", "geometry", "numerical analysis", "optimization"],
    "Physics": ["quantum physics", "astrophysics", "thermodynamics", "optics", "mechanics"],
    "Chemistry": ["organic chemistry", "inorganic chemistry", "biochemistry", "analytical chemistry", "materials chemistry"]
}

@app.route('/suggest-tags', methods=['POST'])
def suggest_tags():
    try:
        data = request.get_json()
        text = data.get('text', '')

        if not text:
            return jsonify({'error': 'No text provided for tag suggestion.'}), 400

        text_lower = text.lower()
        suggested = []

        for tag, keywords in PREDEFINED_TAGS.items():
            # Check if any of the keywords for a tag are present in the text
            # A more robust approach would use NLP features like TF-IDF or embeddings
            if any(keyword in text_lower for keyword in keywords):
                suggested.append(tag)
        
        if not suggested:
            # If no direct keyword matches, use spaCy to find noun chunks as general tags
            doc = nlp(text)
            fallback_keywords = list(set([chunk.text.lower() for chunk in doc.noun_chunks]))
            # Limit fallback keywords to a reasonable number
            suggested.extend([kw.title() for kw in fallback_keywords[:5] if len(kw) > 2])


        return jsonify({'suggested_tags': suggested})

    except Exception as e:
        app.logger.error(f"Error in /suggest-tags endpoint: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error during tag suggestion.'}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5002))
    app.run(host='0.0.0.0', port=port)
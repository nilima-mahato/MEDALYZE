from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import pandas as pd
import pickle
import joblib
import logging
import os
from pathlib import Path
from textblob import TextBlob
import numpy as np
from datetime import datetime
import re
from werkzeug.exceptions import BadRequest

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

class DiseasePredictor:
    def __init__(self, models_dir="models", data_dir="data"):
        self.models_dir = Path(models_dir)
        self.data_dir = Path(data_dir)
        
        self.disease_model = None
        self.disease_vectorizer = None
        self.label_encoder = None
        self.disease_info = None
        self.model_metadata = None
        
        self.load_models()
        self.load_data()
    
    def load_models(self):
        """Load trained models with error handling"""
        try:
            model_path = self.models_dir / "disease_model.pkl"
            vectorizer_path = self.models_dir / "disease_vectorizer.pkl"
            
            if not model_path.exists() or not vectorizer_path.exists():
                raise FileNotFoundError("Model files not found. Please train the model first.")
            
            self.disease_model = joblib.load(model_path)
            self.disease_vectorizer = joblib.load(vectorizer_path)
            
            # Load label encoder if available
            label_encoder_path = self.models_dir / "label_encoder.pkl"
            if label_encoder_path.exists():
                self.label_encoder = joblib.load(label_encoder_path)
            
            # Load metadata if available
            metadata_path = self.models_dir / "model_metadata.pkl"
            if metadata_path.exists():
                with open(metadata_path, "rb") as f:
                    self.model_metadata = pickle.load(f)
            
            logger.info("✅ Models loaded successfully")
            
        except Exception as e:
            logger.error(f"❌ Error loading models: {str(e)}")
            raise
    
    def load_data(self):
        """Load additional disease information"""
        try:
            med_path = self.data_dir / "med.csv"
            if med_path.exists():
                self.disease_info = pd.read_csv(med_path, encoding="ISO-8859-1")
                logger.info("✅ Disease information data loaded")
            else:
                logger.warning("⚠️ Medical information file not found")
        except Exception as e:
            logger.error(f"❌ Error loading disease info: {str(e)}")
    
    def clean_input(self, text):
        """Clean and preprocess user input"""
        if not text or pd.isna(text):
            return ""
        
        text = str(text).lower().strip()
        
        # Remove special characters but keep spaces
        text = re.sub(r"[^\w\s]", " ", text)
        text = re.sub(r"\s+", " ", text)
        
        # Spell correction with error handling
        try:
            text = str(TextBlob(text).correct())
        except Exception as e:
            logger.warning(f"Spell correction failed: {e}")
        
        return text.strip()
    
    def predict_disease(self, symptoms):
        """Predict disease with confidence scores"""
        try:
            # Clean input
            cleaned_symptoms = self.clean_input(symptoms)
            
            if not cleaned_symptoms:
                raise ValueError("Empty or invalid symptoms provided")
            
            # Transform input
            X = self.disease_vectorizer.transform([cleaned_symptoms])
            
            # Get prediction and probabilities
            predicted_disease = self.disease_model.predict(X)[0]
            probabilities = self.disease_model.predict_proba(X)[0]
            
            # Get top 3 predictions with confidence
            top_indices = np.argsort(probabilities)[-3:][::-1]
            classes = self.disease_model.classes_
            
            predictions = []
            for idx in top_indices:
                predictions.append({
                    'disease': classes[idx],
                    'confidence': float(probabilities[idx])
                })
            
            return {
                'primary_prediction': predicted_disease,
                'confidence': float(max(probabilities)),
                'all_predictions': predictions,
                'cleaned_input': cleaned_symptoms
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            raise
    
    def get_disease_info(self, disease_name):
        """Get additional information about the predicted disease"""
        if self.disease_info is None:
            return {}
        
        try:
            # Case-insensitive search
            info_row = self.disease_info[
                self.disease_info["Disease"].str.lower() == disease_name.lower()
            ]
            
            if info_row.empty:
                # Try partial matching
                info_row = self.disease_info[
                    self.disease_info["Disease"].str.contains(disease_name, case=False, na=False)
                ]
            
            if not info_row.empty:
                row = info_row.iloc[0]
                return {
                    "treatment": row.get("Treatment", "N/A"),
                    "medicinal_composition": row.get("Medicinal Composition", "N/A"),
                    "ingredients_to_avoid": row.get("Ingredients to Avoid", "N/A"),
                    "recommended_diet": row.get("Recommended Diet", "N/A"),
                    "precautionary_measures": row.get("Precautionary Measures", "N/A")
                }
        except Exception as e:
            logger.error(f"Error fetching disease info: {str(e)}")
        
        return {}

# Initialize predictor
try:
    predictor = DiseasePredictor()
except Exception as e:
    logger.error(f"Failed to initialize predictor: {str(e)}")
    predictor = None

@app.route("/")
def home():
    """Home page"""
    return render_template("index.html")

@app.route("/health")
def health_check():
    """Health check endpoint"""
    status = "healthy" if predictor else "unhealthy"
    return jsonify({
        "status": status,
        "timestamp": datetime.now().isoformat(),
        "model_loaded": predictor is not None
    })

@app.route("/model-info")
def model_info():
    """Get model information"""
    if not predictor or not predictor.model_metadata:
        return jsonify({"error": "Model metadata not available"}), 404
    
    return jsonify(predictor.model_metadata)

@app.route("/predict_disease", methods=["POST"])
def predict_disease():
    """Predict disease from symptoms"""
    if not predictor:
        return jsonify({"error": "Model not loaded"}), 500
    
    try:
        # Get data from request
        data = request.get_json(silent=True)
        if not data:
            raise BadRequest("No JSON data provided")
        
        symptom_input = data.get("symptom", "").strip()
        if not symptom_input:
            raise BadRequest("Symptom input is required")
        
        # Validate input length
        if len(symptom_input) > 1000:
            raise BadRequest("Symptom input too long (max 1000 characters)")
        
        # Make prediction
        prediction_result = predictor.predict_disease(symptom_input)
        
        # Get additional disease information
        disease_info = predictor.get_disease_info(prediction_result['primary_prediction'])
        
        # Prepare response
        response = {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "input": {
                "original": symptom_input,
                "cleaned": prediction_result['cleaned_input']
            },
            "prediction": {
                "primary_disease": prediction_result['primary_prediction'],
                "confidence": prediction_result['confidence'],
                "alternative_predictions": prediction_result['all_predictions'][1:],  # Exclude primary
                "confidence_level": get_confidence_level(prediction_result['confidence'])
            },
            "medical_info": disease_info
        }
        
        # Add disclaimer if confidence is low
        if prediction_result['confidence'] < 0.6:
            response["disclaimer"] = "Low confidence prediction. Please consult a healthcare professional."
        
        return jsonify(response)
        
    except BadRequest as e:
        return jsonify({"error": str(e), "success": False}), 400
    except Exception as e:
        logger.error(f"Prediction endpoint error: {str(e)}")
        return jsonify({
            "error": "Internal server error during prediction",
            "success": False
        }), 500

@app.route("/predict_batch", methods=["POST"])
def predict_batch():
    """Predict diseases for multiple symptom inputs"""
    if not predictor:
        return jsonify({"error": "Model not loaded"}), 500
    
    try:
        data = request.get_json(silent=True)
        if not data:
            raise BadRequest("No JSON data provided")
        symptoms_list = data.get("symptoms", [])
        
        if not symptoms_list or len(symptoms_list) > 10:
            raise BadRequest("Provide 1-10 symptom inputs")
        
        results = []
        for i, symptoms in enumerate(symptoms_list):
            try:
                prediction_result = predictor.predict_disease(symptoms)
                results.append({
                    "index": i,
                    "success": True,
                    "prediction": prediction_result['primary_prediction'],
                    "confidence": prediction_result['confidence']
                })
            except Exception as e:
                results.append({
                    "index": i,
                    "success": False,
                    "error": str(e)
                })
        
        return jsonify({
            "success": True,
            "results": results,
            "timestamp": datetime.now().isoformat()
        })
        
    except BadRequest as e:
        return jsonify({"error": str(e), "success": False}), 400
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        return jsonify({"error": "Internal server error", "success": False}), 500

def get_confidence_level(confidence):
    """Convert confidence score to human-readable level"""
    if confidence >= 0.8:
        return "High"
    elif confidence >= 0.6:
        return "Medium"
    elif confidence >= 0.4:
        return "Low"
    else:
        return "Very Low"
    

@app.route("/BMI")
def BMI_Checker():
    return render_template('bmi.html')

@app.route("/Doctor")
def doctor():
    return render_template('doctor.html')


# Load doctors & model
df = pd.read_csv("data/kolkata_doctors_dataset.csv")
model = pickle.load(open("models/doctor_model.pkl", "rb"))
vectorizer = pickle.load(open("models/vectorizer.pkl", "rb"))

@app.route("/api/doctors", methods=["POST"])
def recommend_doctors():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "No JSON data provided"}), 400
    user_input = data.get("symptom", "").lower().strip()
    corrected = str(TextBlob(user_input).correct())

    # If user input matches any known specialties directly
    possible_specialties = df["Specialty"].str.lower().unique()
    if corrected in possible_specialties:
        specialty = corrected
    else:
        # Else use AI to predict from symptom or disease
        X = vectorizer.transform([corrected])
        specialty = model.predict(X)[0]

    # Filter doctors by predicted or matched specialty
    matching = df[df["Specialty"].str.lower().str.strip() == specialty.lower()]
    return jsonify(matching.to_dict(orient="records"))


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    
    # Run with proper configuration
    app.run(
        debug=True,  # Set to False for production
        host="127.0.0.1",
        port=int(os.environ.get("PORT", 5000))
    )
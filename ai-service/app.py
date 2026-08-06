from flask import Flask, request, jsonify
from flask_cors import CORS

import os
import traceback
import torch

from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification
)


# ============================================================
# FLASK CONFIGURATION
# ============================================================

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

EMOTION_MODEL_PATH = os.path.join(
    BASE_DIR,
    "emotion_detection_model"
)

SENTIMENT_MODEL_PATH = os.path.join(
    BASE_DIR,
    "bert_sentiment_model"
)

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)


# ============================================================
# LOAD EMOTION MODEL
# ============================================================

print("=" * 60)
print("Starting Sentio AI Service...")
print("=" * 60)

try:
    print("\nLoading Emotion Detection Model...")

    emotion_tokenizer = AutoTokenizer.from_pretrained(
        EMOTION_MODEL_PATH,
        local_files_only=True
    )

    emotion_model = AutoModelForSequenceClassification.from_pretrained(
        EMOTION_MODEL_PATH,
        local_files_only=True
    )

    emotion_model.to(DEVICE)
    emotion_model.eval()

    print("Emotion Detection Model Loaded Successfully!")

except Exception:
    print("\nFailed to load Emotion Detection Model")
    print("-" * 60)
    traceback.print_exc()
    print("-" * 60)
    raise


# ============================================================
# LOAD SENTIMENT MODEL
# ============================================================

try:
    print("\nLoading Sentiment Analysis Model...")

    sentiment_tokenizer = AutoTokenizer.from_pretrained(
        SENTIMENT_MODEL_PATH,
        local_files_only=True
    )

    sentiment_model = AutoModelForSequenceClassification.from_pretrained(
        SENTIMENT_MODEL_PATH,
        local_files_only=True
    )

    sentiment_model.to(DEVICE)
    sentiment_model.eval()

    print("Sentiment Analysis Model Loaded Successfully!")

except Exception:
    print("\nFailed to load Sentiment Analysis Model")
    print("-" * 60)
    traceback.print_exc()
    print("-" * 60)
    raise


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def validate_text(data):

    if not data:
        return None, "Request body must contain JSON data."

    text = data.get("text")

    if not isinstance(text, str):
        return None, "The 'text' field is required and must be a string."

    text = text.strip()

    if not text:
        return None, "The 'text' field cannot be empty."

    return text, None


def get_predictions(model, tokenizer, text, top_k=3):

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=512
    )

    inputs = {
        key: value.to(DEVICE)
        for key, value in inputs.items()
    }

    with torch.no_grad():
        outputs = model(**inputs)

    probabilities = torch.softmax(
        outputs.logits,
        dim=1
    )[0]

    number_of_labels = probabilities.shape[0]

    top_k = min(
        top_k,
        number_of_labels
    )

    top_probabilities, top_indices = torch.topk(
        probabilities,
        top_k
    )

    predictions = []

    for probability, index in zip(
        top_probabilities.tolist(),
        top_indices.tolist()
    ):

        label = model.config.id2label.get(
            index,
            f"LABEL_{index}"
        )

        predictions.append({
            "label": label,
            "confidence": round(
                probability * 100,
                2
            )
        })

    best_prediction = predictions[0]

    return {
        "label": best_prediction["label"],
        "confidence": best_prediction["confidence"],
        "top_predictions": predictions
    }


# ============================================================
# HOME ROUTE
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "success": True,
        "status": "running",
        "service": "Sentio AI Service",
        "device": str(DEVICE),
        "models": {
            "emotion": "loaded",
            "sentiment": "loaded"
        }
    })


# ============================================================
# HEALTH ROUTE
# ============================================================

@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "success": True,
        "status": "healthy",
        "emotion_model": "loaded",
        "sentiment_model": "loaded"
    })


# ============================================================
# EMOTION PREDICTION
# ============================================================

@app.route(
    "/predict-emotion",
    methods=["POST"]
)
def predict_emotion():

    try:
        data = request.get_json(
            silent=True
        )

        text, error = validate_text(data)

        if error:
            return jsonify({
                "success": False,
                "error": error
            }), 400

        prediction = get_predictions(
            model=emotion_model,
            tokenizer=emotion_tokenizer,
            text=text,
            top_k=3
        )

        return jsonify({
            "success": True,
            "input": {
                "text": text
            },
            "result": {
                "emotion": prediction["label"],
                "confidence": prediction["confidence"],
                "top_predictions": prediction[
                    "top_predictions"
                ]
            }
        })

    except Exception:
        traceback.print_exc()

        return jsonify({
            "success": False,
            "error": "An error occurred while predicting emotion."
        }), 500


# ============================================================
# SENTIMENT PREDICTION
# ============================================================

@app.route(
    "/predict-sentiment",
    methods=["POST"]
)
def predict_sentiment():

    try:
        data = request.get_json(
            silent=True
        )

        text, error = validate_text(data)

        if error:
            return jsonify({
                "success": False,
                "error": error
            }), 400

        prediction = get_predictions(
            model=sentiment_model,
            tokenizer=sentiment_tokenizer,
            text=text,
            top_k=3
        )

        return jsonify({
            "success": True,
            "input": {
                "text": text
            },
            "result": {
                "sentiment": prediction["label"],
                "confidence": prediction["confidence"],
                "top_predictions": prediction[
                    "top_predictions"
                ]
            }
        })

    except Exception:
        traceback.print_exc()

        return jsonify({
            "success": False,
            "error": "An error occurred while predicting sentiment."
        }), 500


# ============================================================
# COMBINED ANALYSIS
# ============================================================

@app.route(
    "/analyze",
    methods=["POST"]
)
def analyze():

    try:
        data = request.get_json(
            silent=True
        )

        if not data:
            return jsonify({
                "success": False,
                "error": "Request body must contain JSON data."
            }), 400

        post_text = data.get(
            "post_text",
            ""
        )

        comment_text = data.get(
            "comment_text",
            ""
        )

        if not isinstance(
            post_text,
            str
        ):
            return jsonify({
                "success": False,
                "error": "'post_text' must be a string."
            }), 400

        if not isinstance(
            comment_text,
            str
        ):
            return jsonify({
                "success": False,
                "error": "'comment_text' must be a string."
            }), 400

        post_text = post_text.strip()
        comment_text = comment_text.strip()

        if not post_text:
            return jsonify({
                "success": False,
                "error": "'post_text' cannot be empty."
            }), 400

        emotion_prediction = get_predictions(
            model=emotion_model,
            tokenizer=emotion_tokenizer,
            text=post_text,
            top_k=3
        )

        if comment_text:
            sentiment_input = comment_text
        else:
            sentiment_input = post_text

        sentiment_prediction = get_predictions(
            model=sentiment_model,
            tokenizer=sentiment_tokenizer,
            text=sentiment_input,
            top_k=3
        )

        return jsonify({
            "success": True,

            "input": {
                "post_text": post_text,
                "comment_text": comment_text
            },

            "emotion_analysis": {
                "emotion": emotion_prediction[
                    "label"
                ],
                "confidence": emotion_prediction[
                    "confidence"
                ],
                "top_predictions": emotion_prediction[
                    "top_predictions"
                ]
            },

            "sentiment_analysis": {
                "sentiment": sentiment_prediction[
                    "label"
                ],
                "confidence": sentiment_prediction[
                    "confidence"
                ],
                "top_predictions": sentiment_prediction[
                    "top_predictions"
                ]
            }
        })

    except Exception:
        traceback.print_exc()

        return jsonify({
            "success": False,
            "error": "An error occurred while analyzing the content."
        }), 500


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    print("\n" + "=" * 60)
    print("Sentio AI Service Started Successfully")
    print("Server: http://127.0.0.1:5000")
    print("Health: http://127.0.0.1:5000/health")
    print("=" * 60)

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
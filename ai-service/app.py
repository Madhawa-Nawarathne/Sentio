from flask import Flask
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import traceback

# ==========================================
# Flask App
# ==========================================

app = Flask(__name__)
CORS(app)

print("=" * 60)
print("Starting Sentio AI Service...")
print("=" * 60)

# ==========================================
# Load Emotion Detection Model
# ==========================================

try:
    print("\nLoading Emotion Detection Model...")

    EMOTION_MODEL_PATH = "./emotion_detection_model"

    emotion_tokenizer = AutoTokenizer.from_pretrained(
        EMOTION_MODEL_PATH,
        local_files_only=True
    )

    emotion_model = AutoModelForSequenceClassification.from_pretrained(
        EMOTION_MODEL_PATH,
        local_files_only=True
    )

    emotion_model.eval()

    print("✅ Emotion Detection Model Loaded Successfully!")

except Exception as e:
    print("\n❌ Failed to load Emotion Detection Model")
    print("-" * 60)
    traceback.print_exc()
    print("-" * 60)
    exit()

# ==========================================
# Load Sentiment Analysis Model
# ==========================================

try:
    print("\nLoading Sentiment Analysis Model...")

    SENTIMENT_MODEL_PATH = "./bert_sentiment_model"

    sentiment_tokenizer = AutoTokenizer.from_pretrained(
        SENTIMENT_MODEL_PATH,
        local_files_only=True
    )

    sentiment_model = AutoModelForSequenceClassification.from_pretrained(
        SENTIMENT_MODEL_PATH,
        local_files_only=True
    )

    sentiment_model.eval()

    print("✅ Sentiment Analysis Model Loaded Successfully!")

except Exception as e:
    print("\n❌ Failed to load Sentiment Analysis Model")
    print("-" * 60)
    traceback.print_exc()
    print("-" * 60)
    exit()

# ==========================================
# Routes
# ==========================================

@app.route("/")
def home():
    return {
        "status": "running",
        "service": "Sentio AI Service",
        "emotion_model": "loaded",
        "sentiment_model": "loaded"
    }

# ==========================================
# Main
# ==========================================

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("🚀 Sentio AI Service Started Successfully")
    print("Server: http://127.0.0.1:5000")
    print("=" * 60)

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
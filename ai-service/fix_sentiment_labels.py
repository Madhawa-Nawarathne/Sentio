import json
from pathlib import Path

MODEL_PATH = Path("./bert_sentiment_model")
CONFIG_PATH = MODEL_PATH / "config.json"

print("Updating sentiment model labels...")

# Read the existing configuration
with open(CONFIG_PATH, "r", encoding="utf-8") as file:
    config = json.load(file)

# Correct mapping confirmed from model testing
config["id2label"] = {
    "0": "Negative",
    "1": "Neutral",
    "2": "Positive"
}

config["label2id"] = {
    "Negative": 0,
    "Neutral": 1,
    "Positive": 2
}

# Save only config.json
with open(CONFIG_PATH, "w", encoding="utf-8") as file:
    json.dump(config, file, indent=2)

print("\n✅ Sentiment labels fixed successfully!")
print("\nUpdated mapping:")
print(config["id2label"])

print("\n✅ Only config.json was updated.")
print("✅ model.safetensors was not modified.")
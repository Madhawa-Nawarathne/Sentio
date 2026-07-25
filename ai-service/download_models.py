import os
import gdown

# Base directory (ai-service)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODELS = {
    "emotion_detection_model": "https://drive.google.com/drive/folders/1H4f1-0FchJ5n-2hSEcvybn3yFEnvZW3q",
    "bert_sentiment_model": "https://drive.google.com/drive/folders/1ZpOf_J0aQvIP1yYgSo5vlpEMVEdvvlhm",
}

print("=" * 60)
print("Downloading Sentio AI Models")
print("=" * 60)

for folder_name, url in MODELS.items():

    output_path = os.path.join(BASE_DIR, folder_name)

    # Skip if already downloaded
    if os.path.exists(output_path) and len(os.listdir(output_path)) > 0:
        print(f"\n✅ {folder_name} already exists.")
        continue

    print(f"\nDownloading {folder_name}...")

    os.makedirs(output_path, exist_ok=True)

    gdown.download_folder(
        url=url,
        output=output_path,
        quiet=False,
        use_cookies=False,
        remaining_ok=True
    )

    print(f"✅ {folder_name} downloaded successfully.")

print("\n" + "=" * 60)
print("All models are ready!")
print("=" * 60)
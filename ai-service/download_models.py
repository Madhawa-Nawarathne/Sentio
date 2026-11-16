import os
import gdown

# Base directory: ai-service
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Only the files required by app.py for inference.
# Training checkpoints such as optimizer.pt, scheduler.pt,
# trainer_state.json, rng_state.pth, and training_args.bin
# are intentionally NOT downloaded.

MODEL_FILES = {
    
    "bert_sentiment_model": {
        "config.json": "18lcQ8FnKWlIyKxZBYITWzqE6SzhyNAy4",
        "model.safetensors": "1_r0MB2-IDLFxE3mYTOOLrk_7UYAfGdRO",
        "tokenizer.json": "159JbD9I257ZCIAjLHca-d2lNqx63EK4Z",
        "tokenizer_config.json": "1QUmHsq7lAkMhxipvoJPh1DW7_tN6NRu-",
    },

    "stress_detection_model": {
        "config.json": "1x2B7WB1AJc6yLkqRAZdV3GsTJOLTYIwM",
        "model.safetensors": "1qgLQdq0-Qrz2MbM5wLV38RQgIn9SDUn3",
        "tokenizer.json": "1jBeiresFYYb5i9f5hJwWNR3cCjSdIlUB",
        "tokenizer_config.json": "1qsY9y2IoIy40rhXKIUmV5k-gWdllH9le",
    },
}


def download_file(file_id, output_path):
    """Download one Google Drive file only when it does not exist."""

    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        print(f"  Already exists: {os.path.basename(output_path)}")
        return

    url = f"https://drive.google.com/uc?id={file_id}"

    print(f"  Downloading: {os.path.basename(output_path)}")

    result = gdown.download(
        url=url,
        output=output_path,
        quiet=False,
        use_cookies=False,
    )

    if result is None:
        raise RuntimeError(
            f"Failed to download: {os.path.basename(output_path)}"
        )


print("=" * 60)
print("Downloading Sentio AI Models")
print("=" * 60)

for model_name, files in MODEL_FILES.items():

    model_dir = os.path.join(BASE_DIR, model_name)

    print(f"\n{model_name}")
    os.makedirs(model_dir, exist_ok=True)

    for filename, file_id in files.items():
        output_path = os.path.join(model_dir, filename)
        download_file(file_id, output_path)

    print(f"✅ {model_name} ready.")

print("\n" + "=" * 60)
print("All inference models are ready!")
print("=" * 60)
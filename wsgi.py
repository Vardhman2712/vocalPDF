from flask import request
from app import app
import os
from google.cloud import texttospeech

@app.route('/speak', methods=['POST'])
def speak():
    text_to_speak = request.json.get('text')
    
    if text_to_speak:
        # Initialize the Google Cloud Text-to-Speech client
        client = texttospeech.TextToSpeechClient()

        # Set the input text
        synthesis_input = texttospeech.SynthesisInput(text=text_to_speak)

        # Configure the voice parameters (language, gender, etc.)
        voice = texttospeech.VoiceSelectionParams(
            language_code="en-US",
            name="en-US-Wavenet-F",  # You can change the voice to suit your needs
        )

        # Audio configuration (audio format: MP3)
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )

        # Synthesize speech
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )

        # Save or stream the audio here, depending on your needs
        return {"message": "Speech synthesis started with Google Cloud"}
    else:
        return {"message": "No text provided"}

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)

from flask import request
from app import app
import os
from gtts import gTTS

@app.route('/speak', methods=['POST'])
def speak():
    text_to_speak = request.json.get('text')
    
    if text_to_speak:
        tts = gTTS(text=text_to_speak, lang="en")
        audio_file = "output.mp3"
        tts.save(audio_file)
        return {"message": "Speech synthesis successful", "audio_file": audio_file}
    
    return {"message": "No text provided"}

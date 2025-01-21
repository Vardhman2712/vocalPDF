from flask import request
from app import app
import os
import pyttsx3

@app.route('/speak', methods=['POST'])
def speak():
    text_to_speak = request.json.get('text')
    
    if text_to_speak:
        engine = pyttsx3.init()
        engine.say(text_to_speak)
        engine.runAndWait()
        return {"message": "Speech synthesis started"}
    else:
        return {"message": "No text provided"}

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

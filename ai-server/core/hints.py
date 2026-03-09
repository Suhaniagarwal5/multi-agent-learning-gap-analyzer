import google.generativeai as genai
import base64
import io
from PIL import Image

# Configure Gemini (Aapki API Key already wahan hai)
genai.configure(api_key="AIzaSyAKvk7d8p-xxSRQNynuGVnmqc1DPCAmNL0")
model = genai.GenerativeModel('gemini-1.5-pro')

def get_level_hint(level, code, problem_title, description, image_data=None):
    # Agar image_data (Lens feature) aa raha hai
    if image_data:
        # Base64 string ko image object mein convert karna
        header, encoded = image_data.split(",", 1)
        data = base64.b64decode(encoded)
        image = Image.open(io.BytesIO(data))
        
        prompt = f"The user is solving '{problem_title}'. Look at this image of their handwritten notes/screen and provide a helpful hint for Level {level} without giving the full solution."
        response = model.generate_content([prompt, image])
        return response.text

    # Standard Text-based Hints (Aapka purana logic)
    if level == 1:
        prompt = f"Problem: {problem_title}. Description: {description}. Give a 1-sentence hint that explains the logic without giving code."
    elif level == 2:
        prompt = f"Generate only Mermaid JS diagram code for the flow of this problem: {description}."
    else:
        prompt = f"Analyze this code and suggest an optimization: {code}"
    
    response = model.generate_content(prompt)
    return response.text
# need to be changed
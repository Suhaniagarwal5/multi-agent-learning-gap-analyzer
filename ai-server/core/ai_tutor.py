import google.generativeai as genai
import base64
import io
import os
import json
from PIL import Image
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

model = genai.GenerativeModel('gemini-2.5-flash')

def get_level_hint(level, code, problem_title, description, image_data=None, voice_query=None):
    # 1. LENS FEATURE
    if image_data:
        header, encoded = image_data.split(",", 1)
        data = base64.b64decode(encoded)
        image = Image.open(io.BytesIO(data))
        prompt = f"The user is solving '{problem_title}'. Look at this image of their screen/notes and provide a helpful hint. Do not give the full code."
        response = model.generate_content([prompt, image])
        return response.text

    # 2. VOICE CONVERSATION WITH ANALYTICS TRACKING
    if voice_query:
        prompt = f"""You are Sutra AI, a highly intelligent coding tutor.
        Problem: {problem_title}
        User's Code: {code}
        User asked verbally: "{voice_query}"
        
        Guidelines:
        1. Respond in natural, conversational English (or Hinglish if appropriate) so the Text-to-Speech sounds human.
        2. DO NOT give direct code answers. Guide them.
        
        Categorize the user's voice query into one of these:
        - "level_1": Asking about problem meaning or boilerplate.
        - "level_2": Asking for logic flow or diagram.
        - "level_3": Asking about errors or optimization.
        - "level_4": Asking for code snippets/structure.
        - "custom": Asking a generic doubt (e.g., "what is a linked list").

        You MUST return EXACTLY a JSON string with this structure:
        {{
            "spoken": "Conversational response to be read out loud (1-2 sentences).",
            "display": "Short 1-line text to show on screen.",
            "category": "level_1" | "level_2" | "level_3" | "level_4" | "custom",
            "custom_topic": "If category is custom, write 1-2 words summarizing the topic (e.g., 'linked list'), else empty string"
        }}"""
        
        response = model.generate_content(prompt)
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        return clean_text

    # 3. STRICT PREDEFINED TEXT HINTS (Button Clicks)
    if level == 1:
        prompt = f"Explain the meaning of the problem '{problem_title}' and what the boilerplate code is doing in 2 short sentences."
    elif level == 2:
        # CHANGED: Step-by-step logic outline instead of Mermaid
        prompt = f"Provide a clear, step-by-step logical flow (like a text-based flowchart or numbered list) to solve this problem: {description}."
    elif level == 3:
        prompt = f"Find any logical errors in this code and suggest an optimization technique: {code}"
    else:
        prompt = f"Provide 2 or 3 short pseudo-code or scaffolded Python snippets to help complete the solution for '{problem_title}'. Do not give the final answer."
    
    response = model.generate_content(prompt)
    return response.text
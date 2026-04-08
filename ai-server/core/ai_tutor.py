import google.generativeai as genai
import base64
import io
import os
import json
from PIL import Image
from dotenv import load_dotenv

# RAG Engine import
from core.rag_engine import ask_sutra_rag

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

    # 2. VOICE CONVERSATION WITH ANALYTICS & SMART RAG ROUTING
    if voice_query:
        prompt = f"""You are Sutra AI, a highly intelligent coding tutor.
        Problem: {problem_title}
        User's Code: {code}
        User asked verbally: "{voice_query}"
        
        Guidelines:
        1. Categorize the user's voice query.
        - "level_1": Asking about problem meaning or boilerplate.
        - "level_2": Asking for logic flow or diagram.
        - "level_3": Asking about errors or optimization in their code.
        - "level_4": Asking for code snippets/structure.
        - "custom": Asking a conceptual doubt (e.g., "what is a linked list", "how does a stack work").

        You MUST return EXACTLY a JSON string with this structure:
        {{
            "spoken": "Conversational response (1-2 sentences). If category is 'custom', leave this empty string.",
            "display": "Short 1-line text to show on screen.",
            "category": "level_1" | "level_2" | "level_3" | "level_4" | "custom",
            "custom_topic": "If category is custom, extract the exact concept to search in books (e.g., 'linked list'), else empty string"
        }}"""
        
        response = model.generate_content(prompt)
        clean_text = response.text.replace("```json", "").replace("```", "").strip()
        
        try:
            result = json.loads(clean_text)
            
            # --- THE MAGIC HAPPENS HERE ---
            # Agar bacche ne generic concept poocha (category: "custom")
            if result.get("category") == "custom" and result.get("custom_topic"):
                concept_to_search = result["custom_topic"]
                print(f"RAG Activated: Searching books for '{concept_to_search}'")
                
                # RAG engine ko call karke Book se answer nikalo
                rag_answer = ask_sutra_rag(concept_to_search)
                
                # Book ka answer JSON mein daal kar wapas bhej do
                result["spoken"] = rag_answer
                result["display"] = f"Reference: Course Textbook - {concept_to_search}"
                
                return json.dumps(result)
            
            # Agar normal code-specific error poocha, toh JSON as it is bhej do
            return clean_text
            
        except json.JSONDecodeError:
            # Fallback in case Gemini messes up the JSON
            return json.dumps({"spoken": "Sorry, I didn't quite catch that.", "display": "Error parsing audio.", "category": "level_1"})

    # 3. STRICT PREDEFINED TEXT HINTS (Button Clicks)
    # ... (Keep your existing Level 1, 2, 3 code here)
    if level == 1:
        prompt = f"Explain the meaning of the problem '{problem_title}' and what the boilerplate code is doing in 2 short sentences."
    elif level == 2:
        prompt = f"Provide a clear, step-by-step logical flow (like a text-based flowchart or numbered list) to solve this problem: {description}."
    elif level == 3:
        prompt = f"Find any logical errors in this code and suggest an optimization technique: {code}"
    else:
        prompt = f"Provide 2 or 3 short pseudo-code or scaffolded Python snippets to help complete the solution for '{problem_title}'. Do not give the final answer."
    
    response = model.generate_content(prompt)
    return response.text
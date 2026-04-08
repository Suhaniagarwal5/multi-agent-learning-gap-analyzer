import os
import google.generativeai as genai
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from dotenv import load_dotenv

load_dotenv()

# --- PATH SETUP ---
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_FAISS_PATH = os.path.join(base_dir, 'data', 'vectorstore', 'db_faiss')
BOOKS_DIR = os.path.join(base_dir, 'data', 'books')

def get_gemini_api_key():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is missing in .env file!")
    return api_key

def ingest_books():
    """Run this function ONCE to read all PDFs and create the database."""
    print(f"📂 Looking for books in: {BOOKS_DIR}")
    documents = []

    if not os.path.exists(BOOKS_DIR):
        print(f"❌ Error: The folder {BOOKS_DIR} does not exist.")
        return

    for root, dirs, files in os.walk(BOOKS_DIR):
        for file in files:
            if file.endswith('.pdf'):
                pdf_path = os.path.join(root, file)
                print(f"📖 Processing: {file}")
                loader = PyPDFLoader(pdf_path)
                documents.extend(loader.load())

    if not documents:
        print(f"❌ No PDFs found in {BOOKS_DIR}")
        return

    print("✂️ Splitting text into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    texts = text_splitter.split_documents(documents)

    print("🧠 Starting LOCAL Embeddings (Fast & Free)...")
    # THE MAGIC FIX: Local AI model. Never 404s.
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    db = FAISS.from_documents(texts, embeddings)
    os.makedirs(os.path.dirname(DB_FAISS_PATH), exist_ok=True)
    db.save_local(DB_FAISS_PATH)
    print(f"✅ Vector Database saved successfully at {DB_FAISS_PATH}")


def ask_sutra_rag(query):
    """Searches the student's doubt strictly inside the downloaded PDFs."""

    # Use Local Embeddings for Search
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    if not os.path.exists(DB_FAISS_PATH):
        return "I haven't read the syllabus books yet. Please run the ingest script first."

    # DIRECT FAISS SEARCH
    db = FAISS.load_local(DB_FAISS_PATH, embeddings, allow_dangerous_deserialization=True)
    matched_docs = db.similarity_search(query, k=5)

    context_text = "\n\n".join([doc.page_content for doc in matched_docs])

    # 100% GOOGLE GEMINI GENERATION (The Hackathon Requirement)
    genai.configure(api_key=get_gemini_api_key())
    model = genai.GenerativeModel('gemini-2.5-flash')

    prompt = f"""You are Sutra AI, a coding tutor. 
    Answer the student's question STRICTLY using the provided context from the official syllabus books below. 
    Keep the answer concise (2-3 sentences max) so it can be spoken via Text-to-Speech easily. 
    If the answer is NOT in the context, say: 'I couldn't find this in our standard books, but generally speaking...' and then provide a short general answer.

    Context from syllabus books:
    {context_text}

    Student's Question: {query}
    """

    response = model.generate_content(prompt)
    return response.text

if __name__ == "__main__":
    ingest_books()

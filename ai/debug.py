import sys
import os
from dotenv import load_dotenv

load_dotenv()

print("=== ENVIRONMENT CHECK ===")
print(f"MONGODB_URI exists: {bool(os.getenv('MONGODB_URI'))}")
print(f"MONGODB_URI value: {os.getenv('MONGODB_URI')[:30]}...")

print("\n=== MONGODB CONNECTION ===")
try:
    from pymongo import MongoClient
    client = MongoClient(os.getenv('MONGODB_URI'), serverSelectionTimeoutMS=5000)
    client.server_info()
    print("✅ MongoDB connected successfully")
    db = client['ragbrain']
    print(f"Collections: {db.list_collection_names()}")
    print(f"Chunks count: {db['chunks'].count_documents({})}")
except Exception as e:
    print(f"❌ MongoDB error: {e}")

print("\n=== PDF EXTRACTION ===")
try:
    import fitz
    filepath = r"C:\Users\mahes\rag-second-brain\server\uploads\1774456653661-460333070.pdf"
    doc = fitz.open(filepath)
    print(f"✅ PDF opened: {len(doc)} pages")
    for i, page in enumerate(doc):
        text = page.get_text()
        print(f"Page {i+1}: {len(text)} characters — preview: {text[:100]!r}")
except Exception as e:
    print(f"❌ PDF error: {e}")

print("\n=== EMBEDDING TEST ===")
try:
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer('all-MiniLM-L6-v2')
    test = model.encode(["Hello world"])
    print(f"✅ Embedding works: shape {test.shape}")
except Exception as e:
    print(f"❌ Embedding error: {e}")
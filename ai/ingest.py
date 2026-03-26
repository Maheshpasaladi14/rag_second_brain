import sys
import json
import os
from dotenv import load_dotenv
import fitz
from sentence_transformers import SentenceTransformer
from pymongo import MongoClient
from bson import ObjectId  # ✅ Import at top, not inside function

load_dotenv()

model = SentenceTransformer('all-MiniLM-L6-v2')

def connect_db():
    client = MongoClient(os.getenv('MONGODB_URI'))
    return client['ragbrain']

def extract_text_from_pdf(filepath):
    doc = fitz.open(filepath)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text()
        if text.strip():
            pages.append({ 'text': text, 'page': i + 1 })
    return pages

def extract_text_from_txt(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return [{ 'text': f.read(), 'page': 1 }]

def chunk_text(pages, chunk_size=500, overlap=50):
    chunks = []
    for page_data in pages:
        text = page_data['text']
        page_num = page_data['page']
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            if chunk.strip():
                chunks.append({
                    'text': chunk.strip(),
                    'pageNumber': page_num
                })
            start = end - overlap
    return chunks

def generate_embeddings(chunks):
    texts = [c['text'] for c in chunks]
    embeddings = model.encode(texts, show_progress_bar=False)
    return embeddings.tolist()

def ingest(document_id, filepath, file_type):
    db = connect_db()

    # Extract text
    if file_type == 'pdf':
        pages = extract_text_from_pdf(filepath)
    else:
        pages = extract_text_from_txt(filepath)

    if not pages:
        return { 'success': False, 'error': 'No text extracted' }

    # Chunk the text
    chunks = chunk_text(pages)

    if not chunks:
        return { 'success': False, 'error': 'No chunks generated' }

    # Generate embeddings
    embeddings = generate_embeddings(chunks)

    # ✅ Fix 3: Convert documentId to ObjectId before storing
    object_id = ObjectId(document_id)

    docs_to_insert = []
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        docs_to_insert.append({
            'documentId': object_id,  # ✅ ObjectId not string
            'text': chunk['text'],
            'embedding': embedding,
            'chunkIndex': i,
            'pageNumber': chunk['pageNumber']
        })

    db['chunks'].insert_many(docs_to_insert)

    # Update document status
    db['documents'].update_one(
        { '_id': object_id },
        { '$set': { 'status': 'ready', 'totalChunks': len(chunks) } }
    )

    return { 'success': True, 'totalChunks': len(chunks) }

if __name__ == '__main__':
    input_data = json.loads(sys.stdin.read())
    result = ingest(
        input_data['documentId'],
        input_data['filepath'],
        input_data['fileType']
    )
    print(json.dumps(result))

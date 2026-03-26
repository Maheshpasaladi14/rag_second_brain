import sys
import json
import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from pymongo import MongoClient

load_dotenv()

model = SentenceTransformer('all-MiniLM-L6-v2')

def connect_db():
    client = MongoClient(os.getenv('MONGODB_URI'))
    return client['ragbrain']

def search_similar_chunks(question, top_k=5):
    db = connect_db()

    # Check chunks exist
    count = db['chunks'].count_documents({})
    print(f'Total chunks: {count}', file=sys.stderr)

    # Convert question to vector
    question_embedding = model.encode([question])[0].tolist()

    pipeline = [
        {
            '$vectorSearch': {
                'index': 'vector_index',
                'path': 'embedding',
                'queryVector': question_embedding,
                'numCandidates': 50,
                'limit': top_k
            }
        },
        {
            '$project': {
                'text': 1,
                'documentId': 1,
                'pageNumber': 1,
                'chunkIndex': 1,
                'score': { '$meta': 'vectorSearchScore' }
            }
        }
    ]

    try:
        results = list(db['chunks'].aggregate(pipeline))
        print(f'Vector search found: {len(results)} chunks', file=sys.stderr)
    except Exception as e:
        print(f'Vector search error: {e}', file=sys.stderr)
        results = []

    # Convert ObjectId to string
    for r in results:
        r['_id'] = str(r['_id'])
        r['documentId'] = str(r['documentId'])

    return results

if __name__ == '__main__':
    input_data = json.loads(sys.stdin.read())
    results = search_similar_chunks(
        input_data['question'],
        input_data.get('topK', 5)
    )
    print(json.dumps(results))


# **After dropping collections and recreating the index:**

# 1. Upload a fresh PDF via Thunder Client
# 2. Wait 30 seconds
# 3. Run `python debug_query.py` again

# You should see:
# ```
# Total chunks in DB: 10
# Vector search results: 5
#   Score: 0.89 | Text: Mahesh Pasaladi Full Stack Developer...
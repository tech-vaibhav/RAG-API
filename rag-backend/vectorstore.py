# vectorstore.py

import faiss
from sentence_transformers import SentenceTransformer
import numpy as np

# Load the embedding model (free and fast)
model = SentenceTransformer("all-MiniLM-L6-v2")

# Global store
index = None
documents = []

def build_vector_store(docs):
    global index, documents

    # Extract plain text from docs
    texts = [doc.page_content for doc in docs]
    embeddings = model.encode(texts)

    dim = embeddings.shape[1]
    index = faiss.IndexFlatL2(dim)  # L2 = Euclidean distance
    index.add(np.array(embeddings).astype("float32"))

    documents = texts

def search(query, k=3):
    if index is None:
        return ["No documents loaded. Upload a PDF first."]

    q_emb = model.encode([query])
    distances, indices = index.search(np.array(q_emb).astype("float32"), k)

    return [documents[i] for i in indices[0]]

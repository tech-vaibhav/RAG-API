
# RAG - Retrieval-Augmented Generation with FastAPI


RAG-API is a backend service that implements Retrieval-Augmented Generation (RAG) using state-of-the-art language models. It combines information retrieval with language generation to provide accurate and context-rich answers to user queries.

## 🚀 Features

- 🔍 Context-aware responses using RAG (Retriever + Generator)

- ⚡ FastAPI backend with RESTful APIs

- 🧠 Integration with FAISS for efficient similarity search

- 🗂️ Preloaded knowledge base or custom document ingestion

- 🛡️ CORS enabled for frontend compatibility

- 📄 Supports .pdf and .txt file ingestion (customizable)


----
## 🛠️ Tech Stack
| Component         | Tool / Library                    |
|------------------|------------------------------------|
| API Framework     | FastAPI                            |
| Vector DB         | FAISS                              |
| Embeddings        | `sentence-transformers`, HuggingFace |
| LLM               | OpenAI API / Transformers / LLaMA |
| File Parsing      | PyMuPDF, pypdf, python-docx        |
| Async I/O         | aiofiles, httpx                    |
| PDF/Text Ingestion| Unstructured                       |
| Backend Utilities | LangChain                          |

---------
## 🧪 How It Works
- Ingestion: Load documents and convert them into embeddings.

- Retrieval: For a given query, search the FAISS index to find relevant chunks.

- Generation: Use an LLM to generate an answer using the retrieved context

----------
## ▶️ Getting Started

### 1. Clone the Repository
git clone https://github.com/tech-vaibhav/RAG-API.git

### 2. Create Virtual Environment
python -m venv venv
venv\Scripts\activate        # Windows

### 3. Run API Server
uvicorn app.main:app --reload

---------
## 📦 Key Dependencies
- fastapi
- uvicorn
- langchain
- faiss-cpu
- transformers
- sentence-transformers
- httpx
- pypdf
- unstructured
- huggingface-hub

---------------

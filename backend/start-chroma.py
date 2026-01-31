# Start ChromaDB Server
# This script starts the ChromaDB server on localhost:8000

import sys
import chromadb
from chromadb.config import Settings

print("Starting ChromaDB server...")
print(f"ChromaDB version: {chromadb.__version__}")

# Start server
try:
    from chromadb.server.fastapi import FastAPI
    import uvicorn
    
    print("Starting server on http://localhost:8000")
    print("Press Ctrl+C to stop")
    
    uvicorn.run(
        "chromadb.app:app",
        host="localhost",
        port=8000,
        log_level="info"
    )
    
except Exception as e:
    print(f"Error starting server: {e}")
    sys.exit(1)

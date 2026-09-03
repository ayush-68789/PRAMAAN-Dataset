{
  "service": "synthetic-document-api",
  "version": "1.0.0",
  "description": "Privacy-safe synthetic document dataset REST API for SIH prototype.",
  "endpoints": {
    "health": "GET /api/health",
    "stats": "GET /api/stats",
    "documents": "GET /api/documents",
    "document_detail": "GET /api/documents/:documentId",
    "document_file": "GET /api/documents/:documentId/file",
    "identities": "GET /api/identities",
    "identity_detail": "GET /api/identities/:identityId",
    "identity_documents": "GET /api/identities/:identityId/documents",
    "test_random": "GET /api/test/random",
    "test_random_tampered": "GET /api/test/random-tampered"
  }
}

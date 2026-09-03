# Synthetic Document API

**Version:** 1.0.0

Privacy-safe synthetic document dataset REST API for SIH (Smart India Hackathon) prototype.

## Endpoints Overview

| Service | Method | Route | Description |
| :--- | :---: | :--- | :--- |
| **Health** | `GET` | `/api/health` | Checks the health and status of the API service. |
| **Stats** | `GET` | `/api/stats` | Returns general statistics about the synthetic dataset. |
| **Documents** | `GET` | `/api/documents` | Retrieves a list of synthetic documents. |
| **Document Detail** | `GET` | `/api/documents/:documentId` | Fetches metadata for a specific document by its ID. |
| **Document File** | `GET` | `/api/documents/:documentId/file` | Retrieves the actual file content/image of a specific document. |
| **Identities** | `GET` | `/api/identities` | Retrieves a list of synthetic identities (users). |
| **Identity Detail** | `GET` | `/api/identities/:identityId` | Fetches details for a specific synthetic identity. |
| **Identity Documents** | `GET` | `/api/identities/:identityId/documents`| Retrieves all documents associated with a specific identity. |
| **Test Random** | `GET` | `/api/test/random` | Fetches a random document/identity for testing purposes. |
| **Test Random Tampered** | `GET` | `/api/test/random-tampered` | Fetches a tampered synthetic document to test detection models. |

## Usage

*Note: Replace `<BASE_URL>` with your local or hosted server URL (e.g., `http://localhost:3000`).*

Example request to fetch all identities:
```bash
curl -X GET <BASE_URL>/api/identities

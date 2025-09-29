# Windows Social Network

A web application where users can upload window photographs, have them analyzed by AI, and share them with the community. Browse through a curated collection of windows from around the world with intelligent filtering and duplicate detection.

## Architecture Overview

This is a monorepo containing both frontend and backend in a single repository. The decision to use a monorepo was made for ease of deployment and development workflow. However, it has limitations regarding serverless deployment since we're using a local MongoDB instance.

**Tech Stack:**
- **Backend:** FastAPI (Python) with Pipenv for package management
- **Frontend:** Next.js with Tailwind CSS and shadcn/ui components
- **Database:** MongoDB 6.0
- **AI Analysis:** OpenAI API compatible. (Ollama/OpenAI/etc)
- **Containerization:** Docker & Docker Compose

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Ollama for local analysis, OpenAI API Key for cloud analysis.

### Installation & Running

1. **Clone the repository**
```bash
git clone https://github.com/greenlantern02/VentanaSocial
cd VentanaSocial
```

2. **Set up environment variables**

Create a `.env` file in the root directory:
```bash
MONGO_URL=mongodb://mongo:27017
AI_URL = https://api.openai.com/v1/chat/completions or http://localhost:11434/api/chat
AI_API_KEY=${AI_API_KEY}
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_IMAGE_URL=http://localhost:8000/uploads/
```

3. **Start all services with Docker Compose**
```bash
docker-compose up --build
```

This will start:
- Backend API on `http://localhost:8000`
- Frontend on `http://localhost:3000`
- MongoDB on `http://localhost:27017`

4. **Access the application**

Open your browser and navigate to `http://localhost:3000`

### Alternative: Manual Setup

**Backend:**
```bash
cd back
pipenv install
pipenv shell
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd front
pnpm install
pnpm dev --port 3000
```

**MongoDB:**
```bash
# Start MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongo-db mongo:6.0
```

## API Endpoints

- `POST /api/windows` - Upload a new window image
- `GET /api/windows` - Get paginated windows with filtering and pagination
- `GET /api/windows/{id}` - Get a specific window by ID
- `GET /api/windows/{id}/duplicates` - Get duplicate images
- `GET /uploads/{filename}` - Serve uploaded images
- `GET /health` - Health check endpoint

## Duplicate Detection Algorithm

### SHA-256 Hashing

This project uses **SHA-256** (Secure Hash Algorithm 256-bit) to detect exact duplicate images. Here's why it's sufficient for this use case:

**How it works:**
1. When an image is uploaded, the entire file content is read as bytes
2. SHA-256 generates a unique 256-bit (64 character hex) fingerprint of the file
3. This hash is stored in MongoDB and checked against new uploads
4. If the hash matches, the image is marked as a duplicate

**Why SHA-256 is appropriate:**

1. **Collision Resistance:** The probability of two different images producing the same SHA-256 hash is astronomically low (approximately 1 in 2^256). For practical purposes, it's considered impossible.

2. **Deterministic:** The same file will always produce the same hash, making it reliable for exact duplicate detection.

3. **Fast Computation:** SHA-256 is computationally efficient, even for large images up to 5MB.

4. **Industry Standard:** Widely used and thoroughly tested for file integrity verification.

**Limitations:**
- Only detects **exact** duplicates (same file, byte-for-byte)
- Does not detect near-duplicates (e.g., resized, cropped, or slightly edited versions)
- Different file formats of the same image (JPEG vs PNG) won't match

**Future Enhancement:** For near-duplicate detection, perceptual hashing algorithms like pHash or dHash could be implemented, but they add complexity and computational overhead that isn't necessary for the MVP.

## Design Decisions

### 1. **Monorepo Architecture**
**Decision:** Keep frontend and backend in the same repository.

**Rationale:** 
- Simplified deployment workflow
- Easier to maintain type consistency between front and back
- Single source of truth for the project
- Better for small teams and MVPs

**Trade-offs:** 
- Requires VPS hosting instead of serverless options
- Harder to scale independently

**Future Path:** With analytics data, we can identify bottlenecks and split into microservices strategically.

### 2. **Local File Storage**
**Decision:** Store uploaded images in a local `uploads/` folder.

**Rationale:**
- Simple implementation for MVP
- No additional costs for cloud storage
- Foundation ready for CDN migration

**Implementation:** 
- Image URLs constructed with environment variables
- Next.js custom `imageLoader` for flexibility
- Can switch to S3/CDN with minimal code changes

### 3. **AI Analysis Architecture**
**Decision:** Rest API call to OpenAI API compatible services with graceful fallback.

**Rationale:**
- Separation of concerns (AI as a microservice)
- Easy to swap AI providers
- Fallback ensures app continues functioning without AI

**Fallback Strategy:** If AI fails, default values ("unknown") are used so the upload succeeds. 

### 4. **Testing Strategy**
**Decision:** Unit tests with mocked database, run via GitHub Actions.

**Current State:** Unit tests with pytest, database mocked.

**Recommended Next Step:** Integration tests against a staging database replica for production confidence.

### 5. **Type Safety**
**Decision:** Strongly typed frontend with global types file.

**Rationale:**
- Catch errors at compile time
- Easier refactoring
- Improved code documentation

### 6. **Configuration-Driven Filtering**
**Decision:** Filter options defined in a config array.

**Rationale:**
- Single source of truth for filter options
- Easy to add/modify filters
- Consistent between frontend and backend validation

## ⏱Time Investment

**Total Time:** ~8-10 hours

## Security Considerations

- File type validation (extension + MIME type)
- File size limits (5MB max)
- Path traversal protection
- Input sanitization for search queries
- Environment variable for sensitive data

## Future Enhancements

1. **Scalability:**
   - Migrate to CDN for image serving
   - Implement Redis caching
   - Move to managed MongoDB (Atlas)
   - Microservices architecture based on analytics
   - Fastapi to django 

2. **Features:**
   - User authentication
   - Comments and likes
   - Advanced search with ML
   - Perceptual hashing for near-duplicates
   - Image compression pipeline

3. **Testing:**
   - Integration tests with staging DB
   - E2E tests with Playwright
   - Load testing
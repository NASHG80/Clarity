# Green & Inclusive Travel - Decision Engine (Clarity)

A personalized travel decision engine for sustainable and accessible travel in India. The platform consists of a B2C traveler application and a B2B business console, providing data-driven recommendations, carbon impact tracking, and AI-assisted property analysis.

## Features

### B2C Traveler Application
- Natural language trip planning and requirement extraction.
- Rule-based recommendation engine for transport, accommodation, and experiences.
- Multi-dimensional trade-off cards (Cost, Time, CO2, Accessibility).
- Integrated Razorpay test-mode payment gateway.
- Comprehensive language support (English, Hindi, Marathi).
- Weather Digital Twin for journey impact analysis.

### B2B Business Console
- Property and business onboarding.
- Self-reporting tools for sustainability and accessibility data.
- AI-assisted photo feature detection using YOLO-World-S.
- Professional analytics dashboard tracking traveler demand, drop-offs, and data gaps.
- Opportunity detector for property improvements.

## Architecture

The project is structured into distinct modules:

- `frontend/`: React + Vite application (B2C app, B2B console, shared i18n).
- `backend/`: FastAPI application handling routing, LLM extraction, payments, and the core recommendation engine.
- `ai-vision-service/`: Standalone microservice running YOLO-World-S for B2B photo analysis.
- `database/`: MongoDB schema definitions, seed scripts, and core data.
- `docs/`: Comprehensive project documentation and API contracts.

## Prerequisites

- Node.js (v18 or higher)
- Python (3.10 or higher)
- MongoDB (Local instance or MongoDB Atlas)
- Git

## Environment Variables

Before starting the application, you must configure the environment variables for both the frontend and backend. 

### Backend Configuration
Create a `.env` file in the `backend/` directory with the following variables:

```env
MONGO_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=your_preferred_groq_model
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
AI_VISION_URL=http://localhost:8001
FRONTEND_ORIGIN=http://localhost:5173
SERPAPI_API_KEY=your_serpapi_key
RAILRADAR_API_KEY=your_railradar_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GOOGLE_ROUTES_API_KEY=your_google_routes_api_key
```

## Setup and Installation

### 1. Database Setup
Ensure your MongoDB instance is running. You can seed the database with initial demo data using the provided scripts in the `database/` directory.

```bash
cd database
python reset_demo_data.py
```

### 2. Backend Setup
Navigate to the backend directory, install the Python dependencies, and start the FastAPI server.

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
Navigate to the frontend directory, install the Node dependencies, and start the Vite development server.

```bash
cd frontend
npm install
npm run dev
```

### 4. AI Vision Service (Optional)
If you need to run the YOLO-World-S object detection service for the B2B dashboard locally:

```bash
cd ai-vision-service
pip install -r requirements.txt
python main.py
```

## Documentation

For further development instructions, please refer to the `docs/` directory:
- `AGENTS.md`: Read this before modifying code.
- `docs/IMPLEMENTATION_PLAN.md`: Overall project phases and plan.
- `docs/API_CONTRACT.md`: Backend and frontend API communication specifications.
- `docs/DATA_MODEL.md`: MongoDB schema and data states.
- `docs/TECH_STACK.md`: Technical stack details and i18n implementation.

# Field Command Hub - Backend & Frontend Integration

This guide explains how to set up and run both the backend (FastAPI) and frontend (React) components of the Field Command Hub system.

## Prerequisites

- Python 3.8+ (for backend)
- Node.js 16+ and Bun (for frontend)
- Git

## Backend Setup

### 1. Install Python Dependencies

Navigate to the `Backend/` directory and install dependencies:

```bash
cd Backend
pip install fastapi uvicorn pydantic
```

### 2. Run the Backend Server

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will start at `http://localhost:8000` with:
- REST API: `GET /vehicle` - Returns current vehicle state
- WebSocket: `ws://localhost:8000/ws/vehicle` - Real-time vehicle data updates (10 Hz)

## Frontend Setup

### 1. Install Frontend Dependencies

Navigate to the `Frontend/` directory:

```bash
cd Frontend
bun install
# or
npm install
```

### 2. Configure Backend URL

Create a `.env` file in the `Frontend/` directory (if it doesn't exist):

```env
VITE_BACKEND_URL=ws://localhost:8000
```

**Note:** The `VITE_BACKEND_URL` should be the WebSocket URL of your backend. For local development, use `ws://localhost:8000`. For production, update it to your backend's WebSocket URL.

### 3. Run the Development Server

```bash
bun run dev
# or
npm run dev
```

The frontend will start at `http://localhost:5173` (or another port if 5173 is busy).

## Real-Time Data Flow

The frontend now retrieves vehicle data from the backend in real-time:

1. **Connection**: The `useVehicleData` hook establishes a WebSocket connection to the backend
2. **Data Reception**: The backend sends vehicle state updates every 100ms (10 Hz)
3. **UI Update**: React components automatically update when new data arrives
4. **Fallback**: If WebSocket fails, the components display appropriate error messages

## Architecture

### Backend (`Backend/`)
- **main.py**: FastAPI application with REST and WebSocket endpoints
- **models.py**: Pydantic models for data validation
- **Vehicle_state.py**: Current vehicle state (data simulation)

### Frontend (`Frontend/`)
- **useVehicleData.ts**: Custom React hook for WebSocket connection management
- **Vehicle.tsx**: Main vehicle dashboard page consuming real-time data
- **Dashboard Components**: Individual gauge and status components accepting props from real-time data

## Key Components Updated

### Dashboard Components

All dashboard components now accept data from the backend:

- **SemiCircleGauge & CircularGauge**: Display speed and heading from `data.speed` and `data.heading`
- **VehicleStatusPanel**: Shows GPS status, vehicle mode, satellite count
- **BatteryStatusPanel**: Displays battery voltages from `data.batteries`
- **LinearActuatorPanel**: Shows X/Y actuator positions
- **WheelStatusInline**: Displays wheel RPM and steering angles in real-time

## Troubleshooting

### "WebSocket connection failed" Error
- Ensure the backend is running on `http://localhost:8000`
- Check that CORS is enabled in the backend (it is by default)
- Verify the `VITE_BACKEND_URL` environment variable in `.env`

### No Data Appearing in Frontend
- Check browser console for errors
- Verify backend is sending data (test with `curl http://localhost:8000/vehicle`)
- Ensure the WebSocket connection is established (check Network tab in browser DevTools)

### Port Already in Use
- Backend: Change port in the uvicorn command (e.g., `--port 8001`)
- Frontend: Vite will automatically use the next available port

## Development Tips

1. **Hot Module Replacement**: Both frontend and backend support hot reloading during development
2. **Modifying Vehicle Data**: Edit `Backend/Vehicle_state.py` to simulate different vehicle states
3. **Customizing Update Rate**: Change the `await asyncio.sleep(0.1)` value in `Backend/main.py` to adjust the update frequency
4. **Environment Variables**: Use `.env.example` as a template for your local `.env` configuration

## Next Steps

- Implement data persistence (database)
- Add authentication/authorization
- Create additional dashboard views
- Implement vehicle control APIs
- Add data logging and analytics

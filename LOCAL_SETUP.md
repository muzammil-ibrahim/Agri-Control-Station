# Local PostgreSQL Setup Guide

This guide explains how to set up and run the Field Command Hub application with a local PostgreSQL database (migrated from Supabase).

## Prerequisites

- **PostgreSQL 12+** installed and running
- **Python 3.8+** with pip
- **Node.js 16+** with npm or bun
- **git** (optional)

## Backend Setup

### 1. Install PostgreSQL

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- During installation, remember the postgres password
- Default port: 5432

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

Connect to PostgreSQL and create the database:

```bash
# Connect to PostgreSQL (will prompt for password)
psql -U postgres

# In the PostgreSQL terminal, run:
CREATE DATABASE field_command_hub;
\q
```

### 3. Configure Backend Environment

Create or update the `.env` file in the Backend directory:

```bash
cd Backend
```

Create a `.env` file (or update existing one) with:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/field_command_hub

# Optional: Set to 'true' for development
DEBUG=false
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

### 4. Install Python Dependencies

```bash
# From the Backend directory
pip install -r requirements.txt
```

### 5. Run Database Migrations (Automatic)

The database tables are created automatically when the FastAPI server starts (via `init_db()` in `database.py`).

### 6. Start the Backend Server

```bash
# From the Backend directory
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at: `http://localhost:8000`

### API Endpoints

All CRUD endpoints follow REST conventions:

- **Farms**: `GET /api/farms`, `POST /api/farms`, `PUT /api/farms/{id}`, `DELETE /api/farms/{id}`
- **Fields**: `GET /api/fields`, `POST /api/fields`, `PUT /api/fields/{id}`, `DELETE /api/fields/{id}`
- **Crop Seasons**: `GET /api/fields/{id}/crop-seasons`, `POST /api/crop-seasons`
- **Crop Logs**: `GET /api/crop-logs`, `POST /api/crop-logs`, `DELETE /api/crop-logs/{id}`
- **Tasks**: `GET /api/tasks`, `POST /api/tasks`, `PUT /api/tasks/{id}`, `DELETE /api/tasks/{id}`
- **Vehicles**: `GET /api/vehicles`, `POST /api/vehicles`
- **Alerts**: `GET /api/alerts/unresolved`, `PUT /api/alerts/{id}/resolve`
- **Log Tags**: `GET /api/log-tags`, `POST /api/log-tags`

And many more endpoints for geo-points, growth observations, pest records, etc.

## Frontend Setup

### 1. Configure Environment

Update `Frontend/.env`:

```env
VITE_BACKEND_URL=ws://localhost:8000
VITE_API_URL=http://localhost:8000/api
```

For production/remote deployment:

```env
VITE_BACKEND_URL=ws://your-server-ip:8000
VITE_API_URL=http://your-server-ip:8000/api
```

### 2. Install Dependencies

```bash
cd Frontend

# Using bun (recommended, already configured)
bun install

# Or using npm
npm install
```

### 3. Run Development Server

```bash
# Using bun
bun run dev

# Or using npm
npm run dev
```

Frontend will be available at: `http://localhost:5173` (or as shown in terminal)

### 4. Build for Production

```bash
# Using bun
bun run build

# Or using npm
npm run build
```

The build will be created in `Frontend/dist/`

## Running Full Stack

### Terminal 1: Backend

```bash
cd Backend
python main.py
```

Backend starts at `http://localhost:8000`

### Terminal 2: Frontend

```bash
cd Frontend
bun run dev
```

Frontend starts at `http://localhost:5173`

## Database Management

### Viewing Database Content

```bash
# Connect to the database
psql -U postgres -d field_command_hub

# List tables
\dt

# View table structure
\d farms  # (replace 'farms' with any table name)

# Run queries
SELECT * FROM farms;
SELECT * FROM fields WHERE farm_id = 1;
```

### Resetting Database

To completely reset and recreate all tables:

```bash
# Connect to postgres (not the database)
psql -U postgres

# Drop the database
DROP DATABASE IF EXISTS field_command_hub;

# Create a fresh one
CREATE DATABASE field_command_hub;
\q

# Start the backend - it will automatically create all tables
python main.py
```

## Troubleshooting

### PostgreSQL Connection Error

```
ERROR: could not connect to server: Connection refused
```

**Solution:** Make sure PostgreSQL is running:
```bash
# Windows: Check Services or use
net start postgresql-x64-15

# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

### "Database does not exist" Error

Create the database:
```bash
psql -U postgres -c "CREATE DATABASE field_command_hub;"
```

### Port Already in Use

If port 8000 is already in use, run backend on different port:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

Then update `Frontend/.env` with the new port:
```env
VITE_API_URL=http://localhost:8001/api
```

### Frontend Not Connecting to Backend

1. Check **VITE_API_URL** in `Frontend/.env`
2. Ensure backend is running and accessible
3. Check browser console for CORS errors
4. Try `http://localhost:8000` instead of IP if using localhost

## Data Migration from Supabase (if applicable)

If you have existing data in Supabase that needs to be migrated:

### Export Data from Supabase

Use Supabase dashboard or SQL:
```sql
-- Export each table as CSV
COPY farms TO STDOUT WITH CSV HEADER;
COPY fields TO STDOUT WITH CSV HEADER;
-- etc...
```

### Import to Local PostgreSQL

```bash
psql -U postgres -d field_command_hub -c "\COPY farms FROM 'farms.csv' WITH CSV HEADER;"
psql -U postgres -d field_command_hub -c "\COPY fields FROM 'fields.csv' WITH CSV HEADER;"
# etc...
```

## Development Tips

### Adding New Tables/Fields

1. Update `Backend/database.py` - add SQLAlchemy model
2. Update `Backend/schemas.py` - add Pydantic schemas
3. Add endpoints in `Backend/api_routes.py`
4. Update `Frontend/src/lib/api.ts` with new API client functions
5. Backend will auto-create tables on startup

### Database Schema Structure

- **farms**: Farm records
- **fields**: Field records (linked to farms)
- **geo_points**: Geofence boundary points
- **crop_seasons**: Crop growing seasons per field
- **crop_logs**: Farming activity logs with timestamps
- **growth_observations**, **pest_records**, **disease_records**, **soil_tests**, **treatment_records**, **harvest_records**: Log-specific details
- **vehicles**: Equipment/vehicle records
- **tasks**: Farming tasks/missions
- **task_executions**: Task execution records
- **alerts**: System alerts
- **log_tags**: Tags for organizing logs
- **crop_log_tags**: Many-to-many junction table for log tags

## Performance Optimization

### Enable Connection Pooling

Already configured in `Backend/database.py` with SQLAlchemy's connection pool.

### Add Database Indexes

For frequently queried fields, add indexes in `database.py`:

```python
class Farm(Base):
    __tablename__ = "farms"
    
    id = Column(Integer, primary_key=True, index=True)  # Already indexed
    name = Column(String(255), index=True)  # Add index for searches
    # ...
```

Indexes are already added for common query fields.

## Security Considerations

### Production Deployment

1. Change PostgreSQL password
2. Use environment variables for sensitive config
3. Set `DEBUG=false`
4. Use `.env.local` (git-ignored) for secrets
5. Enable HTTPS for frontend
6. Use stronger database credentials

### Database Backup

```bash
# Backup
pg_dump -U postgres -d field_command_hub > backup.sql

# Restore
psql -U postgres -d field_command_hub < backup.sql
```

## Next Steps

1. ✅ PostgreSQL installed and running
2. ✅ Database created
3. ✅ Backend environment configured
4. ✅ Backend dependencies installed
5. ✅ Frontend environment configured
6. ✅ Frontend dependencies installed
7. ✅ Start both servers and test the application

Visit `http://localhost:5173` in your browser to access the application.

 # Database Setup Guide

## Quick Setup

1. **Ensure MySQL is running**
   - Start MySQL service on your system
   - Default port should be 3306

2. **Create the database**
   ```sql
   CREATE DATABASE test_platform;
   ```

3. **Update credentials**
   - Check `backend/.env` file
   - Update DB_PASSWORD if needed (currently set to "12345")

4. **Test connection**
   ```bash
   cd backend
   npm run test-db
   ```

5. **Start the application**
   ```bash
   # Use the improved startup script
   start-dev-fixed.bat
   
   # Or manually
   cd backend && npm run dev
   cd frontend && npm run dev
   ```

## Current Database Configuration

- **Database**: test_platform
- **User**: root
- **Password**: 12345 (change in .env if different)
- **Host**: localhost
- **Port**: 3306

## Troubleshooting

### Connection Issues
- Verify MySQL service is running
- Check if port 3306 is available
- Ensure database `test_platform` exists
- Verify credentials in `backend/.env`

### Model Sync Issues
- The app will automatically create/update tables
- Use `npm run init-db` to manually initialize

### Passcode System
- Student and supervisor passcodes are stored in database
- Auto-generated on first run
- Accessible via API endpoints:
  - GET `/api/passcode/current` - Student passcode
  - GET `/api/passcode/supervisor` - Supervisor passcode
  - POST `/api/passcode/generate` - Generate new student passcode
  - POST `/api/passcode/supervisor/generate` - Generate new supervisor passcode
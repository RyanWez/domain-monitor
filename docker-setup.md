# Docker Setup for PostgreSQL

## Install Docker Desktop

1. **Download Docker Desktop for Windows**
   - Go to: https://www.docker.com/products/docker-desktop/
   - Download and install Docker Desktop
   - Restart your computer after installation

2. **Start Docker Desktop**
   - Launch Docker Desktop from Start menu
   - Wait for it to fully start (whale icon in system tray)

3. **Run PostgreSQL with Docker**
   ```powershell
   docker run --name postgres-db -e POSTGRES_DB=domain_monitor -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15
   ```

4. **Verify it's running**
   ```powershell
   docker ps
   ```

## Alternative: Use docker-compose

After Docker Desktop is installed:
```powershell
docker-compose up -d postgres
```
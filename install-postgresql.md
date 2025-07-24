# Install PostgreSQL on Windows

## Option 1: Download PostgreSQL Installer (Easiest)

1. **Download PostgreSQL**
   - Go to: https://www.postgresql.org/download/windows/
   - Download the installer for Windows
   - Run the installer

2. **During Installation:**
   - Set password for postgres user: `password` (or remember what you set)
   - Keep default port: `5432`
   - Remember the password you set!

3. **After Installation:**
   - PostgreSQL should start automatically
   - You can verify it's running in Services (search "Services" in Windows)

## Option 2: Using Chocolatey (if you have it)

```powershell
choco install postgresql
```

## Option 3: Using Winget (Windows Package Manager)

```powershell
winget install PostgreSQL.PostgreSQL
```

## Create the Database

After PostgreSQL is installed and running:

1. **Open Command Prompt as Administrator**
2. **Connect to PostgreSQL:**
   ```cmd
   psql -U postgres
   ```
3. **Create the database:**
   ```sql
   CREATE DATABASE domain_monitor;
   \q
   ```

## Verify Installation

```cmd
psql -U postgres -d domain_monitor -c "SELECT version();"
```

If this works, PostgreSQL is ready!
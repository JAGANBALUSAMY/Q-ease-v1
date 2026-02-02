# Backend Scripts

Utility scripts for database management and testing.

## Available Scripts

### Database Management

**Reset Database**
```bash
node scripts/resetDb.js
```
Drops all tables and recreates the database schema. Use with caution!

**Seed Database**
```bash
node scripts/testSeed.js
```
Populates the database with test data for development.

**Check Queues**
```bash
node scripts/checkQueues.js
```
Displays current queue status and token counts.

## Usage

Run scripts from the backend root directory:
```bash
cd backend
node scripts/<script-name>.js
```

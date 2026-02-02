# 🌱 Q-Ease Database Seeding Guide

This guide explains how to seed your Q-Ease database with sample data for testing and development.

## 📋 What Gets Seeded

The seeding script creates a comprehensive set of sample data including:

### 🏢 Organisations
- **City General Hospital** (HOSP01) - Multi-specialty hospital
- **Apollo Family Clinic** (CLIN01) - Primary healthcare
- **FreshMart Supermarket** (GROC01) - Grocery store
- **TechCorp Solutions** (OFFC01) - IT services company

### 👥 Users (All with password: Password123!)
- **Super Admin**: superadmin@qease.com
- **Hospital Admin**: admin@cityhospital.com
- **Clinic Admin**: admin@apolloclinic.com
- **Staff Members**: Various roles across organisations
- **Regular Users**: Sample customers/patients

### 📋 Queues
- OPD Registration, Laboratory Services (Hospital)
- General Consultation, Pediatrics (Clinic)
- Billing Counter (Grocery)
- HR Services (Office)

### 🎫 Sample Tokens
- Active waiting tokens
- Called tokens
- Served tokens
- Emergency priority tokens

### 📊 Analytics Data
- Average wait times
- Queue length metrics
- Service rates
- Performance statistics

### 🔔 Notifications
- Token called notifications
- Queue status updates
- System alerts

## 🚀 How to Seed Your Database

### 1. First-time Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up database (if not already done)
npm run db:migrate

# Generate Prisma client
npm run db:generate
```

### 2. Run the Seeding
```bash
# Seed with sample data
npm run seed
```

### 3. Reset and Re-seed (if needed)
```bash
# Reset database and re-seed
npm run seed:reset
```

## 🔧 Seeding Commands

| Command | Description |
|---------|-------------|
| `npm run seed` | Add sample data to existing database |
| `npm run seed:reset` | Reset database and seed fresh data |
| `npm run db:migrate` | Run database migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:reset` | Reset database schema |

## 🔐 Login Credentials

After seeding, you can log in with these credentials:

### Admin Users
- **Super Admin**: `superadmin@qease.com` / `Password123!`
- **Hospital Admin**: `admin@cityhospital.com` / `Password123!`
- **Clinic Admin**: `admin@apolloclinic.com` / `Password123!`

### Staff Users
- **Hospital Staff**: `staff@cityhospital.com` / `Password123!`
- **Clinic Reception**: `reception@apolloclinic.com` / `Password123!`
- **Grocery Cashier**: `cashier@freshmart.com` / `Password123!`

### Regular Users
- **Patient**: `patient1@gmail.com` / `Password123!`
- **Customer**: `customer1@gmail.com` / `Password123!`
- **Employee**: `employee1@techcorp.com` / `Password123!`

## 🛠️ Customizing the Seed Data

You can modify the `prisma/seed.js` file to:

1. **Add more organisations**:
```javascript
const newOrg = await prisma.organisation.create({
  data: {
    code: 'NEW001',
    name: 'Your Organisation Name',
    // ... other fields
  }
});
```

2. **Create custom users**:
```javascript
const newUser = await prisma.user.create({
  data: {
    email: 'user@example.com',
    password: await bcrypt.hash('YourPassword123!', 10),
    firstName: 'First',
    lastName: 'Last',
    roleId: userRole.id,
    // ... other fields
  }
});
```

3. **Add specific queues**:
```javascript
const newQueue = await prisma.queue.create({
  data: {
    organisationId: org.id,
    name: 'Queue Name',
    description: 'Queue description',
    maxTokens: 50,
    averageTime: 10
  }
});
```

## 📊 What You'll See After Seeding

### In the Admin Dashboard:
- Multiple organisations to manage
- Realistic queue data
- Sample analytics and metrics
- Staff performance data

### In the Staff Interface:
- Assigned queues with sample tokens
- Real-time queue status
- Customer management scenarios

### For Regular Users:
- Available organisations to join
- Sample queue joining experience
- Token tracking functionality

## ⚠️ Important Notes

- **Password Security**: All seeded passwords are `Password123!` - change in production
- **Data Persistence**: Seeding adds to existing data (use `seed:reset` to start fresh)
- **Dependencies**: Make sure `bcryptjs` is installed for password hashing
- **Database State**: Seeding assumes a clean database state for best results

## 🆘 Troubleshooting

### Common Issues:

1. **"Cannot find module 'bcryptjs'"**
   ```bash
   npm install bcryptjs
   ```

2. **Database connection errors**
   - Check your `.env` file for correct `DATABASE_URL`
   - Ensure PostgreSQL is running
   - Verify database credentials

3. **Prisma client not generated**
   ```bash
   npm run db:generate
   ```

4. **Migration errors**
   ```bash
   npm run db:migrate
   ```

The seeding process should complete successfully and provide you with a fully functional test environment for Q-Ease!
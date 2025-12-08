# MongoDB Atlas Setup Guide for UniPay

## 🚀 **Step-by-Step MongoDB Atlas Setup**

### **Step 1: Create MongoDB Atlas Account**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" or "Sign Up"
3. Create your account with email and password

### **Step 2: Create a New Cluster**
1. **Choose Cloud Provider**: AWS, Google Cloud, or Azure
2. **Select Region**: Choose closest to your location
3. **Cluster Tier**: Select "M0 Sandbox" (Free tier)
4. **Cluster Name**: Give it a name like "unipay-cluster"
5. Click "Create Cluster"

### **Step 3: Set Up Database Access**
1. **Go to "Database Access"** in the left sidebar
2. **Click "Add New Database User"**
3. **Authentication Method**: Password
4. **Username**: Create a username (e.g., "unipay-user")
5. **Password**: Generate a secure password
6. **Database User Privileges**: "Read and write to any database"
7. **Click "Add User"**

### **Step 4: Configure Network Access**
1. **Go to "Network Access"** in the left sidebar
2. **Click "Add IP Address"**
3. **Choose "Allow Access from Anywhere"** (0.0.0.0/0) for development
4. **Click "Confirm"**

### **Step 5: Get Connection String**
1. **Go to "Clusters"** in the left sidebar
2. **Click "Connect"** on your cluster
3. **Choose "Connect your application"**
4. **Select "Node.js"** as driver
5. **Copy the connection string**

### **Step 6: Create .env File**
Create a file called `.env` in the `backend` folder with:

```bash
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/unipay?retryWrites=true&w=majority
MONGODB_DB=unipay

# Server Configuration
PORT=4000
NODE_ENV=development
```

### **Step 7: Test Connection**
1. **Start your backend server**: `npm run dev`
2. **Check console** for "Connected to MongoDB" message
3. **Test API endpoints** to verify data persistence

## 🔧 **Connection String Format**

```
mongodb+srv://<username>:<password>@<cluster-url>/<database-name>?retryWrites=true&w=majority
```

**Example:**
```
mongodb+srv://unipay-user:MySecurePassword123@cluster0.abc123.mongodb.net/unipay?retryWrites=true&w=majority
```

## 🛡️ **Security Best Practices**

### **For Production:**
1. **Use specific IP addresses** instead of 0.0.0.0/0
2. **Create dedicated database users** with limited privileges
3. **Enable encryption** in transit
4. **Use environment variables** for sensitive data
5. **Regularly rotate passwords**

### **For Development:**
1. **Use free tier** (M0 Sandbox)
2. **Allow all IPs** for testing
3. **Use strong passwords**
4. **Keep connection strings secure**

## 📊 **Database Collections**

Your UniPay application will create these collections:
- **merchants** - Merchant account information
- **orders** - Payment orders
- **payments** - Payment transactions
- **refunds** - Refund records
- **banks** - Bank configurations

## 🧪 **Testing Your Setup**

1. **Start backend**: `cd backend && npm run dev`
2. **Check console**: Should show "Connected to MongoDB"
3. **Create merchant**: Use the frontend to create a merchant account
4. **Check Atlas**: Go to your cluster and verify data appears

## 🚨 **Troubleshooting**

### **Connection Issues:**
- **Check username/password** in connection string
- **Verify network access** allows your IP
- **Ensure cluster is running**
- **Check connection string format**

### **Common Errors:**
- **"Authentication failed"** - Wrong username/password
- **"Network timeout"** - IP not whitelisted
- **"Invalid connection string"** - Check format

## 💡 **Next Steps**

1. **Set up your .env file** with your Atlas connection string
2. **Test the connection** by starting your backend
3. **Create a merchant account** to test data persistence
4. **Verify data appears** in your MongoDB Atlas dashboard

Your UniPay application will now store all data in MongoDB Atlas! 🎉

const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3060;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const client = new MongoClient(process.env.COSMOS_DB_CONNECTION_STRING);

// Connect to MongoDB
async function connectToDb() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

// Database and collection references
let db;
let productsCollection;

// Initialize database connection
connectToDb().then(() => {
    db = client.db('productDB');
    productsCollection = db.collection('products');
});

// Routes
// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const products = await productsCollection.find({}).toArray();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single product by SKU
app.get('/api/products/:sku', async (req, res) => {
    try {
        const product = await productsCollection.findOne({ sku: req.params.sku });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new product
app.post('/api/products', async (req, res) => {
    try {
        const { name, sku, price } = req.body;
        if (!name || !sku || !price) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        const result = await productsCollection.insertOne({ name, sku, price });
        res.status(201).json({ id: result.insertedId, name, sku, price });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update product
app.put('/api/products/:sku', async (req, res) => {
    try {
        const { name, price } = req.body;
        const result = await productsCollection.updateOne(
            { sku: req.params.sku },
            { $set: { name, price } }
        );
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete product
app.delete('/api/products/:sku', async (req, res) => {
    try {
        const result = await productsCollection.deleteOne({ sku: req.params.sku });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 
// This is a simple MongoDB connection using the MongoDB Node.js driver
// It connects to a MongoDB Atlas cluster using credentials stored in environment variables

// Load environment variables from .env file
require('dotenv').config();

// set mongodb connection variables
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;

// Connect to MongoDB Atlas
// using the MongoDB Node.js driver
// and export the database connection
const MongoClient = require("mongodb").MongoClient;
const atlasURI = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/?retryWrites=true`;
var database = new MongoClient(atlasURI);
module.exports = { database };
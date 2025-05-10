require('dotenv').config();
 
 const mongodb_host = process.env.MONGODB_HOST;
 const mongodb_user = process.env.MONGODB_USER;
 const mongodb_password = process.env.MONGODB_PASSWORD;
 
 const MongoClient = require("mongodb").MongoClient;
 const atlasURI = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/?retryWrites=true`;
 async function connectToDatabase() {
     const client = new MongoClient(atlasURI);
     await client.connect();
     return client;
 }
 
 const database = connectToDatabase();
 module.exports = {database};
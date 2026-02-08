/**
 * Database Configuration and Connection Management
 * Handles connections to Redis, MongoDB, and Neo4j
 */

const redis = require('redis');
const { MongoClient } = require('mongodb');
const neo4j = require('neo4j-driver');
require('dotenv').config();

class DatabaseManager {
    constructor() {
        this.redisClient = null;
        this.mongoClient = null;
        this.neo4jDriver = null;
        this.isConnected = false;
    }

    /**
     * Initialize all database connections
     */
    async connect() {
        try {
            console.log('🔌 Connecting to databases...');

            // Connect to Redis
            await this.connectRedis();

            // Connect to MongoDB
            await this.connectMongoDB();

            // Connect to Neo4j
            await this.connectNeo4j();

            this.isConnected = true;
            console.log('✅ All databases connected successfully!');
        } catch (error) {
            console.error('❌ Database connection error:', error);
            throw error;
        }
    }

    /**
     * Connect to Redis
     */
    async connectRedis() {
        try {
            this.redisClient = redis.createClient({
                socket: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: process.env.REDIS_PORT || 6379
                }
            });

            this.redisClient.on('error', (err) => {
                console.error('Redis Client Error:', err);
            });

            this.redisClient.on('connect', () => {
                console.log('📦 Redis connected');
            });

            await this.redisClient.connect();

            // Test connection
            const pong = await this.redisClient.ping();
            if (pong === 'PONG') {
                console.log('✅ Redis connection verified');
            }
        } catch (error) {
            console.error('❌ Redis connection failed:', error);
            throw error;
        }
    }

    /**
     * Connect to MongoDB
     */
    async connectMongoDB() {
        try {
            const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
            this.mongoClient = new MongoClient(uri);

            await this.mongoClient.connect();

            // Test connection
            await this.mongoClient.db('admin').command({ ping: 1 });
            console.log('✅ MongoDB connected');

            // Get database
            this.db = this.mongoClient.db(process.env.MONGODB_DB_NAME || 'airport_system');
        } catch (error) {
            console.error('❌ MongoDB connection failed:', error);
            throw error;
        }
    }

    /**
     * Connect to Neo4j
     */
    async connectNeo4j() {
        try {
            const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
            const user = process.env.NEO4J_USER || 'neo4j';
            const password = process.env.NEO4J_PASSWORD || 'airport123';

            this.neo4jDriver = neo4j.driver(
                uri,
                neo4j.auth.basic(user, password),
                {
                    maxConnectionPoolSize: 50,
                    connectionAcquisitionTimeout: 30000
                }
            );

            // Test connection
            const session = this.neo4jDriver.session();
            await session.run('RETURN 1');
            await session.close();

            console.log('✅ Neo4j connected');
        } catch (error) {
            console.error('❌ Neo4j connection failed:', error);
            throw error;
        }
    }

    /**
     * Get Redis client
     */
    getRedis() {
        if (!this.redisClient) {
            throw new Error('Redis client not initialized');
        }
        return this.redisClient;
    }

    /**
     * Get MongoDB database
     */
    getMongoDB() {
        if (!this.db) {
            throw new Error('MongoDB not initialized');
        }
        return this.db;
    }

    /**
     * Get Neo4j driver
     */
    getNeo4j() {
        if (!this.neo4jDriver) {
            throw new Error('Neo4j driver not initialized');
        }
        return this.neo4jDriver;
    }

    /**
     * Close all database connections
     */
    async disconnect() {
        try {
            console.log('🔌 Disconnecting from databases...');

            if (this.redisClient) {
                await this.redisClient.quit();
                console.log('📦 Redis disconnected');
            }

            if (this.mongoClient) {
                await this.mongoClient.close();
                console.log('📚 MongoDB disconnected');
            }

            if (this.neo4jDriver) {
                await this.neo4jDriver.close();
                console.log('🔗 Neo4j disconnected');
            }

            this.isConnected = false;
            console.log('✅ All databases disconnected');
        } catch (error) {
            console.error('❌ Error disconnecting databases:', error);
            throw error;
        }
    }

    /**
     * Check if all databases are connected
     */
    isHealthy() {
        return this.isConnected &&
            this.redisClient &&
            this.mongoClient &&
            this.neo4jDriver;
    }
}

// Create singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;
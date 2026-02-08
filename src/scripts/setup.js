/**
 * Database Setup Script
 * Initializes MongoDB collections, Neo4j schema, and Redis
 */

const dbManager = require('../config/database');

async function setupMongoDB() {
    console.log('📚 Setting up MongoDB collections...');
    const db = dbManager.getMongoDB();

    // Create collections
    const collections = [
        'flight_schedules',
        'flight_history',
        'flight_telemetry',
        'passengers',
        'alerts',
        'kpi_metrics'
    ];

    for (const collectionName of collections) {
        try {
            await db.createCollection(collectionName);
            console.log(`  ✅ Created collection: ${collectionName}`);
        } catch (error) {
            if (error.code === 48) {
                console.log(`  ℹ️  Collection already exists: ${collectionName}`);
            } else {
                throw error;
            }
        }
    }

    // Create indexes
    console.log('📑 Creating indexes...');

    // Flight schedules indexes
    await db.collection('flight_schedules').createIndex({ flight_number: 1 });
    await db.collection('flight_schedules').createIndex({ departure_time: 1 });
    await db.collection('flight_schedules').createIndex({ status: 1 });

    // Flight history indexes
    await db.collection('flight_history').createIndex({ flight_number: 1 });
    await db.collection('flight_history').createIndex({ timestamp: -1 });

    // Flight telemetry indexes
    await db.collection('flight_telemetry').createIndex({ flight_id: 1 });
    await db.collection('flight_telemetry').createIndex({ timestamp: -1 });

    // Passengers indexes
    await db.collection('passengers').createIndex({ flight_number: 1 });
    await db.collection('passengers').createIndex({ passenger_id: 1 }, { unique: true });

    // Alerts indexes
    await db.collection('alerts').createIndex({ timestamp: -1 });
    await db.collection('alerts').createIndex({ type: 1 });
    await db.collection('alerts').createIndex({ resolved: 1 });

    console.log('✅ MongoDB collections and indexes created');
}

async function setupNeo4j() {
    console.log('🔗 Setting up Neo4j schema...');
    const driver = dbManager.getNeo4j();
    const session = driver.session();

    try {
        // Create constraints
        await session.run(`
            CREATE CONSTRAINT flight_number_unique IF NOT EXISTS
            FOR (f:Flight) REQUIRE f.flight_number IS UNIQUE
        `);

        await session.run(`
            CREATE CONSTRAINT gate_id_unique IF NOT EXISTS
            FOR (g:Gate) REQUIRE g.gate_id IS UNIQUE
        `);

        // Create indexes
        await session.run(`
            CREATE INDEX flight_status IF NOT EXISTS
            FOR (f:Flight) ON (f.status)
        `);

        await session.run(`
            CREATE INDEX gate_status IF NOT EXISTS
            FOR (g:Gate) ON (g.status)
        `);

        // Create sample gates
        await session.run(`
            MERGE (g1:Gate {gate_id: 'A1', terminal: 'A', status: 'available'})
            MERGE (g2:Gate {gate_id: 'A2', terminal: 'A', status: 'available'})
            MERGE (g3:Gate {gate_id: 'A3', terminal: 'A', status: 'available'})
            MERGE (g4:Gate {gate_id: 'B1', terminal: 'B', status: 'available'})
            MERGE (g5:Gate {gate_id: 'B2', terminal: 'B', status: 'available'})
            MERGE (g6:Gate {gate_id: 'B3', terminal: 'B', status: 'available'})
            MERGE (g7:Gate {gate_id: 'C1', terminal: 'C', status: 'available'})
            MERGE (g8:Gate {gate_id: 'C2', terminal: 'C', status: 'available'})
        `);

        console.log('✅ Neo4j schema created successfully');
    } finally {
        await session.close();
    }
}

async function setupRedis() {
    console.log('📦 Setting up Redis...');
    const redis = dbManager.getRedis();

    // Clear any existing data (optional)
    // await redis.flushDb();

    // Set initial configuration
    await redis.set('system:status', 'initialized');
    await redis.set('system:setup_time', new Date().toISOString());

    console.log('✅ Redis initialized');
}

async function main() {
    try {
        console.log('🚀 Starting database setup...\n');

        // Connect to all databases
        await dbManager.connect();

        // Setup each database
        await setupNeo4j();
        await setupMongoDB();
        await setupRedis();

        console.log('\n✅ Database setup completed successfully!');
        console.log('You can now run: node scripts/seedData.js');

        process.exit(0);
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

// Run setup
main();
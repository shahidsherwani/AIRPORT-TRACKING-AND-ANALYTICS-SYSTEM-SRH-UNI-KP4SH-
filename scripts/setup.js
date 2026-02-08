/**
 * Setup Script - Initialize Database Schema and Sample Data
 */

const dbManager = require('../src/config/database');

async function setupNeo4j() {
    console.log('🔗 Setting up Neo4j schema...');

    const driver = dbManager.getNeo4j();
    const session = driver.session();

    try {
        // Create constraints
        await session.run(`
    CREATE CONSTRAINT flight_number IF NOT EXISTS
    FOR (f:Flight) REQUIRE f.flightNumber IS UNIQUE
    `);

        await session.run(`
    CREATE CONSTRAINT gate_number IF NOT EXISTS
    FOR (g:Gate) REQUIRE g.gateNumber IS UNIQUE
    `);

        // Create sample terminals
        await session.run(`
    MERGE (t1:Terminal {terminalName: 'Terminal 1'})
    MERGE (t2:Terminal {terminalName: 'Terminal 2'})
    MERGE (t3:Terminal {terminalName: 'Terminal 3'})
    `);

        // Create sample gates
        const gates = [
            'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8',
            'B1', 'B2', 'B3', 'B4', 'B5', 'B6',
            'C1', 'C2', 'C3', 'C4', 'C5', 'C6'
        ];

        for (const gate of gates) {
            const terminal = gate.startsWith('A') ? 'Terminal 1' :
                gate.startsWith('B') ? 'Terminal 2' : 'Terminal 3';

            await session.run(`
        MERGE (g:Gate {gateNumber: $gate, status: 'available', capacity: 200})
        WITH g
        MATCH (t:Terminal {terminalName: $terminal})
        MERGE (g)-[:BELONGS_TO]->(t)
    `, { gate, terminal });
        }

        // Create airport zones
        await session.run(`
    MERGE (a:Airport {
        name: 'Frankfurt Airport',
        icao: 'EDDF',
        latitude: 50.0379,
        longitude: 8.5622
    })
    MERGE (z1:Zone {
        name: 'Approach Zone',
        latitude: 50.0379,
        longitude: 8.5622,
        radiusMeters: 10000
    })
    MERGE (z2:Zone {
        name: 'Terminal Zone',
        latitude: 50.0379,
        longitude: 8.5622,
        radiusMeters: 2000
    })
    MERGE (a)-[:HAS_ZONE]->(z1)
    MERGE (a)-[:HAS_ZONE]->(z2)
    `);

        console.log('✅ Neo4j schema created successfully');
    } catch (error) {
        console.error('❌ Error setting up Neo4j:', error);
    } finally {
        await session.close();
    }
}

async function setupMongoDB() {
    console.log('📚 Setting up MongoDB collections...');

    const db = dbManager.getMongoDB();

    try {
        // Create collections
        const collections = [
            'flight_schedules',
            'flight_history',
            'flight_telemetry'
        ];

        for (const collName of collections) {
            const exists = await db.listCollections({ name: collName }).hasNext();
            if (!exists) {
                await db.createCollection(collName);
                console.log(`  ✓ Created collection: ${collName}`);
            }
        }

        // Create indexes
        await db.collection('flight_schedules').createIndex({ flightNumber: 1 });
        await db.collection('flight_schedules').createIndex({ 'departure.scheduled': 1 });
        await db.collection('flight_history').createIndex({ date: -1 });
        await db.collection('flight_history').createIndex({ airline: 1 });
        await db.collection('flight_telemetry').createIndex({ flightNumber: 1, timestamp: 1 });

        console.log('✅ MongoDB collections and indexes created');
    } catch (error) {
        console.error('❌ Error setting up MongoDB:', error);
    }
}

async function setupRedis() {
    console.log('📦 Setting up Redis...');

    const redis = dbManager.getRedis();

    try {
        // Initialize KPI counters
        await redis.set('kpi:flights:total', '0');
        await redis.set('kpi:flights:delayed', '0');
        await redis.set('kpi:flights:ontime', '0');

        console.log('✅ Redis initialized');
    } catch (error) {
        console.error('❌ Error setting up Redis:', error);
    }
}

async function main() {
    try {
        console.log('🚀 Starting database setup...\n');

        // Connect to databases
        await dbManager.connect();

        // Setup each database
        await setupNeo4j();
        await setupMongoDB();
        await setupRedis();

        console.log('\n✅ Database setup completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Run: npm run seed (to add sample data)');
        console.log('2. Run: npm start (to start the server)');

    } catch (error) {
        console.error('\n❌ Setup failed:', error);
        process.exit(1);
    } finally {
        await dbManager.disconnect();
        process.exit(0);
    }
}

// Run setup
main();
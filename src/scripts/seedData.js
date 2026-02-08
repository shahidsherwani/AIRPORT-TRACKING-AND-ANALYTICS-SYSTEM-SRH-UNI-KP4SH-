/**
 * Database Seed Script
 * Populates databases with sample data for testing
 */

const dbManager = require('../config/database');

// Sample flight data
const sampleFlights = [
    {
        flight_number: 'LH400',
        airline: 'Lufthansa',
        origin: 'EDDF',
        destination: 'KJFK',
        departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000),
        arrival_time: new Date(Date.now() + 10 * 60 * 60 * 1000),
        status: 'scheduled',
        aircraft_type: 'A380',
        gate: 'A1'
    },
    {
        flight_number: 'LH401',
        airline: 'Lufthansa',
        origin: 'KJFK',
        destination: 'EDDF',
        departure_time: new Date(Date.now() + 1 * 60 * 60 * 1000),
        arrival_time: new Date(Date.now() + 9 * 60 * 60 * 1000),
        status: 'boarding',
        aircraft_type: 'A380',
        gate: 'A2'
    },
    {
        flight_number: 'BA902',
        airline: 'British Airways',
        origin: 'EDDF',
        destination: 'EGLL',
        departure_time: new Date(Date.now() + 3 * 60 * 60 * 1000),
        arrival_time: new Date(Date.now() + 4.5 * 60 * 60 * 1000),
        status: 'scheduled',
        aircraft_type: 'B777',
        gate: 'B1'
    },
    {
        flight_number: 'AF1234',
        airline: 'Air France',
        origin: 'LFPG',
        destination: 'EDDF',
        departure_time: new Date(Date.now() - 1 * 60 * 60 * 1000),
        arrival_time: new Date(Date.now() + 0.5 * 60 * 60 * 1000),
        status: 'in_flight',
        aircraft_type: 'A320',
        gate: 'B2'
    },
    {
        flight_number: 'EK44',
        airline: 'Emirates',
        origin: 'OMDB',
        destination: 'EDDF',
        departure_time: new Date(Date.now() - 5 * 60 * 60 * 1000),
        arrival_time: new Date(Date.now() + 1 * 60 * 60 * 1000),
        status: 'approaching',
        aircraft_type: 'A380',
        gate: 'C1'
    },
    {
        flight_number: 'UA960',
        airline: 'United Airlines',
        origin: 'EDDF',
        destination: 'KORD',
        departure_time: new Date(Date.now() + 4 * 60 * 60 * 1000),
        arrival_time: new Date(Date.now() + 13 * 60 * 60 * 1000),
        status: 'scheduled',
        aircraft_type: 'B787',
        gate: 'C2'
    },
    {
        flight_number: 'TK1590',
        airline: 'Turkish Airlines',
        origin: 'LTFM',
        destination: 'EDDF',
        departure_time: new Date(Date.now() - 2 * 60 * 60 * 1000),
        arrival_time: new Date(Date.now() + 0.5 * 60 * 60 * 1000),
        status: 'in_flight',
        aircraft_type: 'A321',
        gate: 'A3'
    },
    {
        flight_number: 'QR68',
        airline: 'Qatar Airways',
        origin: 'OTHH',
        destination: 'EDDF',
        departure_time: new Date(Date.now() - 4 * 60 * 60 * 1000),
        arrival_time: new Date(Date.now() + 1.5 * 60 * 60 * 1000),
        status: 'approaching',
        aircraft_type: 'B777',
        gate: 'B3'
    }
];

async function seedMongoDB() {
    console.log('📅 Seeding flight schedules...');
    const db = dbManager.getMongoDB();

    // Clear existing data
    await db.collection('flight_schedules').deleteMany({});
    await db.collection('flight_history').deleteMany({});
    await db.collection('flight_telemetry').deleteMany({});
    await db.collection('passengers').deleteMany({});

    // Insert flight schedules
    const result = await db.collection('flight_schedules').insertMany(sampleFlights);
    console.log(`✅ Inserted ${result.insertedCount} flight schedules`);

    // Generate historical data (last 30 days)
    console.log('📜 Seeding flight history...');
    const historyData = [];
    for (let i = 0; i < 30; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        for (const flight of sampleFlights.slice(0, 4)) {
            historyData.push({
                flight_number: flight.flight_number,
                date: date,
                status: 'completed',
                on_time: Math.random() > 0.2,
                delay_minutes: Math.random() > 0.8 ? Math.floor(Math.random() * 60) : 0
            });
        }
    }
    const historyResult = await db.collection('flight_history').insertMany(historyData);
    console.log(`✅ Inserted ${historyResult.insertedCount} historical records`);

    // Generate telemetry data
    console.log('🛫 Seeding flight telemetry...');
    const telemetryData = [];
    for (const flight of sampleFlights.filter(f => f.status === 'in_flight' || f.status === 'approaching')) {
        for (let i = 0; i < 20; i++) {
            telemetryData.push({
                flight_id: flight.flight_number,
                timestamp: new Date(Date.now() - i * 5 * 60 * 1000),
                latitude: 50.0379 + (Math.random() - 0.5) * 2,
                longitude: 8.5622 + (Math.random() - 0.5) * 2,
                altitude: 30000 + Math.random() * 5000,
                speed: 450 + Math.random() * 100,
                heading: Math.random() * 360
            });
        }
    }
    const telemetryResult = await db.collection('flight_telemetry').insertMany(telemetryData);
    console.log(`✅ Inserted ${telemetryResult.insertedCount} telemetry points`);

    // Generate passenger data
    console.log('👥 Seeding passenger data...');
    const passengerData = [];
    for (const flight of sampleFlights) {
        const passengerCount = Math.floor(Math.random() * 200) + 50;
        for (let i = 0; i < passengerCount; i++) {
            passengerData.push({
                passenger_id: `${flight.flight_number}-P${i + 1}`,
                flight_number: flight.flight_number,
                name: `Passenger ${i + 1}`,
                seat: `${Math.floor(Math.random() * 30) + 1}${String.fromCharCode(65 + Math.floor(Math.random() * 6))}`,
                checked_in: Math.random() > 0.3
            });
        }
    }
    const passengerResult = await db.collection('passengers').insertMany(passengerData);
    console.log(`✅ Inserted ${passengerResult.insertedCount} passenger records`);
}

async function seedNeo4j() {
    console.log('🔗 Seeding Neo4j flight-gate assignments...');
    const driver = dbManager.getNeo4j();
    const session = driver.session();

    try {
        // Clear existing flights
        await session.run('MATCH (f:Flight) DETACH DELETE f');

        // Create flights and assign to gates
        for (const flight of sampleFlights) {
            await session.run(`
                MERGE (f:Flight {
                    flight_number: $flight_number,
                    airline: $airline,
                    status: $status,
                    aircraft_type: $aircraft_type
                })
                WITH f
                MATCH (g:Gate {gate_id: $gate})
                MERGE (f)-[:ASSIGNED_TO]->(g)
                SET g.status = 'occupied'
            `, {
                flight_number: flight.flight_number,
                airline: flight.airline,
                status: flight.status,
                aircraft_type: flight.aircraft_type,
                gate: flight.gate
            });
        }

        console.log(`✅ Created ${sampleFlights.length} flight-gate assignments`);
    } finally {
        await session.close();
    }
}

async function seedRedis() {
    console.log('📦 Seeding Redis live data...');
    const redis = dbManager.getRedis();

    // Store live aircraft positions
    for (const flight of sampleFlights.filter(f => f.status === 'in_flight' || f.status === 'approaching')) {
        const position = {
            flight_number: flight.flight_number,
            latitude: 50.0379 + (Math.random() - 0.5) * 2,
            longitude: 8.5622 + (Math.random() - 0.5) * 2,
            altitude: 30000 + Math.random() * 5000,
            speed: 450 + Math.random() * 100,
            heading: Math.random() * 360,
            timestamp: new Date().toISOString()
        };

        await redis.set(
            `flight:live:${flight.flight_number}`,
            JSON.stringify(position),
            { EX: 300 } // Expire after 5 minutes
        );
    }

    console.log('✅ Seeded live aircraft positions');
}

async function main() {
    try {
        console.log('🌱 Starting data seeding...\n');

        // Connect to all databases
        await dbManager.connect();

        // Seed each database
        await seedMongoDB();
        await seedNeo4j();
        await seedRedis();

        console.log('\n✅ Data seeding completed successfully!');
        console.log('You can now start the server: npm start');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

// Run seeding
main();
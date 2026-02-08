/**
 * Seed Script - Add Sample Data for Testing
 */

const dbManager = require('../src/config/database');

// Sample flight data
const sampleFlights = [
    { flightNumber: 'LH400', airline: 'Lufthansa', airlineCode: 'LH', departure: 'FRA', arrival: 'JFK', gate: 'A1' },
    { flightNumber: 'BA902', airline: 'British Airways', airlineCode: 'BA', departure: 'FRA', arrival: 'LHR', gate: 'A2' },
    { flightNumber: 'AF1518', airline: 'Air France', airlineCode: 'AF', departure: 'FRA', arrival: 'CDG', gate: 'A3' },
    { flightNumber: 'LH454', airline: 'Lufthansa', airlineCode: 'LH', departure: 'FRA', arrival: 'LAX', gate: 'B1' },
    { flightNumber: 'UA960', airline: 'United Airlines', airlineCode: 'UA', departure: 'FRA', arrival: 'ORD', gate: 'B2' },
    { flightNumber: 'EK44', airline: 'Emirates', airlineCode: 'EK', departure: 'FRA', arrival: 'DXB', gate: 'C1' },
    { flightNumber: 'TK1590', airline: 'Turkish Airlines', airlineCode: 'TK', departure: 'FRA', arrival: 'IST', gate: 'C2' },
    { flightNumber: 'LH716', airline: 'Lufthansa', airlineCode: 'LH', departure: 'FRA', arrival: 'PEK', gate: 'A4' },
];

async function seedFlightSchedules() {
    console.log('📅 Seeding flight schedules...');

    const db = dbManager.getMongoDB();
    const collection = db.collection('flight_schedules');

    const now = new Date();
    const schedules = sampleFlights.map((flight, index) => {
        const departureTime = new Date(now);
        departureTime.setHours(now.getHours() + index + 1);

        const arrivalTime = new Date(departureTime);
        arrivalTime.setHours(arrivalTime.getHours() + 8);

        return {
            flightNumber: flight.flightNumber,
            airline: flight.airline,
            airlineCode: flight.airlineCode,
            departure: {
                airport: 'Frankfurt Airport',
                iata: flight.departure,
                scheduled: departureTime.toISOString(),
                terminal: flight.gate.startsWith('A') ? 'Terminal 1' :
                    flight.gate.startsWith('B') ? 'Terminal 2' : 'Terminal 3',
                gate: flight.gate
            },
            arrival: {
                airport: 'Destination Airport',
                iata: flight.arrival,
                scheduled: arrivalTime.toISOString()
            },
            status: index % 3 === 0 ? 'delayed' : 'active',
            delayMinutes: index % 3 === 0 ? 15 + (index * 5) : 0,
            aircraft: {
                registration: `D-AI${flight.airlineCode}`,
                iata: 'A320',
                icao: 'A320'
            }
        };
    });

    await collection.insertMany(schedules);
    console.log(`✅ Inserted ${schedules.length} flight schedules`);
}

async function seedFlightHistory() {
    console.log('📜 Seeding flight history...');

    const db = dbManager.getMongoDB();
    const collection = db.collection('flight_history');

    const history = [];
    const now = new Date();

    // Generate 30 days of history
    for (let day = 0; day < 30; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() - day);

        for (const flight of sampleFlights) {
            history.push({
                flightNumber: flight.flightNumber,
                airline: flight.airline,
                date: date,
                departure: flight.departure,
                arrival: flight.arrival,
                status: Math.random() > 0.2 ? 'active' : 'delayed',
                delayMinutes: Math.random() > 0.2 ? 0 : Math.floor(Math.random() * 60) + 10
            });
        }
    }

    await collection.insertMany(history);
    console.log(`✅ Inserted ${history.length} historical records`);
}

async function seedFlightTelemetry() {
    console.log('🛫 Seeding flight telemetry...');

    const db = dbManager.getMongoDB();
    const collection = db.collection('flight_telemetry');

    const telemetry = [];
    const now = new Date();
    now.setHours(now.getHours() - 2); // 2 hours ago

    // Generate telemetry for one sample flight
    const flight = sampleFlights[0];
    const startLat = 50.0379; // Frankfurt
    const startLon = 8.5622;
    const endLat = 40.6413; // New York
    const endLon = -73.7781;

    // Generate 100 points along the route
    for (let i = 0; i < 100; i++) {
        const progress = i / 100;
        const timestamp = new Date(now);
        timestamp.setMinutes(timestamp.getMinutes() + (i * 5));

        telemetry.push({
            flightNumber: flight.flightNumber,
            timestamp: timestamp,
            latitude: startLat + (endLat - startLat) * progress,
            longitude: startLon + (endLon - startLon) * progress,
            altitude: 35000 + Math.sin(progress * Math.PI) * 5000,
            speed: 450 + Math.random() * 50,
            heading: 270,
            verticalRate: Math.sin(progress * Math.PI * 2) * 1000
        });
    }

    await collection.insertMany(telemetry);
    console.log(`✅ Inserted ${telemetry.length} telemetry points`);
}

async function seedNeo4jFlightGates() {
    console.log('🔗 Seeding Neo4j flight-gate assignments...');

    const driver = dbManager.getNeo4j();
    const session = driver.session();

    try {
        for (const flight of sampleFlights) {
            await session.run(`
        MERGE (f:Flight {flightNumber: $flightNumber})
        SET f.airline = $airline
        WITH f
        MATCH (g:Gate {gateNumber: $gate})
        MERGE (f)-[:ASSIGNED_TO]->(g)
      `, {
                flightNumber: flight.flightNumber,
                airline: flight.airline,
                gate: flight.gate
            });
        }

        console.log(`✅ Created ${sampleFlights.length} flight-gate assignments`);
    } finally {
        await session.close();
    }
}

async function seedRedisLiveData() {
    console.log('📦 Seeding Redis live data...');

    const redis = dbManager.getRedis();

    // Seed some sample aircraft positions
    const positions = [
        { callsign: 'LH400', lat: 50.1, lon: 8.6, alt: 5000, vel: 250, hdg: 90 },
        { callsign: 'BA902', lat: 50.2, lon: 8.7, alt: 8000, vel: 300, hdg: 270 },
        { callsign: 'AF1518', lat: 50.0, lon: 8.5, alt: 2000, vel: 180, hdg: 180 },
    ];

    for (const pos of positions) {
        await redis.hSet(`aircraft:${pos.callsign}:position`, {
            callsign: pos.callsign,
            latitude: pos.lat.toString(),
            longitude: pos.lon.toString(),
            altitude: pos.alt.toString(),
            velocity: pos.vel.toString(),
            heading: pos.hdg.toString(),
            on_ground: 'false',
            last_update: new Date().toISOString()
        });

        await redis.expire(`aircraft:${pos.callsign}:position`, 300);
    }

    // Update KPI counters
    await redis.set('kpi:flights:total', sampleFlights.length.toString());
    await redis.set('kpi:flights:delayed', '2');
    await redis.set('kpi:flights:ontime', (sampleFlights.length - 2).toString());

    console.log(`✅ Seeded ${positions.length} live aircraft positions`);
}

async function main() {
    try {
        console.log('🌱 Starting data seeding...\n');

        // Connect to databases
        await dbManager.connect();

        // Seed data
        await seedFlightSchedules();
        await seedFlightHistory();
        await seedFlightTelemetry();
        await seedNeo4jFlightGates();
        await seedRedisLiveData();

        console.log('\n✅ Data seeding completed successfully!');
        console.log('\nYou can now:');
        console.log('1. Run: npm start (to start the server)');
        console.log('2. Visit: http://localhost:8080');

    } catch (error) {
        console.error('\n❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await dbManager.disconnect();
        process.exit(0);
    }
}

// Run seeding
main();
/**
 * Demo Data Generator for Exam Presentation
 * Generates realistic flight data when APIs are unavailable
 */

const Redis = require('redis');

// Frankfurt Airport coordinates
const FRANKFURT_AIRPORT = {
    latitude: 50.0379,
    longitude: 8.5622,
    name: 'Frankfurt Airport',
    code: 'FRA'
};

// Demo flight data with various scenarios
const DEMO_FLIGHTS = [
    // Critical altitude violation - outside airport zone
    {
        callsign: 'DLH401',
        latitude: 50.2500,
        longitude: 8.7500,
        altitude: 450,  // CRITICAL - below 500ft
        velocity: 180,
        heading: 270,
        on_ground: false
    },
    // High altitude warning - outside airport zone
    {
        callsign: 'UAL902',
        latitude: 50.3000,
        longitude: 8.3000,
        altitude: 650,  // HIGH - 500-750ft
        velocity: 200,
        heading: 90,
        on_ground: false
    },
    // Medium altitude warning - outside airport zone
    {
        callsign: 'BAW117',
        latitude: 50.1500,
        longitude: 8.8000,
        altitude: 850,  // MEDIUM - 750-1000ft
        velocity: 220,
        heading: 180,
        on_ground: false
    },
    // Low altitude but IN airport zone (approach) - SAFE
    {
        callsign: 'AFR1234',
        latitude: 50.0500,
        longitude: 8.5800,
        altitude: 800,  // Low but in approach zone
        velocity: 160,
        heading: 270,
        on_ground: false
    },
    // Low altitude but IN airport zone (departure) - SAFE
    {
        callsign: 'KLM643',
        latitude: 50.0300,
        longitude: 8.5400,
        altitude: 600,  // Low but in departure zone
        velocity: 140,
        heading: 90,
        on_ground: false
    },
    // Normal cruising altitude
    {
        callsign: 'EZY8492',
        latitude: 50.5000,
        longitude: 8.5000,
        altitude: 35000,
        velocity: 450,
        heading: 45,
        on_ground: false
    },
    // Another cruising flight
    {
        callsign: 'RYR7384',
        latitude: 49.8000,
        longitude: 8.2000,
        altitude: 38000,
        velocity: 460,
        heading: 225,
        on_ground: false
    },
    // Collision risk pair 1 - CRITICAL (< 5km, similar altitude)
    {
        callsign: 'SWR123',
        latitude: 50.1000,
        longitude: 8.6000,
        altitude: 25000,
        velocity: 420,
        heading: 180,
        on_ground: false
    },
    {
        callsign: 'AUA456',
        latitude: 50.1300,
        longitude: 8.6100,
        altitude: 25500,  // Only 500ft difference
        velocity: 415,
        heading: 175,
        on_ground: false
    },
    // Collision risk pair 2 - WARNING (5-10km, similar altitude)
    {
        callsign: 'IBE789',
        latitude: 50.2000,
        longitude: 8.7000,
        altitude: 32000,
        velocity: 440,
        heading: 90,
        on_ground: false
    },
    {
        callsign: 'TAP321',
        latitude: 50.2500,
        longitude: 8.7500,
        altitude: 32800,  // 800ft difference
        velocity: 435,
        heading: 85,
        on_ground: false
    },
    // Safe separation - different altitudes
    {
        callsign: 'WZZ1234',
        latitude: 50.3000,
        longitude: 8.4000,
        altitude: 28000,
        velocity: 430,
        heading: 270,
        on_ground: false
    },
    {
        callsign: 'FIN567',
        latitude: 50.3100,
        longitude: 8.4100,
        altitude: 38000,  // 10,000ft difference - SAFE
        velocity: 445,
        heading: 265,
        on_ground: false
    },
    // Aircraft on ground
    {
        callsign: 'DLH888',
        latitude: 50.0379,
        longitude: 8.5622,
        altitude: 0,
        velocity: 0,
        heading: 0,
        on_ground: true
    },
    // Descending for approach
    {
        callsign: 'EIN234',
        latitude: 50.0800,
        longitude: 8.6500,
        altitude: 3500,
        velocity: 180,
        heading: 270,
        on_ground: false
    },
    // Climbing after departure
    {
        callsign: 'SAS901',
        latitude: 50.0100,
        longitude: 8.5000,
        altitude: 4500,
        velocity: 200,
        heading: 45,
        on_ground: false
    }
];

async function generateDemoData() {
    console.log('🎬 Generating demo data for exam presentation...\n');

    const redis = Redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    try {
        await redis.connect();
        console.log('✅ Connected to Redis\n');

        // Clear existing aircraft data
        const existingKeys = await redis.keys('aircraft:*:position');
        if (existingKeys.length > 0) {
            await redis.del(existingKeys);
            console.log(`🗑️  Cleared ${existingKeys.length} existing aircraft positions\n`);
        }

        // Store demo flights
        let stored = 0;
        for (const flight of DEMO_FLIGHTS) {
            const key = `aircraft:${flight.callsign}:position`;

            await redis.hSet(key, {
                callsign: flight.callsign,
                latitude: flight.latitude.toString(),
                longitude: flight.longitude.toString(),
                altitude: flight.altitude.toString(),
                velocity: flight.velocity.toString(),
                heading: flight.heading.toString(),
                on_ground: flight.on_ground.toString(),
                last_update: new Date().toISOString()
            });

            stored++;

            // Log interesting scenarios
            if (flight.altitude < 1000 && !flight.on_ground) {
                console.log(`⚠️  ${flight.callsign}: Low altitude ${flight.altitude}ft at (${flight.latitude.toFixed(4)}, ${flight.longitude.toFixed(4)})`);
            }
        }

        console.log(`\n✅ Stored ${stored} demo aircraft in Redis\n`);

        // Display summary
        console.log('📊 Demo Data Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        const critical = DEMO_FLIGHTS.filter(f => f.altitude < 500 && !f.on_ground).length;
        const high = DEMO_FLIGHTS.filter(f => f.altitude >= 500 && f.altitude < 750 && !f.on_ground).length;
        const medium = DEMO_FLIGHTS.filter(f => f.altitude >= 750 && f.altitude < 1000 && !f.on_ground).length;
        const cruising = DEMO_FLIGHTS.filter(f => f.altitude >= 10000).length;
        const onGround = DEMO_FLIGHTS.filter(f => f.on_ground).length;

        console.log(`\n🛫 Total Aircraft: ${DEMO_FLIGHTS.length}`);
        console.log(`   • Critical Altitude (<500ft): ${critical}`);
        console.log(`   • High Warning (500-750ft): ${high}`);
        console.log(`   • Medium Warning (750-1000ft): ${medium}`);
        console.log(`   • Cruising (>10,000ft): ${cruising}`);
        console.log(`   • On Ground: ${onGround}`);

        console.log('\n⚠️  Collision Scenarios:');
        console.log('   • CRITICAL pair: SWR123 & AUA456 (~3km apart, 500ft altitude diff)');
        console.log('   • WARNING pair: IBE789 & TAP321 (~7km apart, 800ft altitude diff)');
        console.log('   • SAFE pair: WZZ1234 & FIN567 (close but 10,000ft altitude diff)');

        console.log('\n📉 Altitude Scenarios:');
        console.log('   • DLH401: CRITICAL violation (450ft, outside airport zone)');
        console.log('   • UAL902: HIGH warning (650ft, outside airport zone)');
        console.log('   • BAW117: MEDIUM warning (850ft, outside airport zone)');
        console.log('   • AFR1234: Low but SAFE (800ft, in approach zone)');
        console.log('   • KLM643: Low but SAFE (600ft, in departure zone)');

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🎉 Demo data ready for presentation!');
        console.log('\n📱 Open your dashboards:');
        console.log('   • Main: http://localhost:3000/');
        console.log('   • Collision: http://localhost:3000/collision');
        console.log('   • Altitude: http://localhost:3000/altitude');
        console.log('\n💡 This data will persist until you restart Redis or regenerate it.\n');

    } catch (error) {
        console.error('❌ Error generating demo data:', error);
        process.exit(1);
    } finally {
        await redis.quit();
    }
}

// Run if called directly
if (require.main === module) {
    generateDemoData()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { generateDemoData, DEMO_FLIGHTS };
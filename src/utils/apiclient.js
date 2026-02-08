/**
 * API Client for fetching flight data from external sources
 * OpenSky Network and AviationStack
 */

const axios = require('axios');
require('dotenv').config();

class APIClient {
    constructor() {
        this.aviationStackKey = process.env.AVIATIONSTACK_API_KEY;
        this.aviationStackBaseURL = 'http://api.aviationstack.com/v1';
        this.openSkyBaseURL = 'https://opensky-network.org/api';

        // Airport configuration
        this.airportICAO = process.env.AIRPORT_ICAO || 'EDDF';
        this.airportLat = parseFloat(process.env.AIRPORT_LATITUDE || '50.0379');
        this.airportLon = parseFloat(process.env.AIRPORT_LONGITUDE || '8.5622');
        this.airportRadius = parseFloat(process.env.AIRPORT_ZONE_RADIUS_KM || '10');
    }

    /**
     * Fetch live aircraft positions from OpenSky Network
     * Free API - no key required
     */
    async getOpenSkyFlights() {
        try {
            // Calculate bounding box around airport
            const latDelta = this.airportRadius / 111; // 1 degree lat ≈ 111 km
            const lonDelta = this.airportRadius / (111 * Math.cos(this.airportLat * Math.PI / 180));

            const lamin = this.airportLat - latDelta;
            const lamax = this.airportLat + latDelta;
            const lomin = this.airportLon - lonDelta;
            const lomax = this.airportLon + lonDelta;

            const url = `${this.openSkyBaseURL}/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`;

            console.log('📡 Fetching OpenSky data...');
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'AirportTrackingSystem/1.0'
                }
            });

            if (!response.data || !response.data.states) {
                return [];
            }

            // Transform OpenSky data format
            const flights = response.data.states.map(state => ({
                callsign: state[1] ? state[1].trim() : 'UNKNOWN',
                origin_country: state[2],
                longitude: state[5],
                latitude: state[6],
                altitude: state[7] ? state[7] * 3.28084 : 0, // Convert meters to feet
                velocity: state[9] ? state[9] * 1.94384 : 0, // Convert m/s to knots
                heading: state[10] || 0,
                vertical_rate: state[11] || 0,
                on_ground: state[8] || false,
                last_contact: state[4],
                timestamp: new Date().toISOString()
            }));

            console.log(`✅ Fetched ${flights.length} flights from OpenSky`);
            return flights;
        } catch (error) {
            console.error('❌ OpenSky API error:', error.message);
            return [];
        }
    }

    /**
     * Fetch flight schedules from AviationStack
     * Requires API key
     */
    async getAviationStackFlights() {
        try {
            if (!this.aviationStackKey) {
                console.warn('⚠️  AviationStack API key not configured');
                return [];
            }

            const url = `${this.aviationStackBaseURL}/flights`;
            const params = {
                access_key: this.aviationStackKey,
                dep_iata: this.airportICAO.substring(1), // Convert ICAO to IATA
                limit: 100
            };

            console.log('📡 Fetching AviationStack data...');
            const response = await axios.get(url, {
                params,
                timeout: 10000
            });

            if (!response.data || !response.data.data) {
                return [];
            }

            // Transform AviationStack data
            const flights = response.data.data.map(flight => ({
                flightNumber: flight.flight.iata || flight.flight.icao,
                airline: flight.airline.name,
                airlineCode: flight.airline.iata,
                departure: {
                    airport: flight.departure.airport,
                    iata: flight.departure.iata,
                    scheduled: flight.departure.scheduled,
                    estimated: flight.departure.estimated,
                    actual: flight.departure.actual,
                    terminal: flight.departure.terminal,
                    gate: flight.departure.gate
                },
                arrival: {
                    airport: flight.arrival.airport,
                    iata: flight.arrival.iata,
                    scheduled: flight.arrival.scheduled,
                    estimated: flight.arrival.estimated,
                    actual: flight.arrival.actual,
                    terminal: flight.arrival.terminal,
                    gate: flight.arrival.gate
                },
                status: flight.flight_status,
                aircraft: {
                    registration: flight.aircraft?.registration,
                    iata: flight.aircraft?.iata,
                    icao: flight.aircraft?.icao
                }
            }));

            console.log(`✅ Fetched ${flights.length} flights from AviationStack`);
            return flights;
        } catch (error) {
            console.error('❌ AviationStack API error:', error.message);
            return [];
        }
    }

    /**
     * Get combined flight data from both sources
     */
    async getAllFlights() {
        try {
            const [openSkyFlights, aviationStackFlights] = await Promise.all([
                this.getOpenSkyFlights(),
                this.getAviationStackFlights()
            ]);

            return {
                livePositions: openSkyFlights,
                schedules: aviationStackFlights,
                timestamp: new Date().toISOString(),
                totalLive: openSkyFlights.length,
                totalScheduled: aviationStackFlights.length
            };
        } catch (error) {
            console.error('❌ Error fetching flight data:', error);
            throw error;
        }
    }

    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRad(degrees) {
        return degrees * Math.PI / 180;
    }

    /**
     * Check if coordinates are within airport zone
     */
    isInAirportZone(lat, lon) {
        const distance = this.calculateDistance(
            this.airportLat,
            this.airportLon,
            lat,
            lon
        );
        return distance <= this.airportRadius;
    }
}

module.exports = new APIClient();
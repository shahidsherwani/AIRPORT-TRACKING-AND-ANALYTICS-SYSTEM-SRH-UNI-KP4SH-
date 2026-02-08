/**
 * Flight Monitor Routes - Use Case 1
 * Team Member: Sameer Kulkarni
 * 
 * API endpoints for flight monitoring
 */

const express = require('express');
const router = express.Router();
const flightMonitorService = require('../services/flightMonitorService');

/**
 * GET /api/flights/live
 * Get all live flights with positions and gate assignments
 */
router.get('/live', async (req, res) => {
    try {
        const flights = await flightMonitorService.getLiveFlights();

        res.json({
            success: true,
            count: flights.length,
            data: flights,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in /live endpoint:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/flights/summary
 * Get summary statistics
 * IMPORTANT: Must be before /:flightNumber to avoid route conflict
 */
router.get('/summary', async (req, res) => {
    try {
        const summary = await flightMonitorService.getSummary();

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Error in /summary endpoint:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/flights/gates/status
 * Get gate occupancy status
 */
router.get('/gates/status', async (req, res) => {
    try {
        const gates = await flightMonitorService.getGateStatus();

        res.json({
            success: true,
            count: gates.length,
            data: gates
        });
    } catch (error) {
        console.error('Error in /gates/status endpoint:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/flights/terminal/:terminalName
 * Get flights by terminal
 */
router.get('/terminal/:terminalName', async (req, res) => {
    try {
        const { terminalName } = req.params;
        const flights = await flightMonitorService.getFlightsByTerminal(terminalName);

        res.json({
            success: true,
            terminal: terminalName,
            count: flights.length,
            data: flights
        });
    } catch (error) {
        console.error('Error in /terminal/:terminalName endpoint:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/flights/:flightNumber
 * Get specific flight details
 * IMPORTANT: Must be LAST to avoid catching other routes
 */
router.get('/:flightNumber', async (req, res) => {
    try {
        const { flightNumber } = req.params;
        const flight = await flightMonitorService.getFlightDetails(flightNumber);

        if (!flight) {
            return res.status(404).json({
                success: false,
                error: 'Flight not found'
            });
        }

        res.json({
            success: true,
            data: flight
        });
    } catch (error) {
        console.error('Error in /:flightNumber endpoint:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/flights/refresh
 * Manually trigger data refresh
 */
router.post('/refresh', async (req, res) => {
    try {
        await flightMonitorService.updateFlightData();

        res.json({
            success: true,
            message: 'Flight data refreshed successfully'
        });
    } catch (error) {
        console.error('Error in /refresh endpoint:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
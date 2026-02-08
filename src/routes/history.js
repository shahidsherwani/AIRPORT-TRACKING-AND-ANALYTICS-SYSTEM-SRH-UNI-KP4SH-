/**
 * History Routes - Use Case 6
 * Team Member: Smitha Anoop
 */

const express = require('express');
const router = express.Router();
const historyService = require('../services/historyService');

router.get('/flights', async (req, res) => {
    try {
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            airline: req.query.airline,
            status: req.query.status,
            flightNumber: req.query.flightNumber,
            limit: parseInt(req.query.limit) || 100
        };
        const flights = await historyService.getFlightHistory(filters);
        res.json({ success: true, count: flights.length, data: flights });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/statistics', async (req, res) => {
    try {
        const period = req.query.period || 'week';
        const stats = await historyService.getStatistics(period);
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/airlines', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, error: 'startDate and endDate required' });
        }
        const stats = await historyService.getAirlineStatistics(startDate, endDate);
        res.json({ success: true, count: stats.length, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/export', async (req, res) => {
    try {
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            airline: req.query.airline,
            status: req.query.status
        };
        const csv = await historyService.exportToCSV(filters);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=flight-history.csv');
        res.send(csv);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/daily-counts', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const counts = await historyService.getDailyFlightCounts(days);
        res.json({ success: true, data: counts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
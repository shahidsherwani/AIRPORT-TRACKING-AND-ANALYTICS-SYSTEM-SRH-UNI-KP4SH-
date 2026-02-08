/**
 * Altitude Alert Routes - Use Case 4
 * Team Member: Prajwal Vijaykumar
 */

const express = require('express');
const router = express.Router();
const altitudeCheckService = require('../services/altitudeCheckService');

router.get('/', async (req, res) => {
    try {
        const alerts = await altitudeCheckService.getActiveAlerts();
        res.json({ success: true, count: alerts.length, data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/check', async (req, res) => {
    try {
        const alerts = await altitudeCheckService.checkAltitudeViolations();
        res.json({ success: true, count: alerts.length, data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/aircraft/:callsign', async (req, res) => {
    try {
        const { callsign } = req.params;
        const status = await altitudeCheckService.getAircraftAltitudeStatus(callsign);
        if (!status) {
            return res.status(404).json({ success: false, error: 'Aircraft not found' });
        }
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const history = await altitudeCheckService.getAlertHistory(limit);
        res.json({ success: true, count: history.length, data: history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
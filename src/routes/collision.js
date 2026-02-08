/**
 * Collision Alert Routes - Use Case 3
 * Team Member: Shambhavi Pillai
 */

const express = require('express');
const router = express.Router();
const collisionService = require('../services/collisionService');

router.get('/', async (req, res) => {
    try {
        const alerts = await collisionService.getActiveAlerts();
        res.json({ success: true, count: alerts.length, data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/check', async (req, res) => {
    try {
        const alerts = await collisionService.checkCollisionRisks();
        res.json({ success: true, count: alerts.length, data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const history = await collisionService.getAlertHistory(limit);
        res.json({ success: true, count: history.length, data: history });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/check', async (req, res) => {
    try {
        const alerts = await collisionService.checkCollisionRisks();
        res.json({ success: true, count: alerts.length, data: alerts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
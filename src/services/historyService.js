/**
 * History Service - Use Case 6
 * Team Member: Smitha Anoop
 * 
 * Provides historical flight data and analytics
 */

const dbManager = require('../config/database');

class HistoryService {
    /**
     * Get flight history with filters
     */
    async getFlightHistory(filters = {}) {
        try {
            const db = dbManager.getMongoDB();
            const query = this.buildQuery(filters);

            const flights = await db.collection('flight_history')
                .find(query)
                .sort({ date: -1 })
                .limit(filters.limit || 100)
                .toArray();

            return flights;
        } catch (error) {
            console.error('Error getting flight history:', error);
            throw error;
        }
    }

    /**
     * Build MongoDB query from filters
     */
    buildQuery(filters) {
        const query = {};

        if (filters.startDate) {
            query.date = { $gte: new Date(filters.startDate) };
        }

        if (filters.endDate) {
            query.date = { ...query.date, $lte: new Date(filters.endDate) };
        }

        if (filters.airline) {
            query.airline = filters.airline;
        }

        if (filters.status) {
            query.status = filters.status;
        }

        if (filters.flightNumber) {
            query.flightNumber = { $regex: filters.flightNumber, $options: 'i' };
        }

        return query;
    }

    /**
     * Get historical statistics
     */
    async getStatistics(period = 'week') {
        try {
            const db = dbManager.getMongoDB();
            const startDate = this.getStartDate(period);

            const stats = await db.collection('flight_history').aggregate([
                {
                    $match: {
                        date: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalFlights: { $sum: 1 },
                        delayedFlights: {
                            $sum: { $cond: [{ $eq: ['$status', 'delayed'] }, 1, 0] }
                        },
                        cancelledFlights: {
                            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                        },
                        onTimeFlights: {
                            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                        },
                        avgDelay: { $avg: '$delayMinutes' },
                        maxDelay: { $max: '$delayMinutes' },
                        totalDelayMinutes: { $sum: '$delayMinutes' }
                    }
                }
            ]).toArray();

            const result = stats[0] || {
                totalFlights: 0,
                delayedFlights: 0,
                cancelledFlights: 0,
                onTimeFlights: 0,
                avgDelay: 0,
                maxDelay: 0,
                totalDelayMinutes: 0
            };

            result.onTimePercentage = result.totalFlights > 0
                ? ((result.onTimeFlights / result.totalFlights) * 100).toFixed(2)
                : 0;

            result.period = period;
            result.startDate = startDate.toISOString();

            return result;
        } catch (error) {
            console.error('Error getting statistics:', error);
            throw error;
        }
    }

    /**
     * Get start date based on period
     */
    getStartDate(period) {
        const now = new Date();

        switch (period) {
            case 'day':
                now.setDate(now.getDate() - 1);
                break;
            case 'week':
                now.setDate(now.getDate() - 7);
                break;
            case 'month':
                now.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                now.setFullYear(now.getFullYear() - 1);
                break;
            default:
                now.setDate(now.getDate() - 7);
        }

        return now;
    }

    /**
     * Get statistics by airline
     */
    async getAirlineStatistics(startDate, endDate) {
        try {
            const db = dbManager.getMongoDB();

            const stats = await db.collection('flight_history').aggregate([
                {
                    $match: {
                        date: {
                            $gte: new Date(startDate),
                            $lte: new Date(endDate)
                        }
                    }
                },
                {
                    $group: {
                        _id: '$airline',
                        totalFlights: { $sum: 1 },
                        delayedFlights: {
                            $sum: { $cond: [{ $eq: ['$status', 'delayed'] }, 1, 0] }
                        },
                        avgDelay: { $avg: '$delayMinutes' },
                        onTimeRate: {
                            $avg: { $cond: [{ $ne: ['$status', 'delayed'] }, 1, 0] }
                        }
                    }
                },
                {
                    $sort: { totalFlights: -1 }
                }
            ]).toArray();

            return stats.map(s => ({
                airline: s._id,
                totalFlights: s.totalFlights,
                delayedFlights: s.delayedFlights,
                averageDelay: Math.round(s.avgDelay || 0),
                onTimePercentage: (s.onTimeRate * 100).toFixed(2)
            }));
        } catch (error) {
            console.error('Error getting airline statistics:', error);
            throw error;
        }
    }

    /**
     * Export flight history to CSV format
     */
    async exportToCSV(filters = {}) {
        try {
            const flights = await this.getFlightHistory(filters);

            // CSV header
            let csv = 'Flight Number,Airline,Date,Departure,Arrival,Status,Delay (min)\n';

            // CSV rows
            flights.forEach(flight => {
                csv += `${flight.flightNumber},`;
                csv += `${flight.airline},`;
                csv += `${new Date(flight.date).toISOString().split('T')[0]},`;
                csv += `${flight.departure},`;
                csv += `${flight.arrival},`;
                csv += `${flight.status},`;
                csv += `${flight.delayMinutes || 0}\n`;
            });

            return csv;
        } catch (error) {
            console.error('Error exporting to CSV:', error);
            throw error;
        }
    }

    /**
     * Get daily flight counts for chart
     */
    async getDailyFlightCounts(days = 30) {
        try {
            const db = dbManager.getMongoDB();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const counts = await db.collection('flight_history').aggregate([
                {
                    $match: {
                        date: { $gte: startDate }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$date' }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]).toArray();

            return counts.map(c => ({
                date: c._id,
                count: c.count
            }));
        } catch (error) {
            console.error('Error getting daily flight counts:', error);
            throw error;
        }
    }
}

module.exports = new HistoryService();
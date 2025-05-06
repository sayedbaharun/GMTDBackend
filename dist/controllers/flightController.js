"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFlight = exports.updateFlight = exports.createFlight = exports.getFlightById = exports.getAllFlights = void 0;
const prisma_1 = require("../lib/prisma");
// Get all flights with optional filtering
const getAllFlights = async (req, res) => {
    try {
        const { departureAirport, arrivalAirport, departureDate, returnDate, airline, minPrice, maxPrice, class: flightClass, } = req.query;
        let whereClause = {};
        if (departureAirport) {
            whereClause.departureAirport = String(departureAirport);
        }
        if (arrivalAirport) {
            whereClause.arrivalAirport = String(arrivalAirport);
        }
        if (airline) {
            whereClause.airline = String(airline);
        }
        if (flightClass) {
            whereClause.class = String(flightClass);
        }
        // Price range filtering
        if (minPrice || maxPrice) {
            whereClause.price = {};
            if (minPrice) {
                whereClause.price.gte = parseFloat(String(minPrice));
            }
            if (maxPrice) {
                whereClause.price.lte = parseFloat(String(maxPrice));
            }
        }
        // Date filtering
        if (departureDate) {
            const date = new Date(String(departureDate));
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);
            whereClause.departureTime = {
                gte: date,
                lt: nextDay,
            };
        }
        const flights = await prisma_1.prisma.flight.findMany({
            where: whereClause,
            orderBy: {
                departureTime: 'asc',
            },
        });
        return res.status(200).json({
            success: true,
            data: flights,
            count: flights.length,
        });
    }
    catch (error) {
        console.error('Error fetching flights:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch flights',
            error: error.message,
        });
    }
};
exports.getAllFlights = getAllFlights;
// Get flight by ID
const getFlightById = async (req, res) => {
    try {
        const { id } = req.params;
        const flight = await prisma_1.prisma.flight.findUnique({
            where: { id },
        });
        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found',
            });
        }
        return res.status(200).json({
            success: true,
            data: flight,
        });
    }
    catch (error) {
        console.error('Error fetching flight:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch flight',
            error: error.message,
        });
    }
};
exports.getFlightById = getFlightById;
// Create a new flight (admin only)
const createFlight = async (req, res) => {
    try {
        // In a real application, check if user is admin
        // if (req.user?.role !== 'admin') {
        //   return res.status(403).json({
        //     success: false,
        //     message: 'Not authorized to create flights',
        //   });
        // }
        const { airline, flightNumber, departureAirport, arrivalAirport, departureTime, arrivalTime, price, currency, class: flightClass, availableSeats, } = req.body;
        const flight = await prisma_1.prisma.flight.create({
            data: {
                airline,
                flightNumber,
                departureAirport,
                arrivalAirport,
                departureTime: new Date(departureTime),
                arrivalTime: new Date(arrivalTime),
                price: parseFloat(price),
                currency: currency || 'USD',
                class: flightClass || 'ECONOMY',
                availableSeats: parseInt(availableSeats, 10),
            },
        });
        return res.status(201).json({
            success: true,
            data: flight,
            message: 'Flight created successfully',
        });
    }
    catch (error) {
        console.error('Error creating flight:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to create flight',
            error: error.message,
        });
    }
};
exports.createFlight = createFlight;
// Update flight (admin only)
const updateFlight = async (req, res) => {
    try {
        // In a real application, check if user is admin
        // if (req.user?.role !== 'admin') {
        //   return res.status(403).json({
        //     success: false,
        //     message: 'Not authorized to update flights',
        //   });
        // }
        const { id } = req.params;
        const updateData = req.body;
        // Process date fields if they exist
        if (updateData.departureTime) {
            updateData.departureTime = new Date(updateData.departureTime);
        }
        if (updateData.arrivalTime) {
            updateData.arrivalTime = new Date(updateData.arrivalTime);
        }
        // Process numeric fields
        if (updateData.price) {
            updateData.price = parseFloat(updateData.price);
        }
        if (updateData.availableSeats) {
            updateData.availableSeats = parseInt(updateData.availableSeats, 10);
        }
        const flight = await prisma_1.prisma.flight.update({
            where: { id },
            data: updateData,
        });
        return res.status(200).json({
            success: true,
            data: flight,
            message: 'Flight updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating flight:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to update flight',
            error: error.message,
        });
    }
};
exports.updateFlight = updateFlight;
// Delete flight (admin only)
const deleteFlight = async (req, res) => {
    try {
        // In a real application, check if user is admin
        // if (req.user?.role !== 'admin') {
        //   return res.status(403).json({
        //     success: false,
        //     message: 'Not authorized to delete flights',
        //   });
        // }
        const { id } = req.params;
        // Check if the flight exists
        const flight = await prisma_1.prisma.flight.findUnique({
            where: { id },
            include: {
                bookings: true, // Include bookings to check if it's being used
            },
        });
        if (!flight) {
            return res.status(404).json({
                success: false,
                message: 'Flight not found',
            });
        }
        // Check if flight has bookings
        if (flight.bookings.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete flight with existing bookings',
            });
        }
        // Delete the flight
        await prisma_1.prisma.flight.delete({
            where: { id },
        });
        return res.status(200).json({
            success: true,
            message: 'Flight deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting flight:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete flight',
            error: error.message,
        });
    }
};
exports.deleteFlight = deleteFlight;
//# sourceMappingURL=flightController.js.map
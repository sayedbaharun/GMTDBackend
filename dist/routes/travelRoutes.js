"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const routeHandler_1 = require("../utils/routeHandler");
const auth_1 = require("../middleware/auth");
const travelController_1 = require("../controllers/travelController");
const router = (0, express_1.Router)();
/**
 * Travel Routes
 * GET /api/travel/flights - Search for flights
 * GET /api/travel/locations - Search for airports or cities
 * GET /api/travel/test-connection - Test Amadeus API connection
 */
// Test the Amadeus API connection
router.get('/test-connection', (0, routeHandler_1.asyncHandler)(travelController_1.testAmadeusConnection));
// Search for flights - Allow public access with optional authentication
router.get('/flights', auth_1.authenticateOptional, (0, routeHandler_1.asyncHandler)(travelController_1.searchFlights));
// Search for airports or cities
router.get('/locations', (0, routeHandler_1.asyncHandler)(travelController_1.searchLocations));
exports.default = router;
//# sourceMappingURL=travelRoutes.js.map
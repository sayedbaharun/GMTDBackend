"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = __importStar(require("express"));
const Router = express.Router;
const auth_1 = __importDefault(require("./auth"));
const user_1 = __importDefault(require("./user"));
const onboarding_1 = __importDefault(require("./onboarding"));
const subscriptions_1 = __importDefault(require("./subscriptions"));
const webhooks_1 = __importDefault(require("./webhooks"));
const payments_1 = __importDefault(require("./payments"));
const health_1 = __importDefault(require("./health"));
const test_1 = __importDefault(require("./test"));
const admin_1 = __importDefault(require("./admin"));
const flightRoutes_1 = __importDefault(require("./flightRoutes"));
const hotelRoutes_1 = __importDefault(require("./hotelRoutes"));
const travelRoutes_1 = __importDefault(require("./travelRoutes"));
const router = Router();
// Register all route modules
router.use('/auth', auth_1.default);
router.use('/user', user_1.default);
router.use('/onboarding', onboarding_1.default);
router.use('/subscriptions', subscriptions_1.default);
router.use('/webhooks', webhooks_1.default);
router.use('/payments', payments_1.default);
router.use('/health', health_1.default);
router.use('/test', test_1.default);
router.use('/admin', admin_1.default);
router.use('/flights', flightRoutes_1.default);
router.use('/hotels', hotelRoutes_1.default);
router.use('/travel', travelRoutes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map
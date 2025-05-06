"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const validate = (schema) => {
    return (req, res, next) => {
        schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        })
            .then(() => {
            next();
        })
            .catch((error) => {
            if (error instanceof zod_1.ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.errors.map((e) => ({
                        path: e.path.join('.'),
                        message: e.message,
                    })),
                });
            }
            else {
                res.status(500).json({
                    success: false,
                    message: 'Internal server error during validation',
                });
            }
        });
    };
};
exports.validate = validate;
//# sourceMappingURL=validate.js.map
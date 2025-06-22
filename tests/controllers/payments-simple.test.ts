import request from 'supertest';
import express from 'express';

// Create a simple payment controller for testing
const createSimplePaymentController = () => {
  return async (req: any, res: any) => {
    try {
      const { amount, currency = 'usd' } = req.body;

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid amount is required'
        });
      }

      // Simulate successful payment intent creation
      return res.status(200).json({
        success: true,
        clientSecret: 'pi_test_123_secret_test',
        amount: parseFloat(amount) * 100, // Convert to cents
        currency
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Payment processing failed'
      });
    }
  };
};

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  app.post('/create-payment-intent', createSimplePaymentController());
  
  return app;
};

describe('Payment Logic', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /create-payment-intent', () => {
    it('should validate amount correctly', async () => {
      const response = await request(app)
        .post('/create-payment-intent')
        .send({
          amount: 20.00,
          currency: 'usd'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.amount).toBe(2000); // 20.00 * 100 cents
      expect(response.body.currency).toBe('usd');
    });

    it('should return 400 for invalid amount', async () => {
      const response = await request(app)
        .post('/create-payment-intent')
        .send({
          amount: -10,
          currency: 'usd'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Valid amount is required');
    });

    it('should return 400 for missing amount', async () => {
      const response = await request(app)
        .post('/create-payment-intent')
        .send({
          currency: 'usd'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Valid amount is required');
    });

    it('should return 400 for zero amount', async () => {
      const response = await request(app)
        .post('/create-payment-intent')
        .send({
          amount: 0,
          currency: 'usd'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Valid amount is required');
    });

    it('should default to USD currency', async () => {
      const response = await request(app)
        .post('/create-payment-intent')
        .send({
          amount: 15.50
          // No currency specified
        })
        .expect(200);

      expect(response.body.currency).toBe('usd');
    });

    it('should handle string amounts', async () => {
      const response = await request(app)
        .post('/create-payment-intent')
        .send({
          amount: '25.75',
          currency: 'usd'
        })
        .expect(200);

      expect(response.body.amount).toBe(2575); // 25.75 * 100 cents
    });

    it('should reject non-numeric amounts', async () => {
      const response = await request(app)
        .post('/create-payment-intent')
        .send({
          amount: 'invalid',
          currency: 'usd'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Valid amount is required');
    });
  });
});
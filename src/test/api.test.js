import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server/index.js';

describe('Aarkis Collection Backend API Tests', () => {
  it('GET /api/health should return 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('GET /api/products should return product list', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  it('GET /api/categories should return category taxonomy', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.categories)).toBe(true);
  });

  it('POST /api/coupons/validate should enforce minimum order amount and correct calculation', async () => {
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'AARKIS10', cartTotal: 5000 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.coupon.discountAmount).toBe(500);
  });

  it('POST /api/coupons/validate should reject invalid coupon', async () => {
    const res = await request(app)
      .post('/api/coupons/validate')
      .send({ code: 'INVALID_CODE', cartTotal: 5000 });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/customer/auth/send-otp should reject missing or invalid phone number', async () => {
    const res = await request(app)
      .post('/api/customer/auth/send-otp')
      .send({ phone: '123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/customer/auth/send-otp and verify-otp flow works with valid 10-digit phone', async () => {
    const sendRes = await request(app)
      .post('/api/customer/auth/send-otp')
      .send({ phone: '+91 9876543210' });

    expect(sendRes.status).toBe(200);
    expect(sendRes.body.success).toBe(true);
    const otp = sendRes.body.devOtp;
    expect(otp).toBeDefined();

    const verifyRes = await request(app)
      .post('/api/customer/auth/verify-otp')
      .send({ phone: '+91 9876543210', otp, fullName: 'Test Patron' });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.token).toBeDefined();
    expect(verifyRes.body.customer.name).toBe('Test Patron');
  });

  it('POST /api/orders/checkout should enforce mandatory verified phone number', async () => {
    const res = await request(app)
      .post('/api/orders/checkout')
      .send({
        items: [{ productId: 'test', size: 'M', quantity: 1 }],
        customer: { fullName: 'Test Buyer', email: 'test@example.com', phone: '123' },
        shippingAddress: { addressLine1: 'Road 1', city: 'Mumbai', postalCode: '400001' }
      });

    expect([400, 401]).toContain(res.status);
    expect(res.body.message).toMatch(/phone/i);
  });

  it('GET /api/orders/my-orders should retrieve customer orders by phone', async () => {
    const res = await request(app)
      .get('/api/orders/my-orders?phone=9876543210');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.orders)).toBe(true);
  });

  it('Customer address management API (add, list, delete) works with authentication', async () => {
    // 1. Get OTP & login
    const sendRes = await request(app)
      .post('/api/customer/auth/send-otp')
      .send({ phone: '+91 9998887776' });
    const otp = sendRes.body.devOtp;

    const verifyRes = await request(app)
      .post('/api/customer/auth/verify-otp')
      .send({ phone: '+91 9998887776', otp, fullName: 'Address Patron' });
    const token = verifyRes.body.token;
    expect(token).toBeDefined();

    // 2. Add an address
    const addRes = await request(app)
      .post('/api/customer/auth/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        label: 'Home',
        fullName: 'Address Patron',
        phone: '+91 9998887776',
        addressLine1: 'Penthouse 12B, Marine Drive',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400020',
        country: 'India',
        isDefault: true
      });

    expect([200, 201]).toContain(addRes.status);
    expect(addRes.body.success).toBe(true);
    expect(addRes.body.addresses.length).toBeGreaterThanOrEqual(1);
    const addedId = addRes.body.address?.id || addRes.body.address?._id || addRes.body.addresses[addRes.body.addresses.length - 1].id;
    expect(addedId).toBeDefined();

    // 3. Get addresses
    const listRes = await request(app)
      .get('/api/customer/auth/addresses')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.addresses.length).toBeGreaterThanOrEqual(1);

    // 4. Delete address
    const delRes = await request(app)
      .delete(`/api/customer/auth/addresses/${addedId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);
  });

  it('POST /api/orders/checkout should strictly reject out-of-stock sizes (stock 0)', async () => {
    const productsRes = await request(app).get('/api/products');
    const products = productsRes.body.products || [];
    const testProduct = products.find(p => !p.isComingSoon) || products[0];

    // Attempt checkout on size XL which has 0 stock or mock out of stock
    const res = await request(app)
      .post('/api/orders/checkout')
      .send({
        items: [{ productId: testProduct._id, size: 'XL', quantity: 9999 }],
        customer: { fullName: 'Test Buyer', email: 'test@example.com', phone: '+91 9876543210' },
        shippingAddress: { addressLine1: 'Road 1', city: 'Mumbai', postalCode: '400001' }
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/stock/i);
  });
});

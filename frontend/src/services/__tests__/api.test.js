import api, { APIService } from '../api';

describe('APIService', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should stringify body when posting', async () => {
    const svc = new APIService();
    // simulate successful response
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ success: true }),
    });

    const payload = { foo: 'bar' };
    await svc.post('/test', payload);

    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
    }));
  });

  it('should not override the serialized body with raw object', async () => {
    const svc = new APIService();
    fetch.mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK', json: async () => ({}) });
    const payload = { a: 1 };
    // call with extra options containing body
    await svc.request('/foo', { method: 'POST', body: payload, another: true });
    const called = fetch.mock.calls[0][1];
    expect(typeof called.body).toBe('string');
    expect(called.body).toBe(JSON.stringify(payload));
  });
});

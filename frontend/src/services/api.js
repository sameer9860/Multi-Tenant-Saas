/**
 * API Service Layer
 * Handles all HTTP requests with error handling, retry logic, and logging
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = 10000;
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  /**
   * Get authorization token from localStorage
   */
  getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Build common headers for all requests
   */
  getHeaders(includeContentType = true) {
    const headers = {
      Authorization: `Bearer ${this.getToken()}`,
    };

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  /**
   * Make HTTP request with retry logic
   */
  async request(endpoint, options = {}, attempt = 1) {
    const url = `${this.baseURL}${endpoint}`;

    console.log(`[API] ${options.method || 'GET'} ${url} (Attempt ${attempt})`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      // avoid overwriting the serialized body when spreading options
      const { body: rawBody, ...otherOpts } = options;
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: this.getHeaders(rawBody !== undefined),
        body: rawBody !== undefined ? JSON.stringify(rawBody) : undefined,
        signal: controller.signal,
        ...otherOpts,
      });

      clearTimeout(timeoutId);

      // Log response
      console.log(`[API] ${response.status} ${response.statusText}`);

      if (!response.ok) {
        // Try to parse error message
        let errorMessage = response.statusText;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.detail || errorMessage;
        } catch (e) {
          // Ignore JSON parse errors
        }

        throw new APIError(
          `API Error: ${response.status} ${errorMessage}`,
          response.status,
          { url, endpoint, status: response.status, message: errorMessage }
        );
      }

      const data = await response.json();
      console.log(`[API] Response data:`, data);
      return data;
    } catch (error) {
      // Handle network errors and timeouts
      if (error.name === 'AbortError') {
        console.error(`[API] Request timeout for ${url}`);
        throw new APIError(
          'Request timeout - server took too long to respond',
          'TIMEOUT',
          { url, endpoint }
        );
      }

      if (error instanceof APIError) {
        throw error;
      }

      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error(`[API] Network error for ${url}:`, error);
        throw new APIError(
          'Network error - unable to connect to server. Check if backend is running.',
          'NETWORK_ERROR',
          { url, endpoint, originalError: error.message }
        );
      }

      // Retry logic for network errors
      if (attempt < this.retryAttempts) {
        console.warn(`[API] Retrying in ${this.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.request(endpoint, options, attempt + 1);
      }

      console.error(`[API] Request failed after ${attempt} attempts:`, error);
      throw new APIError(
        `Failed to connect to server: ${error.message}`,
        'FETCH_ERROR',
        { url, endpoint, originalError: error.message }
      );
    }
  }

  /**
   * GET request
   */
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  }

  /**
   * PUT request
   */
  async put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(message, code, details) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'APIError';
  }
}

// Create singleton instance
const api = new APIService();

export default api;
export { APIError, APIService };

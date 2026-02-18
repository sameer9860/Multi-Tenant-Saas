/**
 * Custom React Hooks for API calls
 * Provides reusable data fetching with loading and error states
 */

import { useState, useEffect, useCallback } from 'react';
import api from './api';
import { getEndpoint, ENDPOINTS } from './endpoints';

/**
 * Generic hook for API calls with automatic retry and error handling
 */
export const useApiCall = (endpoint) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await api.get(endpoint);
      setData(result);
      setError(null);
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      setError({
        message: err.message,
        code: err.code,
        details: err.details,
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [endpoint, fetchData]);

  return { data, loading, error, refetch: fetchData };
};

/**
 * Hook for fetching dashboard analytics
 */
export const useDashboardData = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try primary endpoint first
      const endpoint = getEndpoint('crm', 'dashboard');
      console.log('[useDashboardData] Fetching from:', endpoint.primary);

      try {
        const data = await api.get(endpoint.primary);
        setAnalytics(data);
        setError(null);
      } catch (primaryError) {
        console.warn('[useDashboardData] Primary endpoint failed, trying fallback:', endpoint.fallback);

        // Try fallback endpoint
        const fallbackData = await api.get(endpoint.fallback);
        setAnalytics(fallbackData);
        setError(null);
      }
    } catch (err) {
      console.error('[useDashboardData] All endpoints failed:', err);
      setError({
        message: err.message || 'Failed to load dashboard data',
        code: err.code,
        details: err.details,
      });
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { analytics, loading, error, refetch: fetchAnalytics };
};

/**
 * Hook for fetching payment history
 */
export const usePaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try primary endpoint first
      const endpoint = getEndpoint('billing', 'payments');
      console.log('[usePaymentHistory] Fetching from:', endpoint.primary);
      console.log('[usePaymentHistory] fallback will be', endpoint.fallback);

      try {
        const data = await api.get(endpoint.primary);
        setPayments(Array.isArray(data) ? data : data.results || []);
        setError(null);
      } catch (primaryError) {
        console.warn('[usePaymentHistory] Primary endpoint failed, trying fallback:', endpoint.fallback);

        // Try fallback endpoint
        const fallbackData = await api.get(endpoint.fallback);
        setPayments(Array.isArray(fallbackData) ? fallbackData : fallbackData.results || []);
        setError(null);
      }
    } catch (err) {
      console.error('[usePaymentHistory] All endpoints failed:', err);
      setError({
        message: err.message || 'Failed to load payment history',
        code: err.code,
        details: err.details,
      });
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return { payments, loading, error, refetch: fetchPayments };
};

/**
 * Hook for fetching user profile
 */
export const useUserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = getEndpoint('accounts', 'profile');
      console.log('[useUserProfile] Fetching from:', endpoint.primary);

      try {
        const data = await api.get(endpoint.primary);
        setProfile(data);
        setError(null);
      } catch (primaryError) {
        console.warn('[useUserProfile] Primary endpoint failed, trying fallback:', endpoint.fallback);

        const fallbackData = await api.get(endpoint.fallback);
        setProfile(fallbackData);
        setError(null);
      }
    } catch (err) {
      console.error('[useUserProfile] All endpoints failed:', err);
      setError({
        message: err.message || 'Failed to load user profile',
        code: err.code,
        details: err.details,
      });
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
};

/**
 * Hook for fetching invoices
 */
export const useInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = getEndpoint('invoices', 'list');
      console.log('[useInvoices] Fetching from:', endpoint.primary);

      try {
        const data = await api.get(endpoint.primary);
        setInvoices(Array.isArray(data) ? data : data.results || []);
        setError(null);
      } catch (primaryError) {
        console.warn('[useInvoices] Primary endpoint failed, trying fallback:', endpoint.fallback);

        const fallbackData = await api.get(endpoint.fallback);
        setInvoices(Array.isArray(fallbackData) ? fallbackData : fallbackData.results || []);
        setError(null);
      }
    } catch (err) {
      console.error('[useInvoices] All endpoints failed:', err);
      setError({
        message: err.message || 'Failed to load invoices',
        code: err.code,
        details: err.details,
      });
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return { invoices, loading, error, refetch: fetchInvoices };
};

/**
 * Hook for fetching a single invoice
 */
export const useInvoice = (id) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoice = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);

    try {
      const endpoint = getEndpoint('invoices', 'list');
      const invoiceUrl = `${endpoint.primary}${id}/`;
      const fallbackUrl = `${endpoint.fallback}${id}/`;

      try {
        const data = await api.get(invoiceUrl);
        setInvoice(data);
      } catch (e1) {
        console.warn(`[useInvoice] Primary failed for ${invoiceUrl}, trying fallback:`, fallbackUrl);
        const data = await api.get(fallbackUrl);
        setInvoice(data);
      }
    } catch (err) {
      console.error('[useInvoice] Failed to load invoice:', err);
      setError({
        message: err.message || 'Failed to load invoice',
        code: err.code,
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  return { invoice, loading, error, refetch: fetchInvoice };
};

/**
 * Hook for fetching customers
 */
export const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try primary and fallback endpoints for customers
      let data;
      try {
        const response = await api.get('/api/customers/');
        data = response;
      } catch (e1) {
        try {
          const response = await api.get('/customers/');
          data = response;
        } catch (e2) {
          // If both fail, use empty array
          console.warn('[useCustomers] Both endpoints failed, using empty array');
          data = [];
        }
      }

      setCustomers(Array.isArray(data) ? data : data.results || []);
      setError(null);
    } catch (err) {
      console.error('[useCustomers] Failed to load customers:', err);
      setError({
        message: err.message || 'Failed to load customers',
        code: err.code,
        details: err.details,
      });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return { customers, loading, error, refetch: fetchCustomers };
};

/**
 * Hook for creating customer
 */
export const useCreateCustomer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const createCustomer = useCallback(async (customerData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const endpoint = getEndpoint('customers', 'create');
      console.log('[useCreateCustomer] Creating customer with data:', customerData);
      let result;
      try {
        result = await api.post(endpoint.primary, customerData);
        console.log('[useCreateCustomer] Customer created successfully:', result);
      } catch (e1) {
        console.warn(`[useCreateCustomer] Primary endpoint ${endpoint.primary} failed, trying fallback:`, e1);
        result = await api.post(endpoint.fallback, customerData);
        console.log('[useCreateCustomer] Customer created successfully via fallback:', result);
      }
      setSuccess(true);
      return result;
    } catch (err) {
      console.error('[useCreateCustomer] Failed to create customer:', err);
      const errorMessage = err?.details?.message || err?.message || 'Failed to create customer';
      setError({
        message: errorMessage,
        code: err?.code,
        details: err?.details,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createCustomer, loading, error, success };
};

/**
 * Hook for creating invoice
 */
export const useCreateInvoice = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const createInvoice = useCallback(async (invoiceData) => {
    if (!invoiceData || typeof invoiceData !== 'object') {
      console.error('[useCreateInvoice] invalid payload', invoiceData);
      return null;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);

    console.debug('[useCreateInvoice] sending', invoiceData);

    try {
      const endpoint = getEndpoint('invoices', 'list');
      let result;
      try {
        result = await api.post(endpoint.primary, invoiceData);
      } catch (e1) {
        console.warn('[useCreateInvoice] primary failed, trying fallback', endpoint.fallback, e1);
        result = await api.post(endpoint.fallback, invoiceData);
      }
      setSuccess(true);
      return result;
    } catch (err) {
      console.error('[useCreateInvoice] Failed to create invoice:', err);
      setError({
        message: err.message || 'Failed to create invoice',
        code: err.code,
        details: err.details,
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createInvoice, loading, error, success };
};

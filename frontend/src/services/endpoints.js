/**
 * API Endpoints Configuration
 * All routes are prefixed with /api/
 */

export const ENDPOINTS = {
  analytics: {
    usage: '/api/analytics/usage/',
    usageFallback: '/api/analytics/usage/',
  },

  billing: {
    payments: '/api/billing/payments/',
    paymentsFallback: '/api/billing/payments/',
    paymentsList: '/api/billing/payments/',
  },

  accounts: {
    profile: '/api/accounts/profile/',
    profileFallback: '/api/accounts/profile/',
  },

  invoices: {
    list: '/api/invoices/',
    listFallback: '/api/invoices/',
    items: '/api/invoices/invoice-items/',
    itemsFallback: '/api/invoices/invoice-items/',
  },

  payments: {
    list: '/api/payments/',
    listFallback: '/api/payments/',
  },

  customers: {
    list: '/api/customers/',
    listFallback: '/api/customers/',
    create: '/api/customers/',
    createFallback: '/api/customers/',
  },

  subscriptions: {
    list: '/api/subscription/',
    listFallback: '/api/subscription/',
  },

  crm: {
    leads: '/api/crm/leads/',
    leadsFallback: '/api/crm/leads/',
    clients: '/api/crm/clients/',
    clientsFallback: '/api/crm/clients/',
    dashboard: '/api/crm/dashboard/',
    dashboardFallback: '/api/crm/dashboard/',
  },

  appointments: {
    services: '/api/appointments/services/',
    staff: '/api/appointments/staff/',
    availability: '/api/appointments/staff-availability/',
    list: '/api/appointments/appointments/',
    dashboard: '/api/appointments/appointments/dashboard/',
    reports: '/api/appointments/appointments/reports/',
  },
};

/**
 * Get endpoint URL with optional fallback
 * @param {string} category - Endpoint category (e.g., 'analytics')
 * @param {string} name - Endpoint name (e.g., 'usage')
 * @returns {object} - Object with primary and fallback URLs
 */
export const getEndpoint = (category, name) => {
  const primaryKey = name;
  const fallbackKey = `${name}Fallback`;

  const endpoint = ENDPOINTS[category];
  if (!endpoint) {
    throw new Error(`Unknown endpoint category: ${category}`);
  }

  return {
    primary: endpoint[primaryKey],
    fallback: endpoint[fallbackKey],
  };
};

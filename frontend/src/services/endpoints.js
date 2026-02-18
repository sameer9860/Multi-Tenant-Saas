/**
 * API Endpoints Configuration
 * Maps endpoint names to URLs
 * Includes both primary and fallback URLs for flexibility
 */

export const ENDPOINTS = {
  // Analytics endpoints - Routes to /analytics/usage/
  analytics: {
    usage: '/analytics/usage/',
    usageFallback: '/api/analytics/usage/', // Fallback if primary fails
  },

  // Billing/Payments endpoints - Routes to /billing/api/payments/ OR /payments/api/payments/
  billing: {
    payments: '/billing/api/payments/',
    paymentsFallback: '/payments/api/payments/', // Alternative path
    paymentsList: '/api/billing/payments/', // Payment model endpoint
  },

  // Accounts/Profile endpoints - Routes to /api/accounts/profile/
  accounts: {
    profile: '/api/accounts/profile/',
    profileFallback: '/accounts/profile/',
  },

  // Invoices endpoints - Routes to /api/invoices/
  invoices: {
    list: '/api/invoices/',
    listFallback: '/invoices/',
    items: '/api/invoice-items/',
    itemsFallback: '/invoice-items/',
  },

  // Customer endpoints - Django router registers customers at /api/customers/
  customers: {
    list: '/api/customers/',
    listFallback: '/customers/',
    create: '/api/customers/',
    createFallback: '/customers/',
  },

  // Subscriptions endpoints - Routes to /api/subscription/
  subscriptions: {
    list: '/api/subscription/',
    listFallback: '/subscription/',
  },

  // CRM endpoints - Routes to /api/crm/
  crm: {
    leads: '/api/crm/leads/',
    leadsFallback: '/crm/leads/',
    clients: '/api/crm/clients/',
    clientsFallback: '/crm/clients/',
    dashboard: '/api/crm/dashboard/',
    dashboardFallback: '/crm/dashboard/',
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

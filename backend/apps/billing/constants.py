"""Central pricing and plan limits — single source of truth for the entire app."""

PLAN_LIMITS = {
    "FREE": {
        "invoices": 10,
        "customers": 5,
        "team_members": 1,
        "api_calls": 100,
        "leads": 20,
        "clients": 10,
        "reports": 0,       # not available on FREE
    },
    "BASIC": {
        "invoices": 1000,
        "customers": 50,
        "team_members": 3,
        "api_calls": 10000,
        "leads": 200,
        "clients": 100,
        "reports": -1,      # unlimited
    },
    "PRO": {
        "invoices": None,
        "customers": None,
        "team_members": None,
        "api_calls": None,
        "leads": None,
        "clients": None,
        "reports": -1,      # unlimited
    },
}


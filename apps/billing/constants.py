"""Central pricing and constants - Single source of truth"""

PLAN_PRICES = {
    "FREE": 0,
    "BASIC": 2500,      # NPR
    "PRO": 3900,        # NPR
}

PLAN_LIMITS = {
    "FREE": {
        "invoices": 10,
        "customers": 5,
        "team_members": 1,
        "api_calls": 100,
    },
    "BASIC": {
        "invoices": 1000,
        "customers": 50,
        "team_members": 3,
        "api_calls": 10000,
    },
    "PRO": {
        "invoices": 999999,
        "customers": 999999,
        "team_members": 999999,
        "api_calls": 999999,
    },
}
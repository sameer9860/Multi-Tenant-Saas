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
        # None means unlimited; the UI and views interpret None specially
        "invoices": None,
        "customers": None,
        "team_members": None,
        "api_calls": None,
    },
}
"""
Deprecated: plan limits have moved to apps.billing.constants.
This module re-exports PLAN_LIMITS for backwards compatibility.
Remove direct imports of this module and use apps.billing.constants instead.
"""
from apps.billing.constants import PLAN_LIMITS  # noqa: F401

PLAN_LIMITS = {
    "FREE": {
        "leads": 20,
        "clients": 10,
    },
    "BASIC": {
        "leads": 200,
        "clients": 100,
    },
    "PRO": {
        "leads": None,   # None = unlimited
        "clients": None,
    }
}

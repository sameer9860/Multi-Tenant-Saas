def can_create_invoice(request):
    """
    Safely check invoice creation permission based on plan.
    """
    organization = getattr(request, 'organization', None)

    if not organization:
        return False  # Block if tenant not resolved

    subscription = getattr(organization, 'subscription', None)

    if not subscription:
        return False

    if subscription.plan == 'FREE':
        return organization.invoices.count() < 10

    return True

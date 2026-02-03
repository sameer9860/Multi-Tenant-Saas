def can_create_invoice(request):
    """
    Check if the organization is allowed to create more invoices
    based on its subscription plan.
    """
    subscription = request.organization.subscription

    if subscription.plan == 'FREE':
        return request.organization.invoices.count() < 10

    return True

#!/bin/bash
# DAY 9 QUICK SETUP SCRIPT
# Run this to set up Day 9 features

cd /home/samir/Multi-Tenant\ SaaS

echo "🚀 DAY 9 SETUP STARTING..."
echo ""

echo "1️⃣ Creating migrations..."
python manage.py makemigrations
echo "✓ Migrations created"
echo ""

echo "2️⃣ Running migrations..."
python manage.py migrate
echo "✓ Migrations applied"
echo ""

echo "3️⃣ Initializing plan limits..."
python manage.py init_plan_limits
echo "✓ Plan limits initialized"
echo ""

echo "4️⃣ Creating superuser (if needed)..."
# Uncomment to create superuser
# python manage.py createsuperuser
echo ""

echo "✅ DAY 9 SETUP COMPLETE!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Add to .env file:"
echo "   KHALTI_PUBLIC_KEY=your_key"
echo "   KHALTI_SECRET_KEY=your_key"
echo ""
echo "2. Go to admin panel:"
echo "   python manage.py runserver"
echo "   Visit http://localhost:8000/admin/billing/planlimit/"
echo ""
echo "3. Test payment endpoints:"
echo "   POST /billing/khalti/init/"
echo "   POST /billing/khalti/verify/"
echo ""

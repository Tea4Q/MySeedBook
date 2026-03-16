# Google Play Subscription Setup Guide

**Date**: November 12, 2025  
**Purpose**: Configure subscription products in Google Play Console for MySeedBook Premium  
**Timeline**: Complete before v1.3.1 billing integration

---

## Overview

This guide walks through creating subscription products in Google Play Console for a RevenueCat-based billing setup. These products must be created before configuring them in RevenueCat and testing purchases in the app.

---

## Prerequisites

- [x] Google Play Console access
- [x] App created in Play Console (com.myseedbook.catalogue)
- [x] Merchant account set up (for receiving payments)

---

## Step 1: Set Up Merchant Account (If Not Done)

### Check Merchant Status

1. Go to **Google Play Console**
2. Click **All applications** → Select your app
3. Navigate to **Monetization** → **Monetization setup**
4. Check if merchant account is linked

### Link Merchant Account (If Needed)

1. Click **Set up a merchant account**
2. Follow prompts to create/link Google Merchant Center account
3. Provide business information:
   - Business name
   - Business address
   - Tax information
   - Bank account details
4. Complete verification (may take 1-3 days)

**Note**: You can create subscription products while merchant verification is pending.

---

## Step 2: Create Monthly Subscription

### Navigate to Subscriptions

1. Open **Google Play Console**
2. Select **MySeedBook Catalogue** app
3. Go to **Monetization** → **Subscriptions**
4. Click **Create subscription**

### Configure Monthly Product

**Base Plan Details**:

| Field | Value |
|-------|-------|
| **Product ID** | `myseedbook_premium_monthly` |
| **Name** | MySeedBook Premium Monthly |
| **Description** | Unlimited seeds, weather forecasts, voice input, and priority support. Cancel anytime. |

**Subscription Details**:

| Field | Value |
|-------|-------|
| **Billing period** | 1 month (recurring) |
| **Base price** | $7.99 USD |
| **Free trial** | 7 days (recommended) |
| **Grace period** | 3 days (for failed payments) |

**Additional Settings**:

- ✅ **Auto-renewing**: Yes
- ✅ **Backwards compatible**: Yes (for older app versions)
- ✅ **Proration mode**: Immediate with time proration
- ⬜ **Introductory price**: Skip for now (can add later)

**Countries**:
- Select **All countries** or target specific regions

**Activation**:
- Status: **Active**
- Start date: Immediately

### Click "Create" and "Activate"

---

## Step 3: Create Yearly Subscription

### Create Second Subscription

1. Still in **Monetization** → **Subscriptions**
2. Click **Create subscription** again

### Configure Yearly Product

**Base Plan Details**:

| Field | Value |
|-------|-------|
| **Product ID** | `myseedbook_premium_yearly` |
| **Name** | MySeedBook Premium Yearly |
| **Description** | Get 12 months for the price of 10! Unlimited seeds, weather forecasts, and priority support. Best value. |

**Subscription Details**:

| Field | Value |
|-------|-------|
| **Billing period** | 1 year (recurring) |
| **Base price** | $79.99 USD (16% savings vs monthly) |
| **Free trial** | 7 days (optional, recommended) |
| **Grace period** | 3 days |

**Additional Settings**:

- ✅ **Auto-renewing**: Yes
- ✅ **Backwards compatible**: Yes
- ✅ **Proration mode**: Immediate with time proration

**Countries**:
- Select **All countries** or match monthly subscription

**Activation**:
- Status: **Active**
- Start date: Immediately

### Click "Create" and "Activate"

---

## Step 4: Set Up License Testers

For testing purchases without being charged:

### Add Test Accounts

1. Go to **Settings** → **License Testing**
2. Click **Add license testers**
3. Add email addresses of testers:
   - Your Gmail account
   - Developer team members
   - QA testers

**Example**:
```
youremail@gmail.com
developer@example.com
qa.tester@example.com
```

### Test Response Settings

- Select: **RESPOND_NORMALLY** (real purchase flow, no charges)
- Or: **RESPOND_WITH_SUCCESS** (instant success, for debugging)

### Save Changes

---

## Step 5: Verify Subscription Setup

### Check Subscription List

1. Go to **Monetization** → **Subscriptions**
2. Verify you see:
   - ✅ **myseedbook_premium_monthly** - Active
   - ✅ **myseedbook_premium_yearly** - Active

### Review Pricing

| Subscription | Monthly Price | Yearly Price | Yearly Savings |
|--------------|---------------|--------------|----------------|
| Monthly | $7.99 | $95.88 | - |
| Yearly | - | $79.99 | $15.89 (~17%) |

### Test Product IDs Match Code

**In Play Console**:
- `myseedbook_premium_monthly` ✅
- `myseedbook_premium_yearly` ✅

**In RevenueCat**:
- Entitlement: `premium` ✅
- Offering: `default` with `$rc_monthly` mapped to `myseedbook_premium_monthly` and `$rc_annual` mapped to `myseedbook_premium_yearly` ✅

**In App**:
- `lib/globalRevenueCat.ts` plan parsing supports `monthly`, `annual`, and `yearly` strings ✅

**Must match exactly!**

---

## Step 6: Optional Features (Add Later)

### Introductory Offers

**First Month Discount**:
- Trial: Free for 7 days
- Then: $1.99 for first month
- Then: $7.99/month regular price

**How to Add**:
1. Edit subscription → **Offers**
2. Create offer → **Introductory price**
3. Set promotional price and duration

### Promotional Codes

**Use Cases**:
- Influencer partnerships
- Giveaways
- Customer retention

**How to Add**:
1. Subscription → **Offers** → **Promo codes**
2. Generate codes
3. Distribute to users

### Base Plans (Multiple Options)

**Example**:
- Basic: $4.99/month (Weather only)
- Premium: $7.99/month (Weather + Barcode)

**Current Setup**: Single premium tier (recommended for launch)

---

## Pricing Recommendations

### Monthly Subscription ($7.99)

**Why $7.99**:
- ✅ Aligns with current launch pricing in this guide
- ✅ Reflects premium feature depth and support costs
- ✅ Still competitive for niche productivity apps
- ✅ Keeps yearly plan value proposition clear

**Comparable Apps**:
- Gardening apps: $3.99 - $9.99/month
- Productivity apps: $4.99 - $14.99/month
- Inventory apps: $2.99 - $9.99/month

### Yearly Subscription ($79.99)

**Why $79.99**:
- ✅ Meaningful savings vs monthly billing
- ✅ Better long-term retention via yearly commitment
- ✅ Improved revenue predictability
- ✅ Simpler two-tier plan structure for launch

**Yearly Revenue**:
- Monthly x 12: $95.88
- Yearly: $79.99
- Discount: $15.89 (~17% off)

### Alternative Pricing Tiers (Consider Later)

**Aggressive Growth**:
- Monthly: $2.99
- Yearly: $24.99
- Strategy: High volume, low friction

**Premium Positioning**:
- Monthly: $7.99
- Yearly: $59.99
- Strategy: Higher quality perception

**Freemium Heavy**:
- Monthly: $9.99
- Yearly: $79.99
- Free tier: 10 seeds (current: 3)
- Strategy: Free users drive growth

---

## Step 7: Revenue & Taxation Setup

### Payment Profile

1. Go to **Settings** → **Payments profile**
2. Verify business information:
   - Legal business name
   - Business address
   - Tax ID (if applicable)
   - Bank account for payouts

### Taxation

**US Developers**:
- Provide W-9 form
- Google handles sales tax collection

**International Developers**:
- Provide tax forms (W-8BEN, etc.)
- May need VAT registration

**Google's Cut**:
- Standard: 30% (first year)
- Reduced: 15% (after $1M revenue or subscriptions after year 1)

**Example Revenue**:
- User pays: $7.99
- Google takes: $2.40 (30%)
- You receive: $5.59

---

## Step 8: Documentation

### Product Information for Marketing

**Monthly Subscription**:
```
MySeedBook Premium Monthly
$7.99/month

• Unlimited seed inventory
• 7-day weather forecasts
• Barcode scanner for quick entry
• Unlimited suppliers
• Advanced calendar features
• Priority support
• Cancel anytime

7-day free trial included
```

**Yearly Subscription**:
```
MySeedBook Premium Yearly
$79.99/year (Save ~17%!)

Everything in Monthly, plus:
• Save $15.89 per year
• Pay once, garden all year
• Best value for serious gardeners

7-day free trial included
```

### Feature Comparison Table

| Feature | Free | Premium |
|---------|------|---------|
| Seeds | Up to 3 | Unlimited ✓ |
| Suppliers | Up to 2 | Unlimited ✓ |
| Weather | - | 7-day forecast ✓ |
| Barcode Scanner | - | Scan packages ✓ |
| Photos per seed | Up to 5 | Unlimited ✓ |
| Calendar | Basic | Advanced ✓ |
| Support | Community | Priority ✓ |
| Price | Free | $7.99/mo or $79.99/yr |

---

## Testing Checklist

After setup, verify:

- [ ] Both subscription products visible in Play Console
- [ ] Product IDs match RevenueCat setup exactly (`myseedbook_premium_monthly`, `myseedbook_premium_yearly`)
- [ ] Prices set correctly ($7.99, $79.99)
- [ ] Free trials enabled (7 days)
- [ ] Grace period set (3 days)
- [ ] Products activated
- [ ] License testers added
- [ ] Test response set to RESPOND_NORMALLY
- [ ] Merchant account linked (or pending)
- [ ] RevenueCat entitlement `premium` has both products attached
- [ ] RevenueCat `default` offering includes `$rc_monthly` and `$rc_annual` mapped to the correct store products

---

## Next Steps

1. ✅ Complete subscription setup in Play Console
2. ⏭️ Import products into RevenueCat dashboard
3. ⏭️ Attach both products to entitlement `premium`
4. ⏭️ Add packages to offering `default`
5. ⏭️ Test purchase and restore flows using GlobalSubscriptionModal
6. ⏭️ Validate premium entitlement updates in app and RevenueCat customer view

---

## Troubleshooting

### "Subscription not showing in app"

**Cause**: Product ID mismatch  
**Fix**: Ensure Play Console IDs match code exactly

### "Purchase fails during test"

**Cause**: Not added as license tester  
**Fix**: Add email to Settings → License Testing

### "Merchant account required"

**Cause**: No payment profile  
**Fix**: Complete merchant verification in Play Console

### "Product already exists"

**Cause**: Product ID used before  
**Fix**: Use different ID or delete old product

---

## Timeline

**Immediate** (Today):
- Create subscription products (15 minutes)
- Add license testers (5 minutes)

**After App Approval** (Week 2):
- Configure RevenueCat offerings and entitlement mappings (30-60 minutes)
- Test purchase, restore, renewal, and cancellation flows (2-3 hours)

**Week 3**:
- Submit v1.3.1 update
- Start earning revenue 💰

---

## Support Resources

- [Google Play Billing Documentation](https://developer.android.com/google/play/billing)
- [Subscription Setup Guide](https://support.google.com/googleplay/android-developer/answer/140504)
- [Testing In-App Purchases](https://developer.android.com/google/play/billing/test)
- [Pricing Best Practices](https://developer.android.com/distribute/best-practices/earn/subscriptions)

---

**Created**: November 12, 2025  
**Status**: Ready to implement  
**Priority**: High (monetization)

---

## Related Documentation

- [RevenueCat Setup Guide](REVENUECAT_SETUP.md)
- [Global RevenueCat Wrapper](../lib/globalRevenueCat.ts)
- [Global Subscription Context](../lib/globalSubscriptionManager.tsx)
- [Production Checklist](../PRODUCTION_CHECKLIST.md)

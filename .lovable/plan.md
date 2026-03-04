

## Diagnosis

The root cause is clear: **the `stripe-webhook` function has ZERO logs**. It has never been called by Stripe. Looking at the secrets, `STRIPE_WEBHOOK_SECRET` is **not configured** in Supabase (the create-checkout logs also confirm `"hasWebhookSecret": false`).

This means: Stripe completes payment → redirects user to `/checkout/sucesso` → `generate-auth-link` authenticates the user → but **no webhook ever fires**, so tokens are never credited.

Even if we configure the webhook secret, webhooks are inherently asynchronous and can be delayed or missed. The architecture should not depend solely on them for token crediting.

## Plan: Move Token Crediting to the Auth Link Function

Instead of depending on an unreliable webhook, credit tokens directly in the `generate-auth-link` function, which is already called reliably from the frontend after payment verification.

### 1. Refactor `generate-auth-link` to also credit tokens

This function already:
- Verifies the Stripe session is paid (`payment_status === "paid"`)
- Has access to `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- Is called reliably from the frontend

Add token crediting logic after payment verification:
- Look up or create user profile using `stripe_customer_id` or email
- Check if tokens were already credited for this session (idempotent via `token_consumptions` table)
- If not credited yet, add tokens (200 for subscription, 100 for recharge)
- Update profile's `subscription_status` and `stripe_customer_id`

### 2. Simplify `stripe-webhook` to be a backup only

Keep the webhook for handling:
- `invoice.paid` (subscription renewals)
- `customer.subscription.deleted` (cancellations)

But remove the hard requirement for `STRIPE_WEBHOOK_SECRET` — if it's not configured, the webhook gracefully returns 500 (which is fine since it's not the primary path).

### 3. Fix `create-checkout` metadata for new subscriptions

Currently, when `mode === "subscription"`, the metadata sets `create_user_on_success: 'true'` and `is_recharge: 'false'`. When `mode === "recharge"`, it's the opposite. The `generate-auth-link` function will read this metadata to determine token amount (200 vs 100).

### 4. Document the webhook setup requirement

Add a note about configuring the Stripe webhook URL and secret for subscription renewals (non-critical for initial payment but needed for ongoing renewals).

### Technical Details

**`generate-auth-link/index.ts` changes:**
```
After verifying payment status:
1. Get session metadata (is_recharge, customer_email, etc.)
2. Get Stripe customer ID from session
3. Find or create Supabase user (reuse existing logic from webhook)
4. Upsert profile with stripe_customer_id, tokens, subscription_status
5. Check token_consumptions for idempotency (match on session ID)
6. Insert token credit if not already recorded
7. Then generate the auth link as before
```

**Token amounts:**
- `is_recharge === 'true'` → +100 tokens (added to existing)
- `create_user_on_success === 'true'` (new subscription) → set to 200 tokens
- Default/recharge for existing user → +100 tokens added to current balance

**Idempotency:** Check `token_consumptions` for a record with description containing the session ID before inserting.


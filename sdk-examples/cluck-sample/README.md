# Cluckworks

A ServiceNow scoped application for pastured-poultry operations — running the back of a small egg farm, from flock-health to customer egg subscriptions.

## What's in the box

### Admin / farmhand experience
- 12 custom tables: breed catalog, coops, flocks, individual birds, feed inventory, daily egg log, health records, incubation batches, incidents, orders, subscriptions, customers
- Business rules for auto-age calculation, low-producer flagging, feed auto-decrement, feed-reorder triggering, egg production rollup, order total recalc
- Script Includes: `FlockAnalytics` (production rate, FCR, mortality) and `PricingEngine` (grade-based dynamic pricing)
- Scripted REST: `GET /api/x_1939459_cluck/egg_availability` — public daily stock by grade
- UI actions: Record Weight, Mark Delivered, Hatch Day
- Notifications: order confirmation, CSA renewal, predator-incident alert, low-feed alert

### Customer experience (Service Portal + Service Catalog)
- **Buy Fresh Eggs** — one-time egg purchase with grade and delivery options
- **Egg CSA Subscription** — recurring weekly/biweekly delivery
- **Adopt-a-Hen** 🐔 — sponsor a named hen for a year, get photo updates + her eggs
- **Farm Tour Booking** — schedule a visit
- **Chick Pre-order** — reserve newly-hatched chicks
- **Report Issue** — record producer for predator sightings, quality issues

### Portal
- Custom portal at `/cluck`
- "Today's Basket" widget — live egg stock by grade
- "Meet the Flock" widget — adoptable hen showcase

## Scope
`x_1939459_cluck` (PDI-prefixed; 15 chars — safe under 18-char limit with room for field names)

## Commands
```bash
pnpm install
pnpm --filter cluck-sample run build
pnpm --filter cluck-sample run deploy
```

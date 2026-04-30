# Shoreline Beach Rentals

A comprehensive ServiceNow scoped application for managing beach equipment rentals — from a beach-stand walkup to VIP member bookings.

## What's in the box

### End-user experience (Service Portal + Service Catalog)
- **Single-item rental** — pick one item (surfboard, umbrella, chair, etc.) with rental window + location
- **Bundle packages** — "Family Fun Pack", "Surf Session", "Sunset Chill", "Kids Adventure", "Romantic Getaway"
- **Surf / SUP / snorkel lessons** — book an instructor for a session
- **Report damage / lost item** — record producer that opens a damage report
- **Sign up for a membership tier** — Beachcomber (free), Sun Chaser, Wave Rider VIP

### Admin / staff experience (Application Menu)
- Inventory (equipment with condition, category, location, daily rate)
- Active / overdue / all rental requests (extends `task`)
- Maintenance log (extends `task`)
- Damage reports (extends `task`)
- Lost & found
- Locations (beach stands)
- Membership roster with loyalty points
- Bundle builder

### Under the hood
- 10 custom tables (3 extending `task`)
- Role-based ACLs: `x_shoreline.customer`, `x_shoreline.staff`, `x_shoreline.admin`
- Business rules for inventory decrement, late-fee calc, damage-fee calc, auto-overdue flagging
- Script Include `RentalCalculator` with reusable pricing/availability logic
- Flow: catalog fulfillment (creates rental request from RITM, decrements inventory, sends confirmation)
- Scheduled flow: nightly overdue sweep
- Email notifications: booking confirmed, overdue reminder, damage-fee invoice
- UI action: "Mark Returned" with auto late-fee calculation
- Scripted REST API `/api/x_shoreline/availability` for external availability checks
- Service Portal with a live inventory widget

## Scope

`x_shoreline` (under the 18-char limit with room for field names)

## Commands

```bash
pnpm install
pnpm --filter shoreline-rentals-sample build
pnpm --filter shoreline-rentals-sample deploy
```

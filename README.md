# Ricin Xpress — Rebuilt Static Website

This folder is a clean HTML/CSS/JavaScript rebuild of the Ricin Xpress website, keeping the supplied visual design, copy, routes, local images, booking/tracking flow, PDF receipt, WhatsApp actions, and Supabase integration.

## Pages
- `index.html` — Home
- `about.html` — About
- `services.html` — Services + tracking
- `track.html` — Tracking
- `contact.html` — Contact
- `book.html` — Booking
- `order-success.html` — Booking confirmation
- `login.html` — Admin login
- `dashboard.html` — Admin order dashboard

## Run locally
Use a local static server (recommended):

```bash
python -m http.server 5500
```

Then open `http://localhost:5500/`.

You can also use VS Code Live Server.

## Supabase
The site uses the supplied Supabase project configuration in `js/supabase.js` and reads/writes the `public.orders` table expected by the front-end.

Expected columns:
`id`, `reference`, `first_name`, `last_name`, `phone`, `pickup_address`, `dropoff_address`, `collection_date`, `collection_time`, `item_description`, `special_instructions`, `status`, `created_at`, `updated_at`.

The client uses the publishable key only. Never place a Supabase service-role key in browser code.

## Images
All supplied website images from the uploaded project were retained under `public/`, and the original source asset files were retained under `source-assets/`.

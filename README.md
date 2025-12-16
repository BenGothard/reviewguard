# ReviewGuard – Review Funnel MVP

Static, mobile-first “review funnel” for local businesses. Share one link with customers: 4–5 star ratings go straight to Google Reviews; 1–3 star ratings collect private feedback via email.

## What’s included
- `index.html`: customer-facing rating flow (stars, Google redirect, private feedback form)
- `admin.html`: business setup (business info, link generator, QR code, EmailJS config)
- `assets/app.js`: shared utilities for config + email
- `assets/styles.css`: minimal responsive styling

No build step required—runs on any static host (GitHub Pages ready).

## Quick start (local)
1. Open `admin.html` in your browser.
2. Enter Business Name, Google Review link, Notification Email, optional thank-you message/logo.
3. Add EmailJS credentials (service ID, template ID, public key).
4. Click **Save configuration**. Copy the generated customer link.
5. Open `index.html?p=...` (or the copied link) in another tab/incognito to test the customer flow.

## Customer flow
- Landing reads config from the URL payload first, falling back to `localStorage`.
- Customers tap 1–5 stars.
  - **4–5:** shows a “Post on Google” button (no auto-redirect) using the Google review URL you provided.
  - **1–3:** expands a short feedback form. On submit, sends you an email via EmailJS and shows a success state.
- Missing config shows a gentle prompt to visit `/admin.html`.

## Config payload format
The admin page generates a compact base64url payload containing:
```
{ b: businessName, g: googleReviewUrl, e: notificationEmail, t: thankYouMessage?, l: logoUrl? }
```
The customer link looks like:
```
https://<your-pages-domain>/index.html?p=<payload>
```
Sensitive EmailJS keys are **not** included in the payload; they’re only stored locally in the admin browser.

## Email sending (EmailJS)
This project uses [EmailJS](https://www.emailjs.com/) because it works entirely client-side.
1. Create a free EmailJS account and add an email service.
2. Create an email template that includes these variables: `business_name`, `rating`, `feedback`, `customer_name`, `customer_phone`, `customer_email`, `notification_email`, `page_url`, `submitted_at`.
3. From EmailJS dashboard, copy your **Service ID**, **Template ID**, and **Public Key**.
4. In `admin.html`, paste those values into the EmailJS section and click **Save Email Settings**.
5. Ensure your EmailJS template is set to deliver to your notification email. Keys stay in your browser (localStorage) and are not shared in the customer link.

If EmailJS isn’t configured, the feedback form will show a clear error instead of silently failing.

## Deployment (GitHub Pages)
1. Commit this repository to GitHub.
2. In the repo settings, enable **GitHub Pages** using the `main` branch (root directory).
3. Your customer link will be `https://<username>.github.io/<repo>/index.html?p=...`.
4. Use `/admin.html` on the same domain to manage configuration and generate links.

## Admin usage tips
- Save configuration once, then copy the link or scan the QR code.
- You can include the logo URL; it will display above the stars for brand trust.
- “Reset” clears both the business config and EmailJS keys from localStorage.
- Regenerate and resend links whenever you change business details.

## Limitations
- Single-tenant MVP: each deployed site is for one business.
- EmailJS requires network access and correct public keys; offline use won’t send feedback.
- No server/database—configuration lives in the URL payload and/or browser storage.

## Testing / QA checklist
- Configure owner info and EmailJS in `admin.html`, click Save.
- Copy the customer link and open it in an incognito window: business name should appear.
- Select 5 stars: “Post on Google” button appears and redirects correctly when tapped.
- Select 2 stars: feedback form appears; submitting sends an EmailJS email and shows success.
- Open `index.html` without config: see “not configured” message with link to admin.
- Use mobile viewport: stars and buttons remain large and tappable.

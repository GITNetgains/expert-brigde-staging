# Email Template Changes — March 8, 2026
## For: GITNetgains (vendor team)

### What Changed

**1. Expert Registration Email (auth.controller.js)**
- Complete redesign of the expert signup success email in `completeTutorSignup`
- New branded HTML template with ExpertBridge logo, gradient header, numbered steps
- FROM changed to: "Daniel S" <daniel@expertbridge.online>
- Subject changed to: "Welcome to ExpertBridge — You're In!"
- Added "Atlas" AI branding and 5-step onboarding guide
- Fixed: email field was blank, date showed "YYYY" literal
- Location: `module/passport/auth.controller.js` (inline template)

**2. Welcome Email Template (MongoDB + file template)**
- Redesigned to match new branding
- REMOVED: Zoom invitation paragraph (Zoom accounts are no longer created during signup)
- FROM changed to: "Daniel S" <daniel@expertbridge.online>
- Subject changed to: "Welcome to ExpertBridge — Your Account is Ready"
- Added Atlas references and 3-step quick start guide
- Location: MongoDB `emailtemplates` collection (key: `tutor-approve`) AND `api/server/emails/tutor/approve.html`

**3. DocuSeal Auto-Send (NEW EC2)**
- Enabled `submitter_documents_copy_email` in DocuSeal account_configs
- Experts now automatically receive a copy of signed Terms of Work PDF by email
- No code changes needed — this is a database config toggle

### Do Not Modify
- The email HTML templates use inline CSS for email client compatibility
- The `daniel@expertbridge.online` sender is verified in AWS SES — changing it will break delivery
- The "Atlas" branding is intentional — it refers to our AI system
- The Zoom invitation paragraph was removed intentionally — do NOT re-add it

### Safe to Modify
- The email copy/text can be adjusted
- Colors and styling can be tweaked (keep inline CSS)
- Additional email templates can follow the same design pattern

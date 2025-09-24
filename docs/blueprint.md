# **App Name**: InvoiceCraft

## Core Features:

- Invoice Creation & Management: Create, edit, and manage invoices with auto-incrementing invoice numbers, client details, product/service listings, and automatic subtotal, tax, discount, and total calculations (in IDR).
- Google Sheets Integration: Connect to Google Sheets to store and retrieve invoice data, client details, and product information.
- Export & Sharing: Export invoices to PDF format. Share via email with attachments or send the generated link directly.
- Client & Product Catalogs: Maintain client records (name, email, address) and a product/service catalog for quick selection when creating invoices.
- Payment Status Tracking: Track invoice payment status (Paid, Unpaid, Overdue). Automatically send reminders for overdue invoices, using a tool to conditionally suggest adjustments based on payment history and client relationships.
- Authentication via Google Sign-In: Secure access with Google Sign-In and email whitelist validation (only file.azis@gmail.com is allowed). Display "Access Denied" and sign out unauthorized users.
- Dashboard: Visualize key metrics such as total invoices, pending payments, and monthly revenue (in IDR).

## Style Guidelines:

- Primary color: A muted blue (#6699CC) reflecting professionalism and trust.
- Background color: Light gray (#F0F0F0) for a clean and minimalist interface. This complements the blue while keeping a light scheme.
- Accent color: Soft orange (#E59866) to draw attention to key actions such as 'Send Invoice'.
- Body and headline font: 'Inter', a grotesque-style sans-serif with a modern look; easy to read in any font size.
- Use a consistent set of minimalist icons to represent actions and invoice status. These icons should be easily recognizable and match the professional tone of the application.
- Mobile-first, responsive layout with TailwindCSS. Content should be well-organized and easily accessible on all devices.
- Subtle transitions and animations to enhance user experience without being distracting.
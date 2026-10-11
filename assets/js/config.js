/* ==========================================================================
   SITE CONFIG — this is the only file you need to edit to go live.
   ========================================================================== */
window.SITE_CONFIG = {

  /* ----------------------------------------------------------------------
     1. CONTACT FORM  (required for the form to actually send)

     Get a free access key at https://web3forms.com — enter the inbox you
     want submissions delivered to (sebasuta@gmail.com), confirm the email
     they send you, then paste the key below.

     This key is safe to commit to a public repository: Web3Forms access
     keys are designed to live in client-side JavaScript, and a key can only
     ever deliver to the inbox that was verified against it. It is not a
     secret, it is an address.

     What it does NOT do on its own is stop someone else POSTing to your key
     from their own page. Lock that down in the Web3Forms dashboard:
     set Allowed Domains to your site's hostname and turn on spam protection.
     ---------------------------------------------------------------------- */
  web3formsKey: "e8561faf-a1ab-4e7f-830f-5625e69e617e",

  /* Subject line applied to every submission that lands in your inbox. */
  formSubject: "New enquiry from the Northbound website",

  /* ----------------------------------------------------------------------
     2. BOOKING LINK  (optional)

     Paste your scheduling URL — Cal.com, Calendly, Google Appointment
     Schedule, TidyCal, anything with a public link. Every "Book a call"
     button on the site picks it up automatically.

     Leave it empty and those buttons point at the contact form instead,
     so nothing is ever broken.
     ---------------------------------------------------------------------- */
  bookingUrl: "",

  /* Open the booking link in a new tab. */
  bookingNewTab: true,

  /* ----------------------------------------------------------------------
     3. CONTACT DETAILS

     The address is assembled in the browser rather than written into the
     HTML, which keeps it out of reach of the simplest address scrapers.
     ---------------------------------------------------------------------- */
  emailUser: "sebasuta",
  emailDomain: "gmail.com",

  /* Shown next to the form. Set to "" to hide. */
  responseTime: "within 1 business day",

  /* ----------------------------------------------------------------------
     4. SOCIAL / EXTERNAL  (leave empty to hide the link)
     ---------------------------------------------------------------------- */
  linkedinUrl: "",
  githubUrl: "",
};

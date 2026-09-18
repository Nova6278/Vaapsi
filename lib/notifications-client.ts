/**
 * REMOVED (audit C2).
 *
 * This helper posted caller-chosen {userId, message} pairs to /api/notify,
 * which let any user send arbitrary notifications and emails to any other
 * user. Notifications are now created server-side, inside the API route that
 * owns each event (see lib/notify.ts). Nothing imports this module anymore;
 * the file remains only to document the change. Safe to delete.
 */
export {}

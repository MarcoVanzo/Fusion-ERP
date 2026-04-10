/**
 * @fileoverview API Type Definitions — Fusion ERP
 *
 * These JSDoc typedefs document the shape of objects returned by the API
 * and used across the frontend. They provide IntelliSense hints in IDEs
 * and serve as the canonical reference for API contracts.
 *
 * Usage: Include this file in your project (it has no runtime effect).
 * IDEs like VS Code will automatically pick up these types.
 */

// ─── Authentication ───────────────────────────────────────────────────────────

/**
 * @typedef {Object} User
 * @property {number} id - Unique user ID
 * @property {string} email - Email address (unique, used for login)
 * @property {string} fullName - Display name (first + last)
 * @property {'admin'|'operatore'|'allenatore'|'atleta'} role - User role
 * @property {number} tenant_id - Multi-tenant organization ID
 * @property {string} [tenant_name] - Organization name
 * @property {boolean} needsReset - True if password has expired (90+ days)
 * @property {Object<string, 'read'|'write'>} permissions - Module-level permissions map
 * @property {string} [last_login] - ISO 8601 timestamp of last successful login
 */

/**
 * @typedef {Object} LoginResponse
 * @property {User} user - Authenticated user data (flattened into response)
 * @property {boolean} needsReset - Whether password reset is required
 */

// ─── Athletes ─────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Athlete
 * @property {number} id - Unique athlete ID
 * @property {number} tenant_id - Organization ID
 * @property {string} full_name - Display name
 * @property {string} [first_name] - Given name
 * @property {string} [last_name] - Family name
 * @property {string} [email] - Contact email
 * @property {string} [phone] - Contact phone
 * @property {string} [date_of_birth] - ISO date (YYYY-MM-DD)
 * @property {string} [fiscal_code] - Italian codice fiscale
 * @property {number|null} [jersey_number] - Jersey/shirt number
 * @property {string} [role] - Playing position/role
 * @property {string} [status] - 'active'|'inactive'|'injured'|'suspended'
 * @property {number|null} [team_id] - Primary team ID
 * @property {string|null} [team_name] - Primary team name (joined from DB)
 * @property {string|null} [photo_url] - Profile photo path
 * @property {string|null} [medical_cert_expires_at] - ISO date of medical cert expiry
 * @property {string|null} [medical_cert_type] - Type of medical certificate
 * @property {number} [deleted] - Soft-delete flag (0 = active, 1 = deleted)
 * @property {string} [created_at] - ISO 8601 creation timestamp
 * @property {string} [updated_at] - ISO 8601 last update timestamp
 */

/**
 * @typedef {Object} AthleteLight
 * @property {number} id
 * @property {string} full_name
 * @property {string|null} role
 * @property {string|null} team_name
 * @property {number|null} jersey_number
 * @property {string|null} medical_cert_expires_at
 */

// ─── Teams ────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Team
 * @property {number} id - Team ID
 * @property {number} tenant_id - Organization ID
 * @property {string} name - Team name
 * @property {string} [category] - Team category (e.g., 'Serie A', 'U18')
 * @property {string} [season] - Season identifier (e.g., '2025-2026')
 * @property {number} [athlete_count] - Number of athletes in team
 */

// ─── Tasks / Scadenze ────────────────────────────────────────────────────────

/**
 * @typedef {Object} Task
 * @property {number} id - Task ID
 * @property {number} tenant_id - Organization ID
 * @property {string} title - Task title
 * @property {string} [description] - Detailed description
 * @property {string} due_date - ISO date deadline
 * @property {'pending'|'in_progress'|'done'|'overdue'} status - Current status
 * @property {'low'|'medium'|'high'|'critical'} [priority] - Priority level
 * @property {number|null} [assigned_to] - User ID of assignee
 * @property {string|null} [assigned_name] - Assignee display name
 * @property {string} [category] - Task category
 * @property {boolean} [requires_callback] - Whether task requires a follow-up callback
 * @property {string} [created_at] - ISO 8601 timestamp
 */

// ─── Transport / Trasferte ──────────────────────────────────────────────────

/**
 * @typedef {Object} Trip
 * @property {number} id - Trip ID
 * @property {number} tenant_id - Organization ID
 * @property {string} destination - Destination city/venue
 * @property {string} departure_date - ISO date
 * @property {string} [return_date] - ISO date
 * @property {string} [departure_location] - Starting location
 * @property {number|null} [vehicle_id] - Assigned vehicle ID
 * @property {string|null} [vehicle_name] - Vehicle display name
 * @property {'planned'|'in_progress'|'completed'|'cancelled'} status
 * @property {string} [notes] - Trip notes
 * @property {TripExpense[]} [expenses] - Associated expenses
 */

/**
 * @typedef {Object} TripExpense
 * @property {number} id - Expense ID
 * @property {number} trip_id - Associated trip ID
 * @property {string} description - Expense description
 * @property {number} amount - Amount in EUR
 * @property {string} [category] - Expense category
 * @property {string} [receipt_url] - Receipt file path
 * @property {string} [date] - ISO date of expense
 */

// ─── Finance / Pagamenti ────────────────────────────────────────────────────

/**
 * @typedef {Object} Payment
 * @property {number} id - Payment ID
 * @property {number} tenant_id - Organization ID
 * @property {number} athlete_id - Payer athlete ID
 * @property {string} [athlete_name] - Payer display name
 * @property {number} amount - Payment amount in EUR
 * @property {string} [payment_date] - ISO date of payment
 * @property {string} [due_date] - ISO date payment was due
 * @property {'paid'|'pending'|'overdue'|'partial'} status
 * @property {string} [method] - Payment method (cash, transfer, card)
 * @property {string} [description] - Payment description
 * @property {string} [season] - Season reference
 */

// ─── Navigation Config ──────────────────────────────────────────────────────

/**
 * @typedef {Object} NavItem
 * @property {string} id - Unique identifier
 * @property {string} path - Route path (used by Router)
 * @property {string} title - Display title
 * @property {string} icon - Phosphor icon name (without 'ph ph-' prefix)
 * @property {string[]} [roles] - Allowed user roles (empty = all roles)
 * @property {boolean} [implemented] - False = show as "coming soon"
 * @property {boolean} [isMobileVisible] - Show in mobile bottom nav
 * @property {NavItem[]} [children] - Sub-menu items
 */

// ─── Store API Methods ──────────────────────────────────────────────────────

/**
 * @typedef {Object} StoreAPI
 * @property {function(string, string, Object=, string=): Promise<*>} api - POST/PUT/DELETE API call
 * @property {function(string, string, Object=): Promise<*>} get - GET API call with caching
 * @property {function(string): void} invalidate - Invalidate cache entries by key prefix
 * @property {function(): void} clearCache - Clear entire cache
 */

/**
 * @typedef {Object} UIAPI
 * @property {function(boolean): void} loading - Show/hide loading overlay
 * @property {function(string, string=, number=): void} toast - Display toast notification
 * @property {function(): string} skeletonPage - Get skeleton page HTML
 * @property {function(Object): {close: function}|null} modal - Create modal dialog
 * @property {function(string, function): void} confirm - Show confirmation dialog
 */

# Request 3: Dashboard editing
Add an "Assegna Quote (Massivo)" button strictly for the `quote` variant dashboard.
This button opens a modal `MassQuote-modal`.
In the modal:
- Target (All athletes, or filter by Team)
- The 4 quotas (inputs)
- "Applica a tutti".
When saved, it calls `AthletesAPI.bulkAssignQuotes(teamId, data)` or loops over athletes locally and calls `AthletesAPI.update(id, data)` (since we only have `update(id, data)` in `AthletesAPI.js`).

Let me verify what API endpoints we have.

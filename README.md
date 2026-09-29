# 🏙️ GUARDIA — Server City

Persistent Discord City Simulator / mini-MMO.

## Included
Player progression, interactive careers, side jobs, fictional criminal route, wanted/jail, bank, market, inventory, houses, vehicles, businesses, daily quest, leaderboard and Administrator-only panel.

## Railway
Set DISCORD_TOKEN, CLIENT_ID, GUILD_ID (recommended), and DATABASE_URL. Use Railway PostgreSQL for DATABASE_URL. Never commit secrets.

## Commands
/city /profile /job /sidejob /crime /jail /bank /market /inventory /house /vehicle /business /quest /leaderboard /admin


## All-in-one systems
- Web dashboard (`DASHBOARD_PORT`, protected by `DASHBOARD_KEY`)
- Private support tickets with staff claim/close buttons
- City districts, rotating events, pets, achievements and fictional Police career
- Persistent PostgreSQL data for the City systems

### Ticket setup
Set `STAFF_ROLE_ID` to the staff role. Optionally set `TICKET_CATEGORY_ID` so created tickets go into a category.

### Dashboard
Railway exposes the dashboard through the service port. Set `DASHBOARD_PORT` (usually the platform-provided port) and a strong `DASHBOARD_KEY`. The dashboard is intentionally protected; never put the key in public code.

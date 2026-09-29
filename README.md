# GUARDIA — Server City

A Discord City Simulator / mini-MMO.

## Current systems
- Player profiles, XP, money, bank and energy
- Main jobs with interactive mini-games
- Side jobs with interactive mini-games
- City profile and inventory
- Criminal system with wanted level
- Jail timers and prison activities
- Administrator-only admin panel
- PostgreSQL persistence through DATABASE_URL

## Railway
Set these variables in Railway:
- DISCORD_TOKEN
- CLIENT_ID
- GUILD_ID
- DATABASE_URL

Never commit real tokens or passwords.

## Commands
/city
/profile
/job
/sidejob
/crime
/jail
/admin

The project is intentionally modular so new jobs, districts, businesses, vehicles, quests, pets, events and mysteries can be added without rewriting the core.

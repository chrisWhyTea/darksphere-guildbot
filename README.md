# DarkSpher Guildbot

## Setup (Dev Mode)
1. `npm install`
2. Rename ".env-sample" to ".env" and edit the entries accordingly
3. Deploy all database stuff with `npx prisma migrate deploy`
4. Generate prisma client `npx prisma generate`
5. Build it with `npx tsc`
6. Run the Bot `npm start`
### 
1. webSockets Broadcast data : not create it. 
2. Design a db schema for sports via neon and  drizzle .
- db - source of records
-  webSockets - distribution layer.


*Design foundation of sports*

Q1. What a match looks like ?
Q2. how we store Score and status 
Q3. how we represent the live story of the game through commentary events 
Q4. How do we persist this, 
how do rebuild states when user refreshes ? , 
how do we handle multiple servers ?, 
How do we avoid sending fake or inconsistent data ? 

**1. Schema Design & Relations**
- Database - Postgres 
  - Real-Time Sports DB Schema : static anchor vs Fast events

- create Match( static/anchor ) : id, HomeTeam, AwayTeam, sport, startTime, Status(Scheduled live finished), HomeScore, AwayScore
- Commentary(Dynamic story Events) : id Match id Actor message, minute sequenceNo details 

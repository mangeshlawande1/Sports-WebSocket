# Theory Behind the Scene: 
1. webSockets Broadcast data : not create it. 
2. Design a db schema for sports via neon and  drizzle .
- db - source of records
-  webSockets - distribution layer.

### Control Flow :

- Game Database(state is stored)  ---> Match REST API(fetch match state, create/update moves)  ----> Websockets (Live game updates)


*Design foundation of sports*

    Q1. What a match looks like ?
    Q2. How we store Score and status 
    Q3. How we represent the live story of the game through commentary events 
    Q4. How do we persist this ?
    Q5. How do rebuild states when user refreshes ? 
    Q6. How do we handle multiple servers ?
    Q7. How do we avoid sending fake or inconsistent data ?
**1. Schema Design & Relations**
- Database - Postgres 
  - Real-Time Sports DB Schema : static anchor vs Fast events

- create Match( static/anchor ) : id, HomeTeam, AwayTeam, sport, startTime, Status(Scheduled live finished), HomeScore, AwayScore
- Commentary(Dynamic story Events) : id Match id Actor message, minute sequenceNo details

**2. REST**
  - Commands & initial states.
  - Create the Match 
  - Fetch the List of Matches
  - Load the app for first time.

**3. WebSocket**
  - Match Created 
  - Score Updated 
  - Commentary added 
  - Live Event Pushed Instantly
-------------------------------------------------

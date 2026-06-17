# Theory Behind the Scene: 
1. webSockets Broadcast data : not create it. 
2. Design a db schema for sports via neon and  drizzle .
- db - source of records
-  webSockets - distribution layer.

## Control Flow :

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

- create Match( static/anchor ) : id, HomeTeam, AwayTeam, sport, startTime, endTime, Status(Scheduled live finished), HomeScore, AwayScore
- Commentary(Dynamic story Events) : id, matchId (FK), minute, sequence, period, eventType, actor, team, message, metadata (JSONB), tags (array), createdAt

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

## Build WebSocket Layer 
- Persistent bidirectional data flow 
- Always open connection.


## Arcjet 
- add security measures for both http and websocket server 


1. Match API : 
  - Handles the overall structure

2. Commentary API 
  - Captures the story of the games .

Act as senior node js developer , using zod create a validation file validation commentary.js 
  1. create a listCommentaryQuerySchema an object of Optional Limit (coerced into a number, positive with max 100) 
  2. create a CreateCommentarySchema: includes fieldsfor minutes(non-neg int), sequence period(string) eventType, actor, team, message(required string) metadata(record), tagsarray of strings 
  3. use es modules and export the schemas.


  act as senior nodejs developer and generate a 
  post route for commentary.js file using drizzle orm 
  1. validate req.paramsusing the matchIdParamsSchema and req.body using createCommentarySchema, insert data into the commentary table and return the result 
  2. es modules  and handle errors with try catch 


Using Drizzle orm & express, generate a GET '/' route for nested commentary router 
1.validate req.params using matchIsParamSchema
2. fetch data from 'commentary' table where 'matchId' equals the ID from params
3. order the result by createdAt in descending order so the newest event appear at first. 
4. apply limit based on queryparameter (defaulting to 100 with a max_limit safety cap)
5. use es modules and handles error with try catch 


### Broadcast Commentary : 
- fuse this commentary with websocket server 

1. Implemant a Pub/Sub(public-Subscribe) Architecture : 
  - update only send to fans/users who have joins this specific match 
  Q. how you can implement new pattern with upcomming real time applications  ?
  
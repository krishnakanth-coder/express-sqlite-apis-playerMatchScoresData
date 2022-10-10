const express = require("express");
const path = require("path");

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () => {
      console.log("server up and running.......");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
//1.get players data
app.get("/players", async (request, response) => {
  const getPlayersData = `
    SELECT * from player_details;`;

  const playersArray = await db.all(getPlayersData);

  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

//2.get a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `
        SELECT 
          * 
        FROM 
          player_details
          WHERE 
            player_id = ${playerId};`;
  const playerData = await db.get(getPlayer);
  //console.log(playerData);
  response.send(convertPlayerDbObjectToResponseObject(playerData));
});

//3.Updates the details of a specific player based on the player ID

app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  //console.log(playerId + "|" + playerName);

  const updatePlayer = `
    UPDATE
      player_details
    SET
      player_name = '${playerName}'
    WHERE
      player_id = ${playerId};`;

  await db.run(updatePlayer);
  response.send("Player Details Updated");
});

//4. Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  // console.log(matchId);
  const getMatch = `
        SELECT 
          * 
        FROM 
          match_details
          WHERE 
            match_id = ${matchId};`;
  const matchData = await db.get(getMatch);
  //console.log(matchData);
  response.send(convertMatchDbObjectToResponseObject(matchData));
});

//5.Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchArray = `
    SELECT 
     *
    FROM
      player_match_score
    NATURAL JOIN 
      match_details
    where 
      player_id= ${playerId};`;
  const matchesArray = await db.all(getMatchArray);

  response.send(
    matchesArray.map((eachMatch) =>
      convertMatchDbObjectToResponseObject(eachMatch)
    )
  );
});

//Returns a list of players of a specific match;
const convertPlayers1DbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playName: dbObject.player_name,
  };
};
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  console.log(matchId);
  const getPlayersData = `
    SELECT 
      player_id ,
      player_name 
    FROM
      player_details
    NATURAL JOIN
      player_match_score
      
    where player_match_score.match_id= ${matchId};`;

  const playersArray = await db.all(getPlayersData);
  console.log(playersArray);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

//7.Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playersMatchDetails = await db.get(getMatchPlayersQuery);
  response.send(playersMatchDetails);
});
module.exports = app;

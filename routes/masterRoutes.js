const express = require("express");
const { createSessionType, getAllSessionTypes, getSessionTypeById, updateSessionType, deleteSessionType } = require("../controllers/SessionTypeController");
const { createPokerRoom, getAllPokerRooms, getPokerRoom, updatePokerRoom, deletePokerRoom, uploadCSV } = require("../controllers/PokerRoomController");
const upload = require("../middleware/upload");
const { createGameType, getAllGameTypes, updateGameType } = require("../controllers/GameTypesController");
const { createGame, getAllGames, getGameById, updateGame, deleteGame } = require("../controllers/GameController");
const { getAllSessions } = require("../controllers/SessionController");


const router = express.Router();

router.post(`/session-types`, createSessionType)
router.get(`/session-types`, getAllSessionTypes)
router.get(`/session-types/:id`, getSessionTypeById)
router.put(`/update-session-types/:id`, updateSessionType)
// router.delete(`/delete-session-types/:id`, deleteSessionType)




// roomroutes


// const express = require("express");
// const router = express.Router();
// const pokerRoomController = require("../controllers/pokerRoomController");
// const upload = require("../middlewares/upload"); // ✅ import middleware

// CRUD routes
router.post("/poker-room", createPokerRoom);
router.get("/poker-room", getAllPokerRooms);
router.get("/poker-room/:id", getPokerRoom);
router.put("/update-poker-room/:id", updatePokerRoom);
router.delete("/delete-poker-room/:id", deletePokerRoom);

// CSV upload route (use middleware here)
router.post("/upload-csv", upload.single("file"), uploadCSV);


// game types

router.post(`/game-types`, createGameType)
router.get(`/game-types`, getAllGameTypes)

router.put(`/update-game-types/:id`, updateGameType)


// games

router.post(`/games`, createGame);
router.get(`/games`, getAllGames);
router.get(`/games/:id`, getGameById);
router.put(`/update-games/:id`, updateGame);
router.delete(`/delete-games/:id`, deleteGame);



// sessions

// router.post(`/sessions`, createSessionType);
router.get(`/sessions`, getAllSessions);
// router.get(`/sessions/:id`, getSessionById);
// router.put(`/update-sessions/:id`, updateSession);
// router.delete(`/delete-sessions/:id`, deleteSession);

module.exports = router;

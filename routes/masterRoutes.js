const express = require("express");
const { createSessionType, getAllSessionTypes, getSessionTypeById, updateSessionType, deleteSessionType } = require("../controllers/SessionTypeController");
const { createPokerRoom, getAllPokerRooms, getPokerRoom, updatePokerRoom, deletePokerRoom, uploadCSV } = require("../controllers/PokerRoomController");
const upload = require("../middleware/upload");
const { createGameType, getAllGameTypes, updateGameType, deleteGameType } = require("../controllers/GameTypesController");
const { createGame, getAllGames, getGameById, updateGame, deleteGame } = require("../controllers/GameController");
const { getAllSessions, createSession, updateSession, getUserGameAnalytics } = require("../controllers/SessionController");
const { getAllUSers, getProfile, getUserProfile, updateUserProfile } = require("../controllers/UserController");
const { Auth } = require("../middleware/Auth");
const { CreateSubscription, GetAllSubscriptions, UpdateSubscription, ToggleSubscriptionStatus } = require("../controllers/SubscriptionController");
const { CreatePurchaseSubscription, GetAllPurchaseSubscriptions, GetOwnPurchaseSubscriptions } = require("../controllers/PurchaseSubsriptionController");
const { getallGameHistory } = require("../controllers/UserGameHistory");
const metadataFromSequelizeModel = require("../utils/metadataFromSchema");
const db = require("../models");

const Sessions = db.Sessions;
const GameTypes = db.GameTypes;
const PokerRoom = db.PokerRoom;
const SessionTypes = db.SessionTypes;

const Games = db.Games;





const router = express.Router();

router.post(`/session-types`, createSessionType)
router.get(`/session-types`, getAllSessionTypes)
router.get(`/session-types/:id`, getSessionTypeById)
router.put(`/update-session-types/:id`, updateSessionType)
router.delete(`/delete-session-types/:id`, deleteSessionType)




// roomroutes


// const express = require("express");
// const router = express.Router();
// const pokerRoomController = require("../controllers/pokerRoomController");
// const upload = require("../middlewares/upload"); //  import middleware

// CRUD routes
router.post("/poker-room", createPokerRoom);
router.get("/poker-room", getAllPokerRooms);
router.get("/poker-room/:id", getPokerRoom);
router.put("/update-poker-room/:id", updatePokerRoom);

router.put('/change-status-room/:id', Auth, deletePokerRoom)


// CSV upload route (use middleware here)
router.post("/upload-csv", upload.single("file"), uploadCSV);


// game types

router.post(`/game-types`, createGameType)
router.get(`/game-types`, getAllGameTypes)

router.put(`/update-game-types/:id`, updateGameType)
router.delete('/delete-game-types/:id', deleteGameType)


// games

router.post(`/games`, createGame);
router.get(`/games`, getAllGames);
router.get(`/games/:id`, getGameById);
router.put(`/update-games/:id`, updateGame);
router.delete(`/delete-games/:id`, deleteGame);




// sessions

router.post(`/sessions`, Auth, createSession);
router.get(`/sessions`, Auth, getAllSessions);
// router.get(`/sessions/:id`, getSessionById);
router.put(`/update-sessions/:id`, updateSession);
// router.delete(`/delete-sessions/:id`, deleteSession);
router.get("/sessions/metadata", async (req, res) => {
    try {
        const meta = await metadataFromSequelizeModel(
            Sessions,
            {
                session_notes: { type: "textarea", label: "Session Notes" },
            },
            {
                SessionTypes,
                GameTypes,
                Games,
                // PokerRooms
            }
        );

        res.json(meta);
    } catch (err) {
        console.error("Metadata Error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.get("/game-stats", Auth, getUserGameAnalytics);





// user routes 

router.get('/users', Auth, getAllUSers)

router.get('/profile', Auth, getProfile)
router.get('/user-detail/:id', Auth, getUserProfile)
router.put('/update-profile', Auth, updateUserProfile)






// subscription 

router.post('/subscription', upload.single("image"), Auth, CreateSubscription)
router.get('/subscription', Auth, GetAllSubscriptions)
router.put('/update-subscription/:id', upload.single("image"), Auth, UpdateSubscription)
router.put('/change-status-subscription/:id', Auth, ToggleSubscriptionStatus)



// purchase subscription

router.post('/purchase-subscription', Auth, CreatePurchaseSubscription)
router.get('/purchase-subscription', Auth, GetAllPurchaseSubscriptions)
router.get('/own-purchase-subscription', Auth, GetOwnPurchaseSubscriptions)


// game-history

router.get('/game-history', Auth, getallGameHistory)





module.exports = router;

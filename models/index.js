const db = require("../config/db");

db.User = require("./User");
db.Subscription = require("./Subscription");
db.Payment = require("./Payment");
db.PurchaseSubscription = require("./PurchaseSubscription");

db.SessionTypes = require("./SessionTypes");
db.PokerRoom = require('./PokerRoom');
db.GameTypes = require('./GameTypes');
db.Games = require('./Games');
db.Sessions = require('./Sessions');





// Set up associations after all models are loaded

// PurchaseSubscription

db.PurchaseSubscription.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
db.PurchaseSubscription.belongsTo(db.Subscription, { foreignKey: "subscription_id", as: "subscription" }); // ✅ fixed spelling
db.PurchaseSubscription.belongsTo(db.Payment, { foreignKey: "payment_reference", as: "payment" });


// Games

db.Games.belongsTo(db.GameTypes, { foreignKey: "game_type_id", as: "game_type" });



// sessions

db.Sessions.belongsTo(db.PokerRoom, { foreignKey: "room_id", as: "room" });
db.Sessions.belongsTo(db.GameTypes, { foreignKey: "game_type_id", as: "game_type" });
db.Sessions.belongsTo(db.Games, { foreignKey: "games_id", as: "game" });
db.Sessions.belongsTo(db.Games, { foreignKey: "session_type_id", as: "session_type" });


module.exports = db;
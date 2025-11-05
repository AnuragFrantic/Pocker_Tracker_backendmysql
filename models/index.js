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
db.UserGameHistory = require('./UserGameHistory');
db.Setting = require("./Settings")



// ---------------- PurchaseSubscription ----------------
db.PurchaseSubscription.belongsTo(db.User, { foreignKey: "user_id", as: "subscription_user" });  // renamed alias
db.PurchaseSubscription.belongsTo(db.Subscription, { foreignKey: "subscription_id", as: "subscription" });
db.PurchaseSubscription.belongsTo(db.Payment, { foreignKey: "payment_reference", as: "payment" });
db.User.hasMany(db.PurchaseSubscription, { foreignKey: "user_id", as: "subscriptions" });



// ---------------- Games ----------------
db.Games.belongsTo(db.GameTypes, { foreignKey: "game_type_id", as: "game_type" });



// ---------------- Sessions ----------------
db.Sessions.belongsTo(db.User, { foreignKey: "user_id", as: "user" });
db.User.hasMany(db.Sessions, { foreignKey: "user_id", as: "sessions" });
db.Sessions.belongsTo(db.SessionTypes, { foreignKey: "session_type_id", as: "session_type" });
db.Sessions.belongsTo(db.PokerRoom, { foreignKey: "room_id", as: "room" });
db.Sessions.belongsTo(db.GameTypes, { foreignKey: "game_type_id", as: "game_type" });
db.Sessions.belongsTo(db.Games, { foreignKey: "games_id", as: "game" });





// ---------------- UserGameHistory ----------------
db.User.hasMany(db.UserGameHistory, { foreignKey: "user_id", as: "game_histories" });
db.User.hasMany(db.PurchaseSubscription, { foreignKey: "user_id", as: "purchase_subscriptions" });


db.UserGameHistory.belongsTo(db.User, { foreignKey: "user_id", as: "history_user" });

db.Sessions.hasMany(db.UserGameHistory, { foreignKey: "session_id", as: "user_game_histories" });
db.UserGameHistory.belongsTo(db.Sessions, { foreignKey: "session_id", as: "session" });
db.UserGameHistory.belongsTo(db.Games, { foreignKey: "games_id", as: "games" });

// db.UserGameHistory.belongsTo(db.GameTypes, { foreignKey: "game_type_id", as: "game_type" });





module.exports = db;

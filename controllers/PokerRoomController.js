const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const db = require("../models");

const PokerRoom = db.PokerRoom;

// ✅ Create a poker room
exports.createPokerRoom = async (req, res) => {
    try {
        await PokerRoom.create(req.body);
        res.status(201).json({ message: "Poker room created successfully", error: false });
    } catch (error) {
        console.error("Error creating poker room:", error);
        res.status(500).json({ message: "Error creating poker room", error: true });
    }
};


// const clearPokerRooms = async () => {
//     try {
//         await db.sequelize.sync(); // ensure DB is connected
//         await PokerRoom.destroy({
//             where: {},
//             truncate: true
//         });
//         console.log("All poker rooms cleared successfully");
//         process.exit(0);
//     } catch (err) {
//         console.error("Error clearing poker rooms:", err);
//         process.exit(1);
//     }
// };

// clearPokerRooms();

// ✅ Get all poker rooms
exports.getAllPokerRooms = async (req, res) => {
    try {
        let data = await PokerRoom.findAll();
        res.json({ message: "Poker rooms retrieved successfully", error: false, data });
    } catch (error) {
        res.status(500).json({ message: "Error fetching poker rooms", error: true });
    }
};

// ✅ Get single poker room
exports.getPokerRoom = async (req, res) => {
    try {
        const room = await PokerRoom.findByPk(req.params.id);
        if (!room) {
            return res.status(404).json({ message: "Poker room not found", error: true });
        }
        res.json({ message: "Poker room retrieved successfully", error: false });
    } catch (error) {
        res.status(500).json({ message: "Error fetching poker room", error: true });
    }
};

// ✅ Update poker room
exports.updatePokerRoom = async (req, res) => {
    try {
        const room = await PokerRoom.findByPk(req.params.id);
        if (!room) {
            return res.status(404).json({ message: "Poker room not found", error: true });
        }
        await room.update(req.body);
        res.json({ message: "Poker room updated successfully", error: false });
    } catch (error) {
        res.status(500).json({ message: "Error updating poker room", error: true });
    }
};

// ✅ Delete poker room
exports.deletePokerRoom = async (req, res) => {
    try {
        const room = await PokerRoom.findByPk(req.params.id);
        if (!room) {
            return res.status(404).json({ message: "Poker room not found", error: true });
        }
        await room.destroy();
        res.json({ message: "Poker room deleted successfully", error: false });
    } catch (error) {
        res.status(500).json({ message: "Error deleting poker room", error: true });
    }
};


exports.uploadCSV = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded", error: true });

        const filePath = path.join(__dirname, "../uploads", req.file.filename);
        const results = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on("data", (row) => {
                results.push(row);
            })
            .on("end", async () => {
                try {
                    for (const row of results) {
                        await PokerRoom.upsert({
                            name: row.name,
                            address: row.address,
                            city: row.city,
                            state: row.state,
                            country: row.country,
                            lat: row.latitude,
                            long: row.longitude,
                            poker_links: row.poker_atlas_links,
                            description: row.description,
                            capacity: row.capacity,
                            is_active: row.is_active !== "false",
                        });
                    }

                    res.json({
                        message: "CSV imported successfully",
                        error: false
                    });

                    fs.unlinkSync(filePath); // clean up
                } catch (err) {
                    console.error("Error processing CSV:", err);
                    res.status(500).json({ message: "Error processing CSV", error: true });
                }
            });
    } catch (error) {
        console.error("Error uploading CSV:", error);
        res.status(500).json({ message: "Error uploading CSV", error: true });
    }
};



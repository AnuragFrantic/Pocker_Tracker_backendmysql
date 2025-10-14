const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const db = require("../models");
const { sequelize } = require('../config/db');

const { Op, literal, fn, col } = require("sequelize");
const PokerRoom = db.PokerRoom;

//  Create a poker room
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





exports.getAllPokerRooms = async (req, res) => {
    try {
        const { type, name, country, page = 1, limit = 50, lat, long } = req.query;

        let where = {};

        // If not admin, only active records
        if (type !== "admin") {
            where.is_active = true;
        }

        // Dynamic filters
        if (name) {
            where.name = { [Op.like]: `%${name}%` };
        }
        if (country) {
            where.country = { [Op.like]: `%${country}%` };
        }

        const offset = (page - 1) * limit;

        let attributes = { include: [] };
        let order = [["createdAt", "DESC"]];

        // If latitude & longitude are provided, calculate distance and filter by 1 km radius
        if (lat && long) {
            const latNum = parseFloat(lat);
            const longNum = parseFloat(long);

            attributes.include.push([
                literal(`(
      6371 * acos(
        cos(radians(${latNum}))
        * cos(radians(lat))
        * cos(radians(\`long\`) - radians(${longNum}))
        + sin(radians(${latNum})) * sin(radians(lat))
      )
    )`),
                "distance",
            ]);

            // Filter by 100 km radius
            where[Op.and] = literal(`(
    6371 * acos(
      cos(radians(${latNum}))
      * cos(radians(lat))
      * cos(radians(\`long\`) - radians(${longNum}))
      + sin(radians(${latNum})) * sin(radians(lat))
    )
  ) <= 100`);

            // Sort by distance first
            order = [[literal("distance"), "ASC"]];
        }

        const { rows: data, count: total } = await PokerRoom.findAndCountAll({
            where,
            attributes,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order,
        });

        res.json({
            message: "Poker rooms retrieved successfully",
            error: false,
            data,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error fetching poker rooms",
            error: true,
        });
    }
};



//  Get single poker room
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

//  Update poker room
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

//  Delete poker room


exports.deletePokerRoom = async (req, res) => {
    try {
        const room = await PokerRoom.findByPk(req.params.id);
        if (!room) {
            return res.status(404).json({ message: "Poker Room not found", error: true });
        }

        // Toggle the status
        room.is_active = !room.is_active;
        await room.save();

        res.status(200).json({
            message: `room ${room.is_active ? "activated" : "deactivated"} successfully`,
            error: false,
            data: room
        });
    } catch (err) {
        res.status(500).json({
            message: err.message || "Internal server error",
            error: true
        });
    }
};


// exports.uploadCSV = async (req, res) => {
//     try {
//         if (!req.file) return res.status(400).json({ message: "No file uploaded", error: true });

//         const filePath = path.join(__dirname, "../uploads", req.file.filename);
//         const results = [];

//         fs.createReadStream(filePath)
//             .pipe(csv())
//             .on("data", (row) => {
//                 results.push(row);
//             })
//             .on("end", async () => {
//                 try {
//                     for (const row of results) {
//                         await PokerRoom.upsert({
//                             name: row.name,
//                             address: row.address,
//                             city: row.city,
//                             state: row.state,
//                             country: row.country,
//                             lat: row.latitude,
//                             long: row.longitude,
//                             poker_links: row.poker_atlas_links,
//                             description: row.description,
//                             capacity: row.capacity,
//                             is_active: true,
//                         });
//                     }

//                     res.json({
//                         message: "CSV imported successfully",
//                         error: false
//                     });

//                     fs.unlinkSync(filePath); // clean up
//                 } catch (err) {
//                     console.error("Error processing CSV:", err);
//                     res.status(500).json({ message: "Error processing CSV", error: true });
//                 }
//             });
//     } catch (error) {
//         console.error("Error uploading CSV:", error);
//         res.status(500).json({ message: "Error uploading CSV", error: true });
//     }
// };


exports.uploadCSV = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded", error: true });

    const filePath = path.join(__dirname, "../uploads", req.file.filename);
    const results = [];

    try {
        // Wrap CSV reading in a Promise
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on("data", (row) => results.push(row))
                .on("end", resolve)
                .on("error", reject);
        });

        // Disable foreign key checks temporarily
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

        // Upsert each row
        for (const row of results) {
            // Optional: normalize special characters to avoid utf8mb4 issues
            const normalize = (str) => str ? str.normalize('NFKC') : str;

            await PokerRoom.upsert({
                name: normalize(row.name),
                address: normalize(row.address),
                city: normalize(row.city),
                state: normalize(row.state),
                country: normalize(row.country),
                lat: row.latitude ? parseFloat(row.latitude) : null,
                long: row.longitude ? parseFloat(row.longitude) : null,
                poker_links: row.poker_atlas_links,
                description: normalize(row.description),
                capacity: row.capacity ? parseInt(row.capacity) : null,
                is_active: true,
            });
        }

        // Re-enable foreign key checks
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        res.json({ message: "CSV imported successfully", error: false });
    } catch (err) {
        console.error("Error processing CSV:", err);

        // Ensure FK checks are re-enabled even if error occurs
        await sequelize.query("SET FOREIGN_KEY_CHECKS = 1").catch(e => console.error("Error re-enabling FK checks:", e));

        // Clean up file
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        res.status(500).json({ message: "Error processing CSV", error: true });
    }
};
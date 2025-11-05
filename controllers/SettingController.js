const path = require("path");
const fs = require("fs");
const db = require("../models");
const Setting = db.Setting;

/**
 * Create new Setting (image or pdf)
 */
exports.CreateSetting = async (req, res) => {
    try {
        const fileType = req.body.type?.toLowerCase() || "image";
        const filePath = req.file ? `/uploads/${req.file.filename}` : null;

        const newSetting = await Setting.create({
            ...req.body,
            image: filePath,
        });

        return res.status(201).json({
            message: "Setting created successfully",
            data: newSetting,
            error: false,
        });
    } catch (err) {
        console.error("Error creating setting:", err);
        return res.status(500).json({
            message: err.message || "Internal server error",
            error: true,
        });
    }
};





/**
 * Update Setting (replace file if new uploaded)
 */
exports.UpdateSetting = async (req, res) => {
    try {
        const { id } = req.params;
        const setting = await Setting.findByPk(id);

        if (!setting) {
            return res.status(404).json({ message: "Setting not found", error: true });
        }

        // Handle new file if uploaded
        let filePath = setting.image;
        if (req.file) {
            if (filePath && fs.existsSync(path.join(__dirname, "..", filePath))) {
                fs.unlinkSync(path.join(__dirname, "..", filePath)); // delete old file
            }
            filePath = `/uploads/${req.file.filename}`;
        }

        await setting.update({
            ...req.body,
            image: filePath,
        });

        return res.status(200).json({
            message: "Setting updated successfully",
            data: setting,
            error: false,
        });
    } catch (err) {
        console.error("Error updating setting:", err);
        return res.status(500).json({
            message: err.message || "Internal server error",
            error: true,
        });
    }
};



/**
 * Delete Setting (soft delete or permanent)
 */
exports.DeleteSetting = async (req, res) => {
    try {
        const { id } = req.params;

        const setting = await Setting.findByPk(id);

        if (!setting) {
            return res.status(404).json({
                message: "Setting not found",
                error: true,
            });
        }

        // ✅ Hard delete — permanently remove the record
        await setting.destroy();

        return res.status(200).json({
            message: "Setting deleted permanently",
            error: false,
        });
    } catch (err) {
        console.error("Error deleting setting:", err);
        return res.status(500).json({
            message: err.message || "Internal server error",
            error: true,
        });
    }
};



exports.GetSettings = async (req, res) => {
    try {
        const { type, id, is_active, download } = req.query;
        const user = req.user || {}; // assume middleware sets req.user

        // 🔹 Admin user: show all
        if (user.role === "admin") {
            const where = {};
            if (type) where.type = type;
            if (is_active !== undefined) where.is_active = is_active === "true";

            const allSettings = await Setting.findAll({ where, order: [["id", "DESC"]] });

            return res.status(200).json({
                message: "Settings fetched successfully (admin)",
                data: allSettings,
                error: false,
            });
        }

        // 🔹 If specific ID is provided
        if (id) {
            const setting = await Setting.findByPk(id);

            if (!setting) {
                return res.status(404).json({
                    message: "Setting not found",
                    error: true,
                });
            }

            // Handle download
            if (download === "true" && setting.image) {
                const filePath = path.join(__dirname, "..", setting.image);
                if (fs.existsSync(filePath)) {
                    return res.download(filePath);
                } else {
                    return res.status(404).json({
                        message: "File not found on server",
                        error: true,
                    });
                }
            }

            return res.status(200).json({
                message: "Single setting fetched successfully",
                data: setting,
                error: false,
            });
        }

        // 🔹 If filtering by type
        if (type) {
            const where = { type };
            if (is_active !== undefined) where.is_active = is_active === "true";

            const settingsByType = await Setting.findAll({ where, order: [["id", "DESC"]] });

            if (!settingsByType.length) {
                return res.status(404).json({
                    message: `No settings found for type '${type}'`,
                    error: true,
                });
            }

            return res.status(200).json({
                message: `Settings fetched successfully (type: ${type})`,
                data: settingsByType,
                error: false,
            });
        }

        // 🔹 Default: non-admin user (all visible settings)
        const where = {};
        if (is_active !== undefined) where.is_active = is_active === "true";
        const visibleSettings = await Setting.findAll({ where, order: [["id", "DESC"]] });

        return res.status(200).json({
            message: "Settings fetched successfully",
            data: visibleSettings,
            error: false,
        });
    } catch (err) {
        console.error("Error fetching settings:", err);
        return res.status(500).json({
            message: err.message || "Internal server error",
            error: true,
        });
    }
};
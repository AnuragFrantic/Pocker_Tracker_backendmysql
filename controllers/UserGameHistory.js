const db = require("../models");
const UserGameHistory = db.UserGameHistory;
const Games = db.Games;
const Sessions = db.Sessions
const PokerRoom = db.PokerRoom
const User = db.User;
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const { Op } = require("sequelize");



exports.getallGameHistory = async (req, res) => {
    const userid = req.user.id;
    const sessionid = req.query.session || req.query["session"];
    let whereCondition = {};
    const type = req.user.type

    if (type === "user") {
        // User can see only their own history
        whereCondition.user_id = userid;
    }

    if (sessionid) {
        whereCondition.session_id = sessionid;
    }

    try {
        const data = await UserGameHistory.findAll({
            where: whereCondition,
            include: [
                {
                    model: Games,
                    as: "games",
                    attributes: ["id", "name", "game_type_id"],
                },
            ],
        });

        // Parse JSON fields before sending
        const parsedData = data.map((item) => {
            const jsonFields = [
                "buy_in",
                "re_buys",
                "add_on_amount",
                "dealer_tips",
                "cash_out",
            ];

            const parsedItem = item.toJSON();

            jsonFields.forEach((field) => {
                try {
                    parsedItem[field] = parsedItem[field]
                        ? JSON.parse(parsedItem[field])
                        : [];
                } catch {
                    parsedItem[field] = [];
                }
            });

            return parsedItem;
        });

        res.json({
            data: parsedData,
            message: "Game History retrieved successfully",
            error: false,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message, error: true });
    }
};





// exports.getFormattedGameHistory = async (req, res) => {
//     const userId = req.user.id;
//     const sessionId = req.query.session || req.query["session"];
//     const whereCondition = { user_id: userId };

//     if (sessionId) {
//         whereCondition.session_id = sessionId;
//     }

//     try {
//         const histories = await UserGameHistory.findAll({
//             where: whereCondition,
//             include: [
//                 {
//                     model: Games,
//                     as: "games",
//                     attributes: ["id", "name"]
//                 },
//                 {
//                     model: Sessions,
//                     as: "session",
//                     attributes: ["id", "room_id", "createdAt", "session_notes", "stakes"],
//                     include: [
//                         {
//                             model: PokerRoom,
//                             as: "room",
//                             attributes: ["id", "name"]
//                         }
//                     ]
//                 }
//             ],
//             order: [["createdAt", "ASC"]]
//         });

//         // 🔹 Group by session
//         const grouped = {};

//         histories.forEach((record) => {
//             const s = record.session;
//             if (!s) return;

//             if (!grouped[s.id]) {
//                 grouped[s.id] = {
//                     sessionId: s.id,
//                     roomName: s.room ? s.room.name : "Home Game",
//                     date: new Date(s.createdAt).toLocaleDateString("en-US"),
//                     addOns: [],
//                     totalProfitLoss: 0,
//                     stakes: s.stakes || "-",
//                     notes: s.session_notes || "",
//                     game: record.games ? record.games.name : "-",
//                 };
//             }

//             // 🔸 Safely parse JSON fields
//             const parseArray = (val) => {
//                 if (!val) return [];
//                 try {
//                     return Array.isArray(val) ? val : JSON.parse(val);
//                 } catch {
//                     return [];
//                 }
//             };

//             const buyIn = parseArray(record.buy_in);
//             const rebuys = parseArray(record.re_buys);
//             const addOns = parseArray(record.add_on_amount);
//             const dealerTips = parseArray(record.dealer_tips);
//             const cashOut = parseArray(record.cash_out);
//             const mealsExp = Number(record.meals_other_exp || 0);

//             // 🔸 Compute totals
//             const totalBuyIn = buyIn.reduce((sum, x) => sum + (x.amount || 0), 0);
//             const totalRebuys = rebuys.reduce((sum, x) => sum + (x.amount || 0), 0);
//             const totalAddOns = addOns.reduce((sum, x) => sum + (x.amount || 0), 0);
//             const totalDealerTips = dealerTips.reduce((sum, x) => sum + (x.amount || 0), 0);
//             const totalCashOut = cashOut.reduce((sum, x) => sum + (x.amount || 0), 0);

//             grouped[s.id].addOns.push(...addOns);
//             const totalSpent = totalBuyIn + totalRebuys + totalAddOns + totalDealerTips + mealsExp;
//             const profitLoss = totalCashOut - totalSpent;
//             grouped[s.id].totalProfitLoss += profitLoss;
//         });

//         // 🔹 Format output
//         const result = Object.values(grouped).map((s) => ({
//             room: s.roomName,
//             date: s.date,
//             addOns: s.addOns.length > 0 ? s.addOns : [],
//             profitLoss: `$${s.totalProfitLoss.toFixed(2)}`,
//             stakes: s.stakes,
//             game: s.game,
//             notes: s.notes,
//         }));

//         res.json({
//             data: result,
//             message: "Formatted game history retrieved successfully",
//             error: false,
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: err.message, error: true });
//     }
// };



exports.getFormattedGameHistory = async (req, res) => {
    const userId = req.user.id;
    const sessionId = req.query.session || req.query["session"];
    const whereCondition = { user_id: userId };

    if (sessionId) {
        whereCondition.session_id = sessionId;
    }

    try {
        const histories = await UserGameHistory.findAll({
            where: whereCondition,
            include: [
                {
                    model: Games,
                    as: "games",
                    attributes: ["id", "name"]
                },
                {
                    model: Sessions,
                    as: "session",
                    attributes: ["id", "room_id", "createdAt", "session_notes", "stakes"],
                    include: [
                        {
                            model: PokerRoom,
                            as: "room",
                            attributes: ["id", "name"]
                        }
                    ]
                }
            ],
            order: [["createdAt", "ASC"]]
        });

        if (!histories.length) {
            return res.json({
                data: [],
                overall: { totalProfit: 0, totalLoss: 0, netProfitLoss: 0 },
                message: "No game history found",
                error: false,
            });
        }

        const grouped = {};
        let totalProfit = 0;
        let totalLoss = 0;

        histories.forEach((record) => {
            const s = record.session;
            if (!s) return;

            if (!grouped[s.id]) {
                grouped[s.id] = {
                    sessionId: s.id,
                    roomName: s.room ? s.room.name : "Home Game",
                    date: new Date(s.createdAt).toLocaleDateString("en-US"),
                    addOns: [],
                    totalProfitLoss: 0,
                    stakes: s.stakes || "-",
                    notes: s.session_notes || "",
                    game: record.games ? record.games.name : "-",
                };
            }

            const parseArray = (val) => {
                if (!val) return [];
                try {
                    return Array.isArray(val) ? val : JSON.parse(val);
                } catch {
                    return [];
                }
            };

            const buyIn = parseArray(record.buy_in);
            const rebuys = parseArray(record.re_buys);
            const addOns = parseArray(record.add_on_amount);
            const cashOut = parseArray(record.cash_out);

            const totalBuyIn = buyIn.reduce((sum, x) => sum + (x.amount || 0), 0);
            const totalRebuys = rebuys.reduce((sum, x) => sum + (x.amount || 0), 0);
            const totalAddOns = addOns.reduce((sum, x) => sum + (x.amount || 0), 0);
            const totalCashOut = cashOut.reduce((sum, x) => sum + (x.amount || 0), 0);

            grouped[s.id].addOns.push(...addOns);

            // ✅ Only include buy-in, re-buys, add-ons in "spent"
            const totalSpent = totalBuyIn + totalRebuys + totalAddOns;

            const profitLoss = totalCashOut - totalSpent;

            grouped[s.id].totalProfitLoss += profitLoss;

            if (profitLoss >= 0) totalProfit += profitLoss;
            else totalLoss += profitLoss;
        });

        const result = Object.values(grouped).map((s) => ({
            room: s.roomName,
            date: s.date,
            addOns: s.addOns.length > 0 ? s.addOns : [],
            profitLoss: `$${s.totalProfitLoss.toFixed(2)}`,
            stakes: s.stakes,
            game: s.game,
            notes: s.notes,
        })).sort((a, b) => new Date(b.date) - new Date(a.date));


        const netProfitLoss = totalProfit + totalLoss;

        res.json({
            data: result,
            overall: {
                totalProfit: Number(totalProfit.toFixed(2)),
                totalLoss: Number(totalLoss.toFixed(2)),
                netProfitLoss: Number(netProfitLoss.toFixed(2)),
            },
            message: "Formatted game history retrieved successfully",
            error: false,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message, error: true });
    }
};







// exports.annualreport = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         const year = req.query.year || new Date().getFullYear();

//         const histories = await UserGameHistory.findAll({
//             where: {
//                 user_id: userId,
//                 createdAt: {
//                     [Op.between]: [
//                         new Date(`${year}-01-01T00:00:00.000Z`),
//                         new Date(`${year}-12-31T23:59:59.999Z`),
//                     ],
//                 },
//             },
//             include: [
//                 {
//                     model: Games,
//                     as: "games",
//                     attributes: ["id", "name", "game_type_id"],
//                 },
//             ],
//         });

//         if (!histories.length) {
//             return res.status(200).json({
//                 message: `No game history found for year ${year}`,
//                 data: {
//                     totalBuyIns: 0,
//                     totalReBuys: 0,
//                     totalAddOns: 0,
//                     dealerTips: 0,
//                     mealsAndOthers: 0,
//                     totalExpenditure: 0,
//                     totalIncome: 0,
//                     netProfitLoss: 0,
//                     totalSessions: 0,
//                     profitLoss: 0,
//                 },
//                 error: false,
//             });
//         }

//         // Function to sum amounts, including JSON strings
//         const sumAmounts = (arr) => {
//             if (!arr) return 0;
//             if (typeof arr === "string") {
//                 try {
//                     arr = JSON.parse(arr);
//                 } catch {
//                     return 0;
//                 }
//             }
//             if (Array.isArray(arr)) {
//                 return arr.reduce((a, c) => a + (c?.amount || 0), 0);
//             }
//             if (typeof arr === "object" && arr.amount) return arr.amount;
//             if (typeof arr === "number") return arr;
//             return 0;
//         };

//         let totalBuyIns = 0;
//         let totalReBuys = 0;
//         let totalAddOns = 0;
//         let dealerTips = 0;
//         let totalCashOut = 0;
//         let mealsAndOthers = 0;
//         let profitLoss = 0;

//         histories.forEach((item) => {
//             totalBuyIns += sumAmounts(item.buy_in);
//             totalReBuys += sumAmounts(item.re_buys);
//             totalAddOns += sumAmounts(item.add_on_amount);
//             dealerTips += sumAmounts(item.dealer_tips);
//             totalCashOut += sumAmounts(item.cash_out);
//             mealsAndOthers += Number(item.meal_exp || 0);
//             profitLoss += Number(item.profit_loss || 0); // ✅ only session profit_loss
//         });

//         const totalExpenditure = totalBuyIns + totalReBuys + totalAddOns + dealerTips + mealsAndOthers;
//         const totalIncome = totalCashOut;
//         const netProfitLoss = totalIncome - totalExpenditure;

//         res.status(200).json({
//             message: `Annual Report for ${year}`,
//             data: {
//                 totalBuyIns,
//                 totalReBuys,
//                 totalAddOns,
//                 dealerTips,
//                 mealsAndOthers,
//                 totalExpenditure,
//                 totalIncome,
//                 netProfitLoss,
//                 totalSessions: histories.length,
//                 profitLoss, // only session profit_loss, excludes meals
//             },
//             error: false,
//         });
//     } catch (error) {
//         console.error("Annual Report Error:", error);
//         res.status(500).json({
//             message: "Error generating annual report",
//             error: true,
//             details: error.message,
//         });
//     }
// };




exports.annualreport = async (req, res) => {
    try {
        const userId = req.user.id;
        const year = req.query.year || new Date().getFullYear();

        const histories = await UserGameHistory.findAll({
            where: {
                user_id: userId,
                createdAt: {
                    [Op.between]: [
                        new Date(`${year}-01-01T00:00:00.000Z`),
                        new Date(`${year}-12-31T23:59:59.999Z`),
                    ],
                },
            },
            include: [
                {
                    model: Games,
                    as: "games",
                    attributes: ["id", "name", "game_type_id"],
                },
            ],
        });

        if (!histories.length) {
            return res.status(200).json({
                message: `No game history found for year ${year}`,
                data: {
                    totalBuyIns: 0,
                    totalReBuys: 0,
                    totalAddOns: 0,
                    dealerTips: 0,
                    mealsAndOthers: 0,
                    totalExpenditure: 0,
                    totalIncome: 0,
                    netProfitLoss: 0,
                    totalSessions: 0,
                    profitLoss: 0,
                },
                error: false,
            });
        }

        const sumAmounts = (arr) => {
            if (!arr) return 0;
            if (typeof arr === "string") {
                try { arr = JSON.parse(arr); } catch { return 0; }
            }
            if (Array.isArray(arr)) return arr.reduce((a, c) => a + (Number(c?.amount) || 0), 0);
            if (typeof arr === "object" && arr.amount) return Number(arr.amount);
            if (typeof arr === "number") return arr;
            return 0;
        };

        let totalBuyIns = 0;
        let totalReBuys = 0;
        let totalAddOns = 0;
        let dealerTips = 0;
        let mealsAndOthers = 0;
        let totalCashOut = 0;
        let profitLoss = 0; // gambling profit/loss

        histories.forEach((item) => {
            const buyIn = sumAmounts(item.buy_in);
            const reBuy = sumAmounts(item.re_buys);
            const addOn = sumAmounts(item.add_on_amount);
            const tip = sumAmounts(item.dealer_tips);
            const cashOut = sumAmounts(item.cash_out);
            const meal = Number(item.meal_exp || 0);

            totalBuyIns += buyIn;
            totalReBuys += reBuy;
            totalAddOns += addOn;
            dealerTips += tip;
            mealsAndOthers += meal;
            totalCashOut += cashOut;

            // Gambling profit/loss = income - gambling expenditures (exclude meals)
            profitLoss += cashOut - (buyIn + reBuy + addOn + tip);
        });

        const totalExpenditure = totalBuyIns + totalReBuys + totalAddOns + dealerTips + mealsAndOthers;
        const totalIncome = totalCashOut;
        const netProfitLoss = totalIncome - totalExpenditure;

        // 🔹 Swap netProfitLoss and profitLoss in the response
        res.status(200).json({
            message: `Annual Report for ${year}`,
            data: {
                totalBuyIns,
                totalReBuys,
                totalAddOns,
                dealerTips,
                mealsAndOthers,
                totalExpenditure,
                totalIncome,
                netProfitLoss: profitLoss, // swapped
                totalSessions: histories.length,
                profitLoss: netProfitLoss, // swapped
            },
            error: false,
        });
    } catch (error) {
        console.error("Annual Report Error:", error);
        res.status(500).json({
            message: "Error generating annual report",
            error: true,
            details: error.message,
        });
    }
};











// Utility to safely sum numeric values
const sumAmounts = (arr) => {
    if (!arr) return 0;
    if (typeof arr === 'string') {
        try { arr = JSON.parse(arr); } catch { return 0; }
    }
    if (Array.isArray(arr)) return arr.reduce((a, c) => a + (Number(c?.amount) || 0), 0);
    if (typeof arr === 'object' && arr.amount) return Number(arr.amount);
    if (typeof arr === 'number') return arr;
    return 0;
};

// Format number as USD currency
const USD = (n) =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(n || 0));

exports.generateTaxStatementPdf = async (req, res) => {
    try {
        const userId = req.user.id;
        const year = Number(req.query.year) || new Date().getFullYear();

        const start = new Date(`${year}-01-01T00:00:00.000Z`);
        const end = new Date(`${year}-12-31T23:59:59.999Z`);

        const histories = await UserGameHistory.findAll({
            where: {
                user_id: userId,
                createdAt: { [Op.between]: [start, end] },
            },
            include: [{ model: Games, as: 'games', attributes: ['id', 'name', 'game_type_id'] }],
            order: [['createdAt', 'ASC']],
        });

        if (!histories.length) {
            return res.status(404).json({ message: `No records found for year ${year}`, error: false });
        }

        let totalBuyIns = 0;
        let totalReBuys = 0;
        let totalAddOns = 0;
        let dealerTips = 0;
        let mealsAndOthers = 0;
        let totalGamblingIncome = 0;

        histories.forEach((h) => {
            const buyIn = sumAmounts(h.buy_in);
            const reBuy = sumAmounts(h.re_buys);
            const addOn = sumAmounts(h.add_on_amount);
            const tip = sumAmounts(h.dealer_tips);
            const cashOut = sumAmounts(h.cash_out);
            const meal = Number(h.meal_exp || 0);

            totalBuyIns += buyIn;
            totalReBuys += reBuy;
            totalAddOns += addOn;
            dealerTips += tip;
            mealsAndOthers += meal;
            totalGamblingIncome += cashOut;
        });

        const totalGamblingExpenditures = totalBuyIns + totalReBuys + totalAddOns;
        const totalGamblingProfitLoss = totalGamblingIncome - totalGamblingExpenditures;

        // --- PDF setup ---
        const filename = `tax-statement-${year}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        doc.pipe(res);

        // --- HEADER BAR with LOGO and BACKGROUND ---
        const logoPath = path.join(__dirname, '../assets/logo.png');
        const headerHeight = 70;

        // Background bar
        doc.rect(0, 0, doc.page.width, headerHeight).fill('#1a73e8');

        // Add logo if available
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 15, { width: 50 });
        }

        // Title in header
        doc.fillColor('#fff').font('Helvetica-Bold').fontSize(20)
            .text('Year-End Tax Statement', 120, 25, { align: 'left' });

        doc.moveDown(2);

        // Reset fill color for body
        doc.fillColor('#000');

        // --- Start content immediately below header ---
        doc.fillColor('#000');
        doc.y = headerHeight + 18; // slightly below the blue bar
        doc.font('Helvetica').fontSize(11).fillColor('#333');

        // --- Tax Summary Info (No User Details) ---
        const generatedAt = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

        // Use a custom X coordinate for perfect left alignment (same as blue bar start)
        const leftEdge = 60; // adjust to 0–25 depending on your logo alignment

        doc.text(`Tax Year: ${year}`, leftEdge, doc.y, { align: 'left' });
        doc.text(`Generated: ${generatedAt}`, leftEdge, doc.y + 5, { align: 'left' });

        doc.moveDown(1.2);




        // --- Section Helper ---
        const sectionTitle = (title) => {
            doc.moveDown(0.8);
            doc.font('Helvetica-Bold').fontSize(13).fillColor('#1a73e8').text(title);
            doc.moveDown(0.3);
            doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#1a73e8').stroke();
            doc.moveDown(0.7);
        };

        // --- Gambling Summary ---
        sectionTitle('Gambling Summary (Reportable)');

        const tableRow = (label, value, bold = false) => {
            doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
                .fontSize(11)
                .fillColor('#111')
                .text(label, 60, doc.y, { continued: true })
                .text(value, { align: 'right' });
        };

        tableRow('Total Gambling Expenditures', USD(totalGamblingExpenditures));
        tableRow('Total Gambling Income', USD(totalGamblingIncome));
        tableRow('Total Gambling Profit/Loss', USD(totalGamblingProfitLoss), true);

        // --- Other Expenses ---
        sectionTitle('Other Expenses (Not Included)');
        tableRow('Dealer Tips', USD(dealerTips));
        tableRow('Meals & Other Expenses', USD(mealsAndOthers));

        // --- Footer ---
        doc.moveDown(1.5);
        doc.fontSize(9).fillColor('#666')
            .text('Note:', { continued: true })
            .fillColor('#444')
            .text(' Gambling Profit/Loss = Cash-Outs − (Buy-Ins + Rebuys + Add-Ons).')
            .text('Dealer Tips and Meals/Other are shown separately and excluded from Gambling Profit/Loss.')
            .moveDown(0.8)
            .text('This document is system-generated for informational and tax reporting purposes only.', { align: 'left' });

        doc.moveDown(1);
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).strokeColor('#cccccc').stroke();
        doc.fontSize(9).fillColor('#666').text(`© ${year} StackeStats Geo`, 50, doc.y + 10, { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('Tax Statement PDF Error:', error);
        res.status(500).json({
            message: 'Error generating tax statement PDF',
            error: true,
            details: error.message,
        });
    }
};



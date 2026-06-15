require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// Ensure sessions dir exists
const sessionsDir = process.env.SESSION_DIR || path.join(__dirname, "sessions");
if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true });

// Global state (used by routes)
global.activeBots = new Map();
global.runningProcesses = new Map();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
const instagramRoutes = require("./routes/instagram");
const preferenceRoutes = require("./routes/preferences");
const creatorRoutes = require("./routes/creators");
const automationRoutes = require("./routes/automation");
const schedulerRoutes = require("./routes/scheduler");
const analyticsRoutes = require("./routes/analytics");
const instagramSessionRoutes = require("./routes/connectInstagram");
const creatorVerifyRoutes =
    require("./routes/creatorVerify");

app.use("/instagram", instagramRoutes);
app.use("/preferences", preferenceRoutes);
app.use("/creators", creatorRoutes);
app.use("/automation", automationRoutes);
app.use("/scheduler", schedulerRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/instagram-session", instagramSessionRoutes);

app.use(
    "/creator-verify",
    creatorVerifyRoutes
);

// Health
app.get("/", (req, res) => {
    res.json({
        status: "FeedFlow Backend Running",
        activeBots: global.activeBots.size,
        runningProcesses: global.runningProcesses.size,
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 FeedFlow Backend running on port ${PORT}`);
    console.log(`   Sessions directory: ${sessionsDir}`);

    // Start scheduler if it exists
    try {
        require("./services/schedulerService");
        console.log("   Scheduler service loaded");
    } catch (e) {
        console.log("   Scheduler service not found, skipping");
    }
});
require("dotenv").config();
require("./services/schedulerService");

const express = require("express");
const cors = require("cors");

const instagramRoutes = require("./routes/instagram");

const preferenceRoutes = require("./routes/preferences");

const creatorRoutes = require("./routes/creators");
const automationRoutes = require("./routes/automation");
const schedulerRoutes = require("./routes/scheduler");
const analyticsRoutes = require("./routes/analytics");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/instagram", instagramRoutes);
app.use("/preferences", preferenceRoutes);
app.use("/creators", creatorRoutes);
app.use("/automation", automationRoutes);
app.use("/scheduler", schedulerRoutes);
app.use("/analytics", analyticsRoutes);

app.get("/", (req, res) => {
    res.json({
        status: "FeedFlow Backend Running",
    });
});

app.listen(
    process.env.PORT || 5000,
    () => {
        console.log("Server running");
    }
);
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
const instagramSessionRoutes = require("./routes/connectInstagram");
const cron =
    require("node-cron");

const {
    runScheduler,
} = require(
    "./services/schedulerService"
);



const app = express();

app.use(cors());
app.use(express.json());

app.use("/instagram", instagramRoutes);
app.use("/preferences", preferenceRoutes);
app.use("/creators", creatorRoutes);
app.use("/automation", automationRoutes);
app.use("/scheduler", schedulerRoutes);
app.use("/analytics", analyticsRoutes);
app.use(
    "/instagram-session",
    instagramSessionRoutes
);

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
cron.schedule(
    "*/15 * * * * *",
    async () => {

        try {

            const result =
                await runScheduler();

            console.log(
                `⏰ Scheduler Tick (${result.processed} processed)`
            );

        } catch (err) {

            console.error(
                "CRON ERROR:"
            );

            console.error(
                err.message
            );

        }

    }
);
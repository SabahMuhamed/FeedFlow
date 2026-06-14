require("dotenv").config();

const express = require("express");
const cors = require("cors");

const instagramRoutes =
    require("./routes/instagram");

const preferenceRoutes =
    require("./routes/preferences");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/instagram", instagramRoutes);
app.use("/preferences", preferenceRoutes);

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
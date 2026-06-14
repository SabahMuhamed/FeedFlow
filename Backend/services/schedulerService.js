const cron =
    require("node-cron");

const axios =
    require("axios");

cron.schedule(
    "*/15 * * * * *",
    async () => {

        try {

            await axios.post(
                "http://192.168.20.12:5000/scheduler/run"
            );

            console.log(
                "Scheduler Tick"
            );

        } catch (err) {

            console.log(
                "CRON ERROR:"
            );

            console.log(
                err.response?.data ||
                err.message
            );

        }

    }
);
const { chromium } =
    require("playwright");

const path =
    require("path");

const fs =
    require("fs");

const supabase =
    require("./supabase");


async function connectInstagram(
    username
) {

    const browser =
        await chromium.launch({
            headless: false,
        });

    const context =
        await browser.newContext();

    const page =
        await context.newPage();

    await page.goto(
        "https://www.instagram.com/"
    );

    console.log(
        "Login to Instagram..."
    );

    await page.waitForURL(
        "**instagram.com/**",
        {
            timeout: 300000,
        }
    );

    const sessionPath =
        path.join(
            __dirname,
            "../sessions",
            `${username}.json`
        );

    await context.storageState({
        path: sessionPath,
    });
    await supabase
        .from(
            "instagram_accounts"
        )
        .update({
            session_connected:
                true,

            session_file:
                `${username}.json`,

            connected_at:
                new Date(),
        })
        .eq(
            "instagram_username",
            username
        );

    await browser.close();

    return {
        success: true,
        sessionFile:
            `${username}.json`,
    };



}
async function verifySession(
    username
) {

    const sessionPath =
        path.join(
            __dirname,
            "../sessions",
            `${username}.json`
        );

    if (
        !fs.existsSync(
            sessionPath
        )
    ) {

        return {
            valid: false,
        };
    }

    const browser =
        await chromium.launch({
            headless: true,
        });

    const context =
        await browser.newContext({
            storageState:
                sessionPath,
        });

    const page =
        await context.newPage();

    await page.goto(
        "https://www.instagram.com/"
    );

    const url =
        page.url();

    await browser.close();

    return {
        valid:
            !url.includes(
                "accounts/login"
            ),
    };
}

module.exports = {
    connectInstagram,
    verifySession,
};
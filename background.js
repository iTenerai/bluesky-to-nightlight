const prefix = "[Nightlight Repost Debug]: ";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received:", message);

    if (message.type === "sendRequest") {
        console.log(prefix + "Sending repost data to Nightlight");

        fetch(message.requestURL)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                if (data.status === 0) {
                    console.error(prefix + "Repost failed:", data.message);
                    sendResponse({ success: false, message: data.message });

                    chrome.notifications.create({
                        type: "basic",
                        iconUrl: chrome.runtime.getURL("assets/nightycry.png"),
                        title: "Failed to repost to Nightlight",
                        message: `Please check if you are logged in to Nightlight, try again later or contact support with this error: ${data.message}`,
                    });
                } else if (data.status === 1) {
                    console.log(prefix + "Repost successful");
                    sendResponse({ success: true, message: "Repost successful" });

                    chrome.notifications.create({
                        type: "basic",
                        iconUrl: chrome.runtime.getURL("assets/logo_monochrome.png"),
                        title: "Reposted to Nightlight",
                        message: "Post has been reposted to Nightlight successfully, you can view it in your Nightlight account.",
                    });
                }
            })
            .catch((error) => {
                console.error(prefix + "Error occurred while sending the request:", error);
                sendResponse({ success: false, message: "Request failed" });

                chrome.notifications.create({
                    type: "basic",
                    iconUrl: chrome.runtime.getURL("assets/nightycry.png"),
                    title: "Failed to repost to Nightlight",
                    message: "An unexpected error occurred while processing your request.",
                });
            });

        // Return true to indicate asynchronous response
        return true;
    }

    if (message.type === "cookieRequest") {
        getCookies(message.name, (cookie) => {
            sendResponse(cookie);
        });

        // Return true to indicate asynchronous response
        return true;
    }
});

function getCookies(name, callback) {
    chrome.cookies.get(
        {
            url: "https://night-light.cz",
            name: name,
        },
        (cookie) => {
            if (callback) {
                callback(cookie ? cookie.value : null);
            }
        }
    );
}
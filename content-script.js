/*
    Twitter to Nightlight
    ---------------------
    This extension is a simple tool that allows you to repost posts to Nightlight.
    It adds a "Nightlight" button to the repost dropdown menu on Twitter.

    Made with <3 by iTenerai (https://night-light.cz/u/itenerai)
    
*/

const prefix = "[Nightlight Repost Debug]: ";

var currentPost = null;
var login = "";
var password = "";
var dropdownBackground = null;

function squeezeNightlightIn() {

    document.querySelectorAll('[aria-label="Repost or quote post"]').forEach((element) => {
        element.addEventListener('click', function () {

            // Unlike Twitter, Bluesky uses the author's adress in its post id
            // Example: feedItem-by-thehorrormaster.bsky.social

            const parent = element.closest('[data-testid^="feedItem-by-"]');
            console.log(prefix + "closest parent found for reposting: ", parent);
            currentPost = parent;
        });
    });


    // Target the repost button container
    const posts = document.querySelectorAll('[aria-label="Test"], [role="menu"]');

    posts.forEach((post) => {
        // Avoid adding the button multiple times
        if (post.querySelector('.nightlight-repost') || !post.querySelector('[data-testid="repostDropdownRepostBtn"]')) return;

        const icon = document.createElement('div');
        icon.title = 'Nightlight Repost';
        icon.className = 'nightlight-repost';
        icon.style.cursor = 'pointer';

        // I am NOT making the elements manually, innerHTML is all you get
        icon.innerHTML = `<div aria-label="nightlightRepost" role="menuitem" tabindex="1" class="css-175oi2r r-1loqt21 r-1otgn73" style="flex-direction: row; align-items: center; gap: 16px; padding: 8px 10px; border-radius: 4px; min-height: 32px; outline: 0px;" data-testid="repostDropdownNightlightBtn"><div dir="auto" class="css-146c3p1" style="font-size: 13.125px; letter-spacing: 0px; color: rgb(215, 221, 228); flex: 1 1 0%; font-weight: 600; line-height: 13.125px; font-family: InterVariable, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;; font-variant: no-contextual;">Nightlight</div><div class="css-175oi2r" style="margin-right: -2px; margin-left: 12px;">
        <img src="` + browser.runtime.getURL('assets/logo_monochrome.png') + `" alt="Nightlight Repost" width="24" height="24"        
        </div></div>`

        icon.addEventListener('click', () => {
            repostToNightlight(currentPost);
            document.querySelector('[aria-label="Context menu backdrop, click to close the menu."]').click();
        });

        post.firstChild.appendChild(icon);
    });
}

squeezeNightlightIn();
fetchData();

// Observe for dynamically loaded posts and squeeze that thang in
const observer = new MutationObserver(squeezeNightlightIn);
observer.observe(document.body, { childList: true, subtree: true });

function repostToNightlight(element) {

    var type = 1; // 0 = text, 1 = picture, 2 = video/gif (currently only text and picture are supported)

    console.log(prefix + "Reposting to Nightlight");

    var picture = "";
    var text = "";

    if (element.querySelector('[data-expoimage="true"]') == null) {
        console.log(prefix + "No picture found, adjusting to text-only repost");
        type = 0;
    } else {
        picture = element.querySelector('[data-expoimage="true"]').querySelector('img').src;
    }

    if (element.querySelector('[data-testid="postText"]') == null) {
        console.log(prefix + "No text found, adjusting to picture-only repost");
        type = 1;
    } else {
        text = element.querySelector('[data-testid="postText"]').textContent;
    }

    // Get the author of the post, as a link
    var author = element.querySelector('[aria-label="View profile"], [role="link"]').href;

    console.log(prefix + "Picture: ", picture);
    console.log(prefix + "Text: ", text);
    console.log(prefix + "Author: ", author);

    var postData = {
        description: encodeURIComponent(text),
        picture: encodeURIComponent(picture),
        author: encodeURIComponent(author),
    };

    var requestURL = `https://night-light.cz/nlapi/nlapi2?` +
        `login=${encodeURIComponent(login)}&` +
        `password=${encodeURIComponent(password)}&` +
        `createPost=${encodeURIComponent(JSON.stringify(postData))}&` +
        `provider=bluesky`;

    console.log(prefix + "Request URL: ", requestURL);

    chrome.runtime.sendMessage(
        { type: "sendRequest", requestURL: requestURL },
        function (response) {
            console.log(prefix + "Response from Nightlight: ", response);
        }
    );

}

function fetchData() {
    chrome.runtime.sendMessage(
        { type: "cookieRequest", name: "password" },
        function (response) {
            password = response;
        }
    );
    chrome.runtime.sendMessage(
        { type: "cookieRequest", name: "username" },
        function (response) {
            login = response;
        }
    );
}

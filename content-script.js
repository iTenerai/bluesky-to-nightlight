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

function squeezeNightlightIn() {

    document.querySelectorAll('[aria-label="Repost or quote post"]').forEach((element) => {
        element.addEventListener('click', function () {

            // Unlike Twitter, Bluesky uses the author's adress in its post id
            // Example: feedItem-by-thehorrormaster.bsky.social

            const parent = element.closest('[data-testid="feedItem-by-*"]');
            console.log(prefix + "closest parent found for reposting: ", parent);
            currentPost = parent;
        });
    });


    // Target the repost button container
    const posts = document.querySelectorAll('[aria-label="Test"], [role="menu"]');
    const dropdownBackground = document.getElementsByClassName("css-175oi2r r-1p0dtai r-1d2f490 r-1xcajam r-zchlnj r-ipm5af")[0];

    posts.forEach((post) => {
        // Avoid adding the button multiple times
        if (post.querySelector('.nightlight-repost') || !post.querySelector('[data-testid="repostConfirm"]')) return;

        const icon = document.createElement('div');
        icon.title = 'Nightlight Repost';
        icon.className = 'nightlight-repost';
        icon.style.cursor = 'pointer';

        // I am NOT making the elements manually, innerHTML is all you get
        icon.innerHTML = `<div role="menuitem" tabindex="2" class="css-175oi2r r-1loqt21 r-18u37iz r-1mmae3n r-3pj75a r-13qz1uu r-o7ynqc r-6416eg r-1ny4l3l" data-testid="nightlightConfirm"><div class="css-175oi2r r-1777fci r-faml9v">
      <img src="` + browser.runtime.getURL('assets/logo_monochrome.png') + `" alt="Nightlight Repost" width="24" height="24" class="class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-1nao33i r-1q142lx"">
      </div><div class="css-175oi2r r-16y2uox r-1wbh5a2"><div dir="ltr" class="css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-37j5jr r-a023e6 r-rjixqe r-b88u0q" style="color: rgb(231, 233, 234);"><span class="css-1jxf684 r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3">Nightlight</span></div></div></div>`

        icon.addEventListener('click', () => {
            repostToNightlight(currentPost);
            dropdownBackground.click();
        });

        post.appendChild(icon);
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
        text = element.querySelector('[data-testid="postText"]').firstChild.innerHTML;
    }

    // Get the author of the post, as a link
    var author = element.querySelector('[aria-label="View profile"]').querySelector('[role="link"]').href;

    console.log(prefix + "Picture: ", picture);
    console.log(prefix + "Text: ", text);
    console.log(prefix + "Author: ", author);

    var postData = {
        description: text,
        picture: picture,
        author: author,
    };

    var requestURL = `https://night-light.cz/nlapi/nlapi2?` +
        `login=${encodeURIComponent(login)}&` +
        `password=${encodeURIComponent(password)}&` +
        `createPost=${encodeURIComponent(JSON.stringify(postData))}&` +
        `provider=bluesky`;

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

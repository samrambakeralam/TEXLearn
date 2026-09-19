/*************************************************
 SAMRAMBA KERALAM 2030
 Video Catalogue
 Data Source: Google Sheet → Apps Script API
*************************************************/

(function () {

  "use strict";

  //------------------------------------------------
  // CONFIG
  //------------------------------------------------

  const VIDEO_CATALOGUE_API =
    "https://script.google.com/macros/s/AKfycbzQFLeWMQAX7gbedsu859N8nEZnGoAFinj4dn1JgpX0La7GSy-2xGHK38MdjcHM2ckk/exec";


  //------------------------------------------------
  // DATA STORE
  //------------------------------------------------

  const VIDEOS = [];

  window.SAMRAMBA_VIDEO_CATALOGUE = VIDEOS;


  //------------------------------------------------
  // LOAD VIDEO CATALOGUE
  //------------------------------------------------

  function loadVideoCatalogue() {

    const callbackName =
      "samrambaVideoCatalogueCallback_" +
      Date.now();

    window[callbackName] =
      function (response) {

        try {

          if (
            !response ||
            response.success !== true ||
            !Array.isArray(response.videos)
          ) {

            console.error(
              "Video Catalogue API returned invalid data.",
              response
            );

            return;

          }


          //------------------------------------------------
          // Update the same array reference
          //------------------------------------------------

          VIDEOS.length = 0;

          response.videos.forEach(
            function (video) {

              VIDEOS.push(video);

            }
          );


         //------------------------------------------------
// Render Video Catalogue
//------------------------------------------------

renderVideoCatalogue_();


//------------------------------------------------
// Notify the website
//------------------------------------------------

window.dispatchEvent(
  new CustomEvent(
    "samrambaVideoCatalogueLoaded"
  )
);


          console.log(
            "SAMRAMBA Video Catalogue loaded:",
            VIDEOS
          );

        }
        catch (error) {

          console.error(
            "Error processing Video Catalogue:",
            error
          );

        }
        finally {

          delete window[callbackName];

        }

      };


    //------------------------------------------------
    // JSONP SCRIPT
    //------------------------------------------------

    const script =
      document.createElement("script");

    script.src =
      VIDEO_CATALOGUE_API +
      "?action=videocatalogue" +
      "&callback=" +
      encodeURIComponent(callbackName);

    script.async = true;

    script.onerror =
      function () {

        console.error(
          "Failed to load Video Catalogue API."
        );

        delete window[callbackName];

      };

    document.head.appendChild(script);

  }


//------------------------------------------------
// RENDER VIDEO CATALOGUE
//------------------------------------------------

function renderVideoCatalogue_() {

  const videoGrid =
    document.querySelector(
      ".hub-video-grid"
    );

  const videoDots =
    document.querySelector(
      ".hub-video-dots"
    );


  if (!videoGrid) {

    console.error(
      "Video grid not found."
    );

    return;

  }


  //------------------------------------------------
  // Clear existing hard-coded cards
  //------------------------------------------------

  videoGrid.innerHTML = "";


  //------------------------------------------------
  // Clear existing hard-coded dots
  //------------------------------------------------

  if (videoDots) {

    videoDots.innerHTML = "";

  }


  //------------------------------------------------
  // Create video cards
  //------------------------------------------------

  VIDEOS.forEach(
    function (video, index) {

      const card =
        document.createElement(
          "article"
        );

      card.className =
        "hub-video-card";

      card.dataset.platform =
  video.platform || "";

card.dataset.videoUrl =
  video.videoUrl || "";


      //------------------------------------------------
      // Play button
      //------------------------------------------------

      const playButton =
        document.createElement(
          "button"
        );

      playButton.className =
        "hub-video-play";

      playButton.type =
        "button";

      playButton.setAttribute(
        "aria-label",
        "Play video"
      );


      //------------------------------------------------
      // Thumbnail
      //------------------------------------------------

      const thumbnail =
        document.createElement(
          "img"
        );

      thumbnail.className =
        "hub-video-thumbnail";

      if (video.thumbnail) {

  thumbnail.src =
    video.thumbnail;

}
else if (
  video.platform === "youtube" &&
  video.videoUrl
) {

  const youtubeMatch =
    video.videoUrl.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );

  const youtubeID =
    youtubeMatch
      ? youtubeMatch[1]
      : "";

  if (youtubeID) {

    thumbnail.src =
      "https://img.youtube.com/vi/" +
      encodeURIComponent(
        youtubeID
      ) +
      "/maxresdefault.jpg";

  }

}

      thumbnail.alt =
        video.title ||
        "Entrepreneurial Story";


      //------------------------------------------------
      // Play icon
      //------------------------------------------------

      const playIcon =
        document.createElement(
          "span"
        );

      playIcon.className =
        "hub-video-play-button";

      playIcon.setAttribute(
        "aria-hidden",
        "true"
      );

      playIcon.innerHTML =
        '<i data-lucide="play"></i>';


    //------------------------------------------------
// Assemble card
//------------------------------------------------

playButton.appendChild(
  thumbnail
);

playButton.appendChild(
  playIcon
);

card.appendChild(
  playButton
);

videoGrid.appendChild(
  card
);


//------------------------------------------------
// Instagram Reel
//------------------------------------------------

if (
  video.platform === "instagram" &&
  video.videoUrl
) {

  playButton.addEventListener(
    "click",
    function () {

      const embed =
        document.createElement(
          "iframe"
        );

      embed.className =
        "hub-video-instagram";

      embed.src =
        video.videoUrl.replace(
          /\/?$/,
          "/embed/"
        );

      embed.title =
        video.title ||
        "Instagram Reel";

      embed.setAttribute(
        "frameborder",
        "0"
      );

      embed.setAttribute(
        "allowfullscreen",
        "true"
      );

      embed.setAttribute(
        "scrolling",
        "no"
      );

      embed.setAttribute(
        "allow",
        "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      );

      card.innerHTML = "";

      card.appendChild(
        embed
      );

    }
  );

}


      //------------------------------------------------
      // Create navigation dot
      //------------------------------------------------

      if (videoDots) {

        const dot =
          document.createElement(
            "button"
          );

        dot.type =
          "button";

        dot.className =
          "hub-video-dot" +
          (
            index === 0
              ? " active"
              : ""
          );

        dot.setAttribute(
          "aria-label",
          "Show video " +
          (index + 1)
        );

        videoDots.appendChild(
          dot
        );

      }

    }
  );


  //------------------------------------------------
  // Refresh Lucide icons
  //------------------------------------------------

  if (
    window.lucide &&
    typeof window.lucide.createIcons ===
      "function"
  ) {

    window.lucide.createIcons();

  }

}


  //------------------------------------------------
  // START
  //------------------------------------------------

  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      loadVideoCatalogue
    );

  }
  else {

    loadVideoCatalogue();

  }

})();
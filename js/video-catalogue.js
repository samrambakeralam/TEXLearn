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
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
// import { XMLHttpRequest } from "xmlhttprequest-ts";
import * as cheerio from "cheerio";
import * as request from "request";

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//

export const houses = functions.pubsub.topic("PriceHousing").onPublish(() => {
  console.log("hello again");
  main();
});

function main() {
  console.log("hello Im in main");
  db.collection("houses")
    .doc("katerina")
    .set({ kat: "kat" })
    .then(res => {
      console.log("successfully written katerina");
    })
    .catch(err => {
      console.log("error", err);
    });
  let url =
    "https://www.xe.gr/property/search?Geo.area_id_new__hierarchy=82448&Item.area.from=70&System.item_type=re_residence&Transaction.price.to=600&Transaction.type_channel=117541&page=1&per_page=50";

  //   let req = new XMLHttpRequest();
  //   req.open("GET", url, false);
  //   req.send(null);

  request(url, (error, response, body) => {
    console.log("error:", error); // Print the error if one occurred
    console.log(
      "statusCode:",
      response && response.statusCode,
      response.body,
      response.statusMessage
    ); // Print the response status code if a response was received
    console.log("body:", body); // Print the HTML for the Google homepage.

    let homesList: any[] = [];

    const $ = cheerio.load(body);
    $(".lazy.r").text();
    $(".lazy.r").each((index, element) => {
      homesList[index] = {};
      var title = $(element).find(".r_desc");
      var date = $(element).find(".r_date");
      var stats = $(element).find(".r_stats");

      let title_string = $(title)
        .find("h2")
        .text()
        .replace(/\t/g, "")
        .replace(/\n/g, "")
        .replace(/\t/g, "");

      let description_string = $(title)
        .find("p")
        .text()
        .replace(/\t/g, "")
        .replace(/\n/g, "")
        .replace(/\t/g, "");

      let date_string = $(date)
        .text()
        .replace(/\t/g, "")
        .replace(/\n/g, "")
        .replace(/\t/g, "");

      let link = $(element).find("a.r_t");
      homesList[index]["link"] = `https://www.xe.gr/${$(link).attr("href")}`;

      homesList[index]["title"] = title_string;
      homesList[index]["description"] = description_string;
      homesList[index]["date_string"] = date_string;

      let year = date_string.split(" ");
      homesList[index]["year"] = year[year.length - 1];

      homesList[index]["month"] = getMonth(year[2]);

      homesList[index]["dayof"] = year[1];

      homesList[index]["full_date"] =
        year[year.length - 1] + getMonth(year[2]) + year[1];

      let price_string;
      let area_string;
      let price_per_sqm_string;

      $(stats)
        .find("li")
        .each((index2, element2) => {
          if (index2 == 0) {
            price_string = $(element2).text();
            homesList[index]["price_string"] = price_string;
            homesList[index]["price"] = price_string.split(" ")[0]
              ? price_string.split(" ")[0]
              : null;
          }
          if (index2 == 1) {
            area_string = $(element2).text();
            homesList[index]["area_string"] = area_string;
            homesList[index]["area"] = area_string.substring(
              0,
              area_string.length - 5
            );
          }
          if (index2 == 2) {
            price_per_sqm_string = $(element2).text();
            homesList[index]["price_per_sqm_string"] = price_per_sqm_string;
          }
        });

      let unique_string =
        title_string + date_string + price_string + area_string;
      const digest = crypto.createHmac("sha256", unique_string).digest("hex");

      db.collection("houses")
        .doc(digest)
        .set(homesList[index])
        .then(res => {
          console.log("successfully written house", homesList[index]["title"]);
        })
        .catch(err => {
          console.log("error", err);
        });
    });
  });
}

function getMonth(name: string): string {
  switch (name) {
    case "Ιαν":
      return "01";
    case "Φεβ":
      return "02";
    case "Μαρ":
      return "03";
    case "Απρ":
      return "04";
    case "Μαΐ":
      return "05";
    case "Ιουν":
      return "06";
    case "Ιουλ":
      return "07";
    case "Αυγ":
      return "08";
    case "Σεπ":
      return "09";
    case "Οκτ":
      return "10";
    case "Νοε":
      return "11";
    case "Δεκ":
      return "12";
    default:
      return "01";
  }
}

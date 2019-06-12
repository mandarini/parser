const cheerio = require("cheerio");
const admin = require("firebase-admin");

const serviceAccount = require("./parser-home-firebase-adminsdk-v5nyr-95a69a4ea5.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://parser-home.firebaseio.com"
});

const db = admin.firestore();

var url =
  "https://www.xe.gr/property/search?Geo.area_id_new__hierarchy=82448&Item.area.from=70&System.item_type=re_residence&Transaction.price.to=600&Transaction.type_channel=117541&page=1&per_page=50";
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var req = new XMLHttpRequest();
req.open("GET", url, false);
req.send(null);

var homesList = [];

if (req.status == 200) {
  const $ = cheerio.load(req.responseText);
  $(".lazy.r").text();
  $(".lazy.r").each(function(index, element) {
    homesList[index] = {};
    var title = $(element).find(".r_desc");
    homesList[index]["title"] = $(title)
      .find("h2")
      .text()
      .replace(/\t/g, "")
      .replace(/\n/g, "")
      .replace(/\t/g, "");

    homesList[index]["description"] = $(title)
      .find("p")
      .text()
      .replace(/\t/g, "")
      .replace(/\n/g, "")
      .replace(/\t/g, "");

    var date = $(element).find(".r_date");
    homesList[index]["date"] = $(date)
      .text()
      .replace(/\t/g, "")
      .replace(/\n/g, "")
      .replace(/\t/g, "");

    var stats = $(element).find(".r_stats");
    $(stats)
      .find("li")
      .each(function(index2, element2) {
        console.log(index2, $(element2).text());
        if (index2 == 0) {
          homesList[index]["price"] = $(element2).text();
        }
        if (index2 == 1) {
          homesList[index]["area"] = $(element2).text();
        }
        if (index2 == 2) {
          homesList[index]["price_per_sqm"] = $(element2).text();
        }
      });

    /**
       * Unique ID
       * 
       *       const digest = crypto
                        .createHmac("sha256", sorted_array.toString())
                        .digest("hex");
       */
  });
  console.log(homesList);
  let json = JSON.stringify(homesList);
  var fs = require("fs");
  fs.writeFile("myjsonfile.json", json, "utf8", function() {
    console.log("ok");
  });
}

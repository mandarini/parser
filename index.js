const cheerio = require("cheerio");
const admin = require("firebase-admin");
const crypto = require("crypto");

const serviceAccount = require("./house-parser-firebase-adminsdk-x68i7-c27b6b4e98.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://house-parser.firebaseio.com"
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
    console.log($(link).attr("href"));
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
      .each(function(index2, element2) {
        // console.log(index2, $(element2).text());
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

    let unique_string = title_string + date_string + price_string + area_string;
    const digest = crypto.createHmac("sha256", unique_string).digest("hex");
    db.collection("houses")
      .doc(digest)
      .set(homesList[index])
      .then(res => {
        console.log("success");
      })
      .catch(err => {
        console.log("error", err);
      });
  });
  console.log(homesList);
  let json = JSON.stringify(homesList);
  var fs = require("fs");
  fs.writeFile("myjsonfile.json", json, "utf8", function() {
    console.log("ok");
  });
}

function getMonth(name) {
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

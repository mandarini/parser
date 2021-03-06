import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import * as cheerio from "cheerio";
import * as rp from "request-promise";
import { DocumentSnapshot } from "firebase-functions/lib/providers/firestore";
import { DocumentData } from "@google-cloud/firestore";

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//

// export const pushNotif = functions.firestore
//   .document("houses/{houseID}")
//   .onWrite((change, context) => {
//     const newValue = change.after.data();
//     console.log("written house", newValue);
//   });

// Sends a notifications to all users when a new message is posted.
export const sendNotifications = functions.firestore
  .document("houses/{houseID}")
  .onWrite((change, context) => {
    // Only send a notification when a message has been created.
    // const newValue = change.after.data();

    const payload = {
      notification: {
        title: `New house`,
        body: "New house posted",
        click_action: `https://house-parser.firebaseapp.com`
      }
    };

    // Get the list of device tokens.
    return db
      .collection("fcmTokens")
      .get()
      .then(tokens_snapshot => {
        /***
         * Got all sites, now for each site,
         * get he capacitors table
         */
        tokens_snapshot.forEach(token => {
          // Send notifications to all tokens.
          return admin
            .messaging()
            .sendToDevice(token.id, payload)
            .then(response => {
              // For each message check if there was an error.

              response.results.forEach((result, index) => {
                const error = result.error;
                if (error) {
                  console.error(
                    "Failure sending notification to",
                    token,
                    error
                  );
                  // Cleanup the tokens who are not registered anymore.
                  if (
                    error.code === "messaging/invalid-registration-token" ||
                    error.code === "messaging/registration-token-not-registered"
                  ) {
                    db.collection("fcmTokens")
                      .doc(token.id)
                      .delete();
                  }
                }
              });
            });
        });
      });
  });

export const houses = functions.pubsub.topic("PriceHousing").onPublish(() => {
  main();
});

function main() {
  console.log("main started");
  let url =
    "https://www.xe.gr/property/search?Geo.area_id_new__hierarchy=82448&Item.area.from=65&System.item_type=re_residence&Transaction.price.to=700&Transaction.type_channel=117541&page=1&per_page=50";
  const options = {
    uri: url,
    headers: { "User-Agent": "test" },
    transform: (body: any) => cheerio.load(body)
  };

  let homesList: any[] = [];
  rp(options)
    .then(async $ => {
      console.log("got body", $(".lazy.r").text());
      $(".lazy.r").text();
      $(".lazy.r").each((index: any, element: any) => {
        homesList[index] = {};
        let title = $(element).find(".r_desc");
        let date = $(element).find(".r_date");
        let stats = $(element).find(".r_stats");

        console.log($(title).text());

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
        homesList[index]["link"] = `https://www.xe.gr${$(link).attr("href")}`;

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
          .each((index2: any, element2: any) => {
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

        let unique_string = title_string + description_string + area_string;
        const digest = crypto.createHmac("sha256", unique_string).digest("hex");

        homesList[index]["uuid"] = digest;

        db.collection("houses")
          .doc(digest)
          .get()
          .then((doc: DocumentSnapshot) => {
            console.log(doc.data());
            if (doc.exists) {
              if (doc && doc.data()) {
                let document: DocumentData | undefined = doc.data();
                if (document === undefined) document = {};
                if (
                  document["price"] !== homesList[index]["price"] ||
                  document["full_date"] !== homesList[index]["full_date"]
                ) {
                  doc.ref
                    .update(homesList[index])
                    .then(() => {
                      console.log("updated", digest);
                    })
                    .catch(err => {
                      console.log("error updating", digest, err);
                    });
                }
              }
            } else {
              db.collection("houses")
                .doc(digest)
                .set(homesList[index])
                .then(() => {
                  console.log("set", digest);
                })
                .catch(err => {
                  console.log("error set", digest, err);
                });
            }
          })
          .catch(err => {
            console.log("couldnt get doc");
            db.collection("houses")
              .doc(digest)
              .set(homesList[index])
              .then(() => {
                console.log("set", digest);
              })
              .catch(err => {
                console.log("error set", digest, err);
              });
          });
      });
    })
    .catch(err => {
      console.log("error getting page", err);
      return null;
    });
  return true;
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

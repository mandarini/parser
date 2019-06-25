import { Component } from "@angular/core";
import { AngularFireMessaging } from "@angular/fire/messaging";
import { AngularFirestore } from "@angular/fire/firestore";
import { mergeMap, mergeMapTo } from "rxjs/operators";
import { AngularFireAuth } from "@angular/fire/auth";
import { auth } from "firebase/app";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {
  constructor(
    private afMessaging: AngularFireMessaging,
    private db: AngularFirestore,
    public afAuth: AngularFireAuth
  ) {}
  login() {
    this.afAuth.auth.signInWithPopup(new auth.GoogleAuthProvider());
  }
  logout() {
    this.afAuth.auth.signOut();
  }
  requestPermission() {
    this.afMessaging.requestToken.subscribe(
      token => {
        // this.db.collection('fcmTokens')
        if (token) {
          console.log("Permission granted! Save to the server!", token);
          // Save the Device Token to the datastore.
          this.afAuth.user.subscribe(user => {
            this.db
              .collection("fcmTokens")
              .doc(token)
              .set({ uid: user.uid });
          });
        } else {
          // Need to request permissions to show notifications.
          return this.requestPermission();
        }
      },
      error => {
        console.error(error);
      }
    );
  }
  deleteMyToken() {
    this.afMessaging.getToken
      .pipe(mergeMap(token => this.afMessaging.deleteToken(token)))
      .subscribe(token => {
        console.log("Deleted!");
      });
  }

  listen() {
    this.afMessaging.messages.subscribe(message => {
      console.log(message);
    });
  }
}

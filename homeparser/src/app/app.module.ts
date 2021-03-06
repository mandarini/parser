import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { AngularFireModule } from "@angular/fire";
import { AngularFirestoreModule } from "@angular/fire/firestore";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { AngularFireMessagingModule } from "@angular/fire/messaging";

import { environment } from "../environments/environment";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { HouseListComponent } from './house-list/house-list.component';
import { HouseComponent } from './house-list/house/house.component';

@NgModule({
  declarations: [AppComponent, HouseListComponent, HouseComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireMessagingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}

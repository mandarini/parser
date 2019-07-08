import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class HousesService {
  constructor(private afs: AngularFirestore) {}

  getHouses(): Observable<any> {
    return this.afs
      .collection("houses", ref =>
        ref.orderBy("full_date", "desc").where("full_date", ">", "20181231")
      )
      .valueChanges();
  }
}

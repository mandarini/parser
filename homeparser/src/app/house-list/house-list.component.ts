import { Component, OnInit } from "@angular/core";
import { HousesService } from "../houses.service";
import { House } from "../house";
import { Observable } from "rxjs";

@Component({
  selector: "app-house-list",
  templateUrl: "./house-list.component.html",
  styleUrls: ["./house-list.component.scss"]
})
export class HouseListComponent implements OnInit {
  houses: Observable<House[]>;

  constructor(private housesService: HousesService) {}

  ngOnInit() {
    this.houses = this.housesService.getHouses();
  }
}

import { Component, OnInit, Input } from "@angular/core";
import { House } from "src/app/house";

@Component({
  selector: "app-house",
  templateUrl: "./house.component.html",
  styleUrls: ["./house.component.scss"]
})
export class HouseComponent implements OnInit {
  @Input() house: House;
  constructor() {}

  ngOnInit() {}
}

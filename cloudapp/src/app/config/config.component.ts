import { Router } from "@angular/router";
import { forkJoin } from "rxjs";
import { Constants } from "./../constants";
import { TypeMapService } from "./../type-map.service";
import {
  AlertService,
  CloudAppConfigService,
  RestErrorResponse,
} from "@exlibris/exl-cloudapp-angular-lib";
import { Component, OnInit } from "@angular/core";
export interface ConfigElement {
  pItem: string;
  eItem: string;
}

@Component({
  selector: "app-config",
  templateUrl: "./config.component.html",
  styleUrls: ["./config.component.scss"],
})
export class ConfigComponent implements OnInit {
  loading: boolean = false;
  config: Object;
  electronicTypes: any[];
  physicalTypes: any[];

  constructor(
    private configService: CloudAppConfigService,
    private alert: AlertService,
    private typeService: TypeMapService,
    private router: Router
  ) {}

  ngOnInit(): void {
    let startUpObserv = {
      pTypes: this.typeService.getPhysicalTypes,
      eTypes: this.typeService.getElectronicTypes,
      config: this.configService.get(),
    };
    this.loading = true;
    forkJoin(startUpObserv).subscribe({
      next: (res: { pTypes; eTypes; config }) => {
        this.physicalTypes = res.pTypes;
        this.electronicTypes = res.eTypes;
        if (Object.keys(res.config).length > 0) {
          this.config = res.config;
        } else {
          this.config = this.getDefSettings();
        }
      },
      error: (err) => {
        console.error(err);
        this.alert.error("There was an error loading the configuration , please try again");
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
    // this.typeService.getElectronicTypes.subscribe((res) => (this.electronicTypes = res));
    // this.typeService.getPhysicalTypes.subscribe((res) => (this.physicalTypes = res));
  }
  getDefSettings(): Object {
    return Constants.typeArray.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  }
  onSave(): void {
    this.loading = true;
    this.configService.set(this.config).subscribe({
      next: () => {},
      error: (err: RestErrorResponse) => {
        this.loading = false;
        this.alert.error(`Could not saved configuration, Error : ${err.message}}`);
        console.error(err);
      },
      complete: () => {
        this.alert.success("Successfully saved settings",{keepAfterRouteChange:true});
        this.loading = false;
        this.router.navigate([""]);
      },
    });
  }
  onRestoreDef(): void {
    this.config = this.getDefSettings();
  }
}

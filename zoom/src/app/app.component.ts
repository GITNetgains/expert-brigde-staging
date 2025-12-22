import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import * as CryptoJS from "crypto-js";
import { ActivatedRoute } from "@angular/router";
import { AppService } from "./app.service";
import { ZoomMtg } from "@zoom/meetingsdk";

ZoomMtg.preLoadWasm();
ZoomMtg.prepareWebSDK();

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  leaveUrl = "";
  public data: {
    currentUser: {
      name: string;
      type: string;
      email: string;
    };
    appointmentId: string;
    meetingInfo: {
      meetingNumber: string;
      signature: string;
      password: string;
    };
  } = null;
  public token: string = null;
  constructor(
    public httpClient: HttpClient,
    private route: ActivatedRoute,
    private appService: AppService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((query) => {
      if (query.token) {
        this.token = decodeURIComponent(query.token);
        if (this.token) {
          this.data = this.decrypt(this.token, "");
          if (this.data) {
            this.leaveUrl =
              this.data.currentUser.type === "tutor"
                ? `${this.appService.settings.mainUrl}/users/appointments/${this.data.appointmentId}`
                : `${this.appService.settings.mainUrl}/users/lessons/${this.data.appointmentId}`;
            this.startMeeting();
          } else {
            console.error("decrypt token failed");
          }
        }
      }
    });
  }

  startMeeting() {
    document.getElementById("zmmtg-root").style.display = "block";
    ZoomMtg.init({
      leaveUrl: this.leaveUrl,
      patchJsMedia: true,
      success: (success) => {
        console.log(success);
        ZoomMtg.join({
          signature: this.data.meetingInfo.signature,
          meetingNumber: this.data.meetingInfo.meetingNumber,
          userName: this.data.currentUser.name,
          sdkKey: this.appService.settings.zoomSDK,
          userEmail: this.data.currentUser.email,
          passWord: this.data.meetingInfo.password,
          tk: "",
          success: (success) => {
            console.log(success);
          },
          error: (error) => {
            console.log(error);
          },
        });
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  decrypt(encryptedString: string, key: string) {
    const bytes = CryptoJS.AES.decrypt(encryptedString, key);
    const jsonString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(jsonString);
  }
}

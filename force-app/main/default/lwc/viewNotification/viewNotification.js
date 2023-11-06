import { LightningElement, api, track, wire } from "lwc";
import {
  subscribe,
  unsubscribe,
  onError,
  setDebugFlag,
  isEmpEnabled
} from "lightning/empApi";
import publish from "@salesforce/apex/ViewNotificationController.publish";
import Id from "@salesforce/user/Id";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
// https://salesforceblue.com/using-lightning-empapi-module-in-lwc/
//import { ShowToastEvent } from 'lightning/platformShowToastEvent'
//import getUserData from "@salesforce/apex/ViewNotificationController.getUserData";
//import getUserDataById from "@salesforce/apex/ViewNotificationController.getUserDataById";

// Mapをリストにして表示する方法
// https://salesforce.stackexchange.com/questions/409900/how-do-you-display-a-js-map-in-lwc

export default class ViewNotification extends LightningElement {
  channelName = "/event/ViewNotification__e";
  isSubscribeDisabled = false;
  isUnsubscribeDisabled = !this.isSubscribeDisabled;
  subscription = {};
  message;
  @api recordId;
  map = new Map();
  data = [];


  // Tracks changes to channelName text field
  handleChannelName(event) {
    this.channelName = event.target.value;
  }

  // Initializes the component
  connectedCallback() {
    // Register error listener
    this.registerErrorListener();

    this.handleSubscribe();
  }

  disconnectedCallback() {
    this.handleUnsubscribe();
  }

  // Handles subscribe button click
  handleSubscribe() {
    // Callback invoked whenever a new event message is received
    const messageCallback = (response) => {
      console.log("New message received: ", JSON.stringify(response));
      if (response.data.payload.ViewUserId__c !== Id && response.data.payload.RecordId__c === this.recordId) {

        this.message =
          response.data.payload.ViewUserName__c +
          ":" +
          response.data.payload.ViewDateTime__c +
          ":" +
          response.data.payload.EventType__c;

        this.showToast(this.message);

        if (response.data.payload.EventType__c === "join") {
          if (this.data.find(el => el.ViewUserId__c === response.data.payload.ViewUserId__c) === undefined) {
            this.data.push(response.data.payload);
          }
        } else if (response.data.payload.EventType__c === "leave") {
          this.data = this.data.filter(el => el.ViewUserId__c !== response.data.payload.ViewUserId__c);
        }

        console.log(this.data);

      }
      // Response contains the payload of the new message received
    };

    // Invoke subscribe method of empApi. Pass reference to messageCallback
    subscribe(this.channelName, -1, messageCallback).then((response) => {
      // Response contains the subscription information on subscribe call
      console.log(
        "Subscription request sent to: ",
        JSON.stringify(response.channel)
      );
      this.subscription = response;
      this.toggleSubscribeButton(true);
    });

    this.buildEvent("join");
  }

  // Handles unsubscribe button click
  handleUnsubscribe() {
    this.toggleSubscribeButton(false);

    this.buildEvent("leave");

    // Invoke unsubscribe method of empApi
    unsubscribe(this.subscription, (response) => {
      console.log("unsubscribe() response: ", JSON.stringify(response));
      // Response is true for successful unsubscribe
    });
  }

  toggleSubscribeButton(enableSubscribe) {
    this.isSubscribeDisabled = enableSubscribe;
    this.isUnsubscribeDisabled = !enableSubscribe;
  }

  registerErrorListener() {
    // Invoke onError empApi method
    onError((error) => {
      console.log("Received error from server: ", JSON.stringify(error));
      // Error contains the server-side error
    });
  }

  async buildEvent(eventType) {
    const data = {
      recordId: this.recordId,
      eventType: eventType
    };
    await publish(data).catch(console.log("error!!"));
  }

  showToast(message) {
    const event = new ShowToastEvent({
      title: "別のユーザが該当レコードを表示中！",
      message: message,
      variant: "warning",
      //info/success/warning/error
      mode: "sticky"
      //sticky クローズボタンを押すまで表示
      //pester 3秒間表示
      //dismissable sticky+pester
    });
    this.dispatchEvent(event);
  }
}
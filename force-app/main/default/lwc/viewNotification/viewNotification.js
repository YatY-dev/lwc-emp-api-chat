import { LightningElement, api, wire } from "lwc";
import { subscribe, unsubscribe, onError } from "lightning/empApi";
import publish from "@salesforce/apex/ViewNotificationController.publish";
import getNowJST from "@salesforce/apex/ViewNotificationController.getNowJST";
import Id from "@salesforce/user/Id";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class ViewNotification extends LightningElement {
  channelName = "/event/ViewNotification__e";
  isSubscribeDisabled = false;
  isUnsubscribeDisabled = !this.isSubscribeDisabled;
  subscription = {};
  message;
  map = new Map();
  data = [];
  uuid = crypto.randomUUID();
  event;
  count = 0;
  maxCount = 20;
  now;
  @api recordId;

  // @wire(getNowJST)
  // wiredRecord({ error, data }) {
  //   console.log('getNowJST');
  //   if (data) {
  //     this.now = data;
  //     this.error = undefined;
  //   } else if (error) {
  //     this.error = error.body.message;
  //     this.now = undefined;
  //   }
  // }

  // Tracks changes to channelName text field
  handleChannelName(event) {
    this.channelName = event.target.value;
  }

  // Initializes the component
  async connectedCallback() {
    await getNowJST()
      .then((data) => {
        this.now = data;
        console.log(this.now);

        // Register error listener
        this.registerErrorListener();
    
        this.handleSubscribe();
      })
      .catch((error) => {
        this.error = error;
      });
  }

  disconnectedCallback() {
    this.handleUnsubscribe();
  }

  // Handles subscribe button click
  handleSubscribe() {
    // Callback invoked whenever a new event message is received

    const messageCallback = (response) => {
      if (
        response.data.payload.ViewUserId__c !== Id &&
        response.data.payload.RecordId__c === this.recordId
      ) {
        this.message =
          response.data.payload.ViewUserName__c +
          "さんが" +
          response.data.payload.ViewDateTime__c +
          "に表示を開始";

        //this.showToast(this.message);

        if (response.data.payload.EventType__c === "join") {
          if (
            this.data.find(
              (el) => el.ViewUserId__c === response.data.payload.ViewUserId__c
            ) === undefined
          ) {
            this.data.push(response.data.payload);
          }
        } else if (response.data.payload.EventType__c === "leave") {
          this.data = this.data.filter(
            (el) => el.ViewUserId__c !== response.data.payload.ViewUserId__c
          );
        } else if (response.data.payload.EventType__c === "ping") {
          this.data = this.data.filter(
            (el) => el.ViewUserId__c !== response.data.payload.ViewUserId__c
          );
          this.data.push(response.data.payload);
        }

        this.data.sort((first, second) => {
          return first.ViewUserId__c > second.ViewUserId__c
        });

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

    this.event = setInterval(() => {
      this.count++;
      console.log(this.count);
      this.buildEvent("ping");
      if (this.count === this.maxCount) {
        clearInterval(this.event);
        this.event = undefined;
      }
    }, 30000);
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

    clearInterval(this.event);
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
    console.log("this.now");

    console.log(this.now);
    const data = {
      recordId: this.recordId,
      eventType: eventType,
      now: this.now,
      uuid: this.uuid
    };
    await publish(data).catch((error) => {
      console.error(error);
    });
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

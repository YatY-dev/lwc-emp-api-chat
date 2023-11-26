import { LightningElement, api, wire } from "lwc";
import { subscribe, unsubscribe, onError } from "lightning/empApi";
import publish from "@salesforce/apex/ViewNotificationController.publish";
import getNowJST from "@salesforce/apex/ViewNotificationController.getNowJST";
import getMetaData from "@salesforce/apex/ViewNotificationController.getMetaData";
import Id from "@salesforce/user/Id";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class ViewNotification extends LightningElement {
  channelName = "/event/ViewNotification__e";
  isSubscribeDisabled = false;
  isUnsubscribeDisabled = !this.isSubscribeDisabled;
  subscription = {};
  map = new Map();
  data = [];
  cloned = [];
  uuid = crypto.randomUUID();
  event;
  count = 0;
  maxCount = 20;
  interval = 10000;
  precision = 2000;
  now;
  @api recordId;

  // Tracks changes to channelName text field
  handleChannelName(event) {
    this.channelName = event.target.value;
  }

  // Initializes the component
  async connectedCallback() {

    await getMetaData()
    .then((data) => {
      this.interval = data.Interval__c;
      this.precision = data.Precision__c;

      console.log("interval:" + this.interval);
      console.log("precision:" + this.precision);
    })
    .catch((error) => {
      this.error = error;
    });

    await getNowJST()
      .then((data) => {
        this.now = data;
        console.log("getNowJST:" + this.now);
        console.log("formatted:" + this.formatDate(data));
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

    const messageCallback = async (response) => {
      if (
        response.data.payload.ViewUserId__c !== Id &&
        response.data.payload.RecordId__c === this.recordId
      ) {
        this.cloned = [...this.data];

        if (response.data.payload.EventType__c === "join") {
          if (
            this.cloned.find(
              (el) => el.ViewUserId__c === response.data.payload.ViewUserId__c
            ) === undefined
          ) {
            this.cloned.push(response.data.payload);
          }
        } else if (response.data.payload.EventType__c === "leave") {
          this.cloned = this.cloned.filter(
            (el) => el.ViewUserId__c !== response.data.payload.ViewUserId__c
          );
        } else if (response.data.payload.EventType__c === "ping") {
          this.cloned = this.cloned.filter(
            (el) => el.ViewUserId__c !== response.data.payload.ViewUserId__c
          );
          this.cloned.push(response.data.payload);
        }

        await this.cloned.sort((first, second) => {
          return first.ViewUserId__c > second.ViewUserId__c;
        });
        this.data = this.cloned;
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


    // eslint-disable-next-line @lwc/lwc/no-async-operation
    this.event = window.setInterval(() => {
      if (this.template.querySelector("div").offsetParent === null) {
        clearInterval(this.event);
        this.event = undefined;
        console.log("stopped the interval");
      } else {
        
        this.data = this.data.filter(
          (el) => {
            const s = new Date().toLocaleString('ja-JP', {
              timeZone: 'Asia/Tokyo',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });
            const d1 = this.formatDate(s);
            const d2 = this.formatDate(el.LastViewDateTime__c);
            const diff = d1.getTime() - d2.getTime();

            console.log("diff d:" + diff);

            return diff < (this.interval + this.precision);
          }
        );

        this.count++;
        console.log(this.count);
        this.buildEvent("ping");
        if (this.count === this.maxCount) {
          clearInterval(this.event);
          this.event = undefined;
        }
      }
    }, this.interval);
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

  formatDate(dateString){
    //2023-11-25 21:24:20
    const year = parseInt(dateString.substring(0, 4));  //20231
    const month = parseInt(dateString.substring(5, 7)); //11
    const day = parseInt(dateString.substring(8, 10));  //25
    const hour = parseInt(dateString.substring(11, 13)); //21
    const min = parseInt(dateString.substring(14, 16)); //24
    const ss = parseInt(dateString.substring(17));  //20
    //console.log(year + "/" + month + "/" + day + " " + hour + ":" + min + ":" + ss);
    return new Date(year, month - 1, day, hour, min, ss);
  }
}

import { LightningElement, api, track, wire } from "lwc";
import { subscribe, unsubscribe, onError, setDebugFlag, isEmpEnabled } from 'lightning/empApi';

// https://salesforceblue.com/using-lightning-empapi-module-in-lwc/

//import { ShowToastEvent } from 'lightning/platformShowToastEvent'
//import getUserData from "@salesforce/apex/ViewNotificationController.getUserData";
//import getUserDataById from "@salesforce/apex/ViewNotificationController.getUserDataById";

export default class ViewNotification extends LightningElement {

  channelName = '/event/ViewNotification__e';
  isSubscribeDisabled = false;
  isUnsubscribeDisabled = !this.isSubscribeDisabled;
  subscription = {};
  message;

  // Tracks changes to channelName text field
  handleChannelName(event) {
      this.channelName = event.target.value;
  }

  // Initializes the component
  connectedCallback() {
      // Register error listener
      this.registerErrorListener();
  }

  // Handles subscribe button click
  handleSubscribe() {
      // Callback invoked whenever a new event message is received
      const messageCallback = (response) => {
          console.log('New message received: ', JSON.stringify(response));
          this.message = response.data.payload.ViewUserId__c;
          // Response contains the payload of the new message received
      };

      // Invoke subscribe method of empApi. Pass reference to messageCallback
      subscribe(this.channelName, -1, messageCallback).then((response) => {
          // Response contains the subscription information on subscribe call
          console.log(
              'Subscription request sent to: ',
              JSON.stringify(response.channel)
          );
          this.subscription = response;
          this.toggleSubscribeButton(true);
      });
  }

  // Handles unsubscribe button click
  handleUnsubscribe() {
      this.toggleSubscribeButton(false);

      // Invoke unsubscribe method of empApi
      unsubscribe(this.subscription, (response) => {
          console.log('unsubscribe() response: ', JSON.stringify(response));
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
          console.log('Received error from server: ', JSON.stringify(error));
          // Error contains the server-side error
      });
  }
}
import { LightningElement, api, wire } from "lwc";
import { subscribe, unsubscribe, isEmpEnabled } from "lightning/empApi";
import getUserData from "@salesforce/apex/ViewNotificationController.getUserData";
import getUserDataById from "@salesforce/apex/ViewNotificationController.getUserDataById";

export default class ViewNotification extends LightningElement {
  @api objectApiName;
  @api recordId;
  channelName = "/event/ViewNotification__e";

  subscription = {};

  userId = "";
  userName = "";
  profileType = "";
  profileValue = "";
  profileImageUrl;

  @wire(getUserData)
  wiredUserData({ error, data }) {
    if (data) {
      this.userId = this.generateChatUserId(data.Id);
      this.userName = data.Name;
      this.profileType = "url";
      this.profileValue = data.SmallPhotoUrl;
      this.profileImageUrl = data.SmallPhotoUrl;
      this.error = null;
    } else if (error) {
      this.error = error;
    }
  }

  connectedCallback = async () => {
    const isEmpAvailable = await isEmpEnabled();
    if (!isEmpAvailable) {
      this.error = "unavailable";
    }

    getUserData()
      .then((data) => {
        this.userId = this.generateChatUserId(data.Id);
        this.userName = data.Name;
        this.profileType = "url";
        this.profileValue = data.SmallPhotoUrl;
        this.profileImageUrl = data.SmallPhotoUrl;
        this.error = null;
      })
      .catch((error) => {
        this.error = error;
      });
    
    const subscription = await subscribe(
      this.channelName,
      -1,
      (event) => this.handleNotificationEvent(event)
    );
    this.subscription = subscription;

  };

  // Callback invoked whenever a new event message is received
  async handleNotificationEvent(event) {
    console.dir(event);
    const objectName = event.data.payload.ObjectName__c;
    const receiveRecordId = event.data.payload.RecordId__c;
    const viewDateTime = new Date(event.data.payload.ViewDateTime__c);
    const viewUserId = event.data.payload.viewUserId__c;

    if (objectApiName == objectName && this.recordId == receiveRecordId) return;

    const user = await getUserDataById(viewUserId);
    this.dispatchEvent(
      new ShowToastEvent({
        variant: "info",
        title: message
      })
    );
  };

  generateChatUserId(userId) {
    return userId + Math.floor(Math.random() * 10000) + Date.now();
  }
}

import { LightningElement, api, wire } from "lwc";
import { subscribe, unsubscribe, isEmpEnabled } from "lightning/empApi";
import getUserData from "@salesforce/apex/ViewNotificationController.getUserData";

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

    getUserData().then(data => {
      this.userId = this.generateChatUserId(data.Id);
      this.userName = data.Name;
      this.profileType = "url";
      this.profileValue = data.SmallPhotoUrl;
      this.profileImageUrl = data.SmallPhotoUrl;
      this.error = null;
    })
    .catch(error => {
      this.error = error;
    });

  };

  generateChatUserId(userId) {
    return userId + Math.floor(Math.random() * 10000) + Date.now();
  }
}

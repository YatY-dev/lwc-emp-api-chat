/**
 * @description       :
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             :
 * @last modified on  : 11-02-2023
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
 **/
public with sharing class ViewNotificationController {

  @AuraEnabled(cacheable=true)
  public static User getUserData() {
    System.debug('Call getUserData');
    return [
      SELECT Id, Name, SmallPhotoUrl
      FROM User
      WHERE Id = :UserInfo.getUserId()
    ];
  }

  @AuraEnabled(cacheable=true)
  public static User getUserDataById(string UserId) {
    return [SELECT Id, Name, SmallPhotoUrl FROM User WHERE Id = :UserId];
  }

  @AuraEnabled
  public static void publish(String recordId) {
    Id id = recordId;
    DescribeSObjectResult describe = id.getSobjectType().getDescribe();

    List<ViewNotification__e> notifications = new List<ViewNotification__e>();
    notifications.add(
      new ViewNotification__e(
        ObjectName__c = describe.getName(),
        RecordId__c = recordId,
        ViewDateTime__c = DateTime.now(),
        viewUserId__c = UserInfo.getUserId()
      )
    );

    List<Database.SaveResult> results = EventBus.publish(notifications);
    for (Database.SaveResult sr : results) {
      if (sr.isSuccess()) {
        // System.debug('Successfully published event.');
      } else {
        for (Database.Error err : sr.getErrors()) {
          System.debug(
            'Error returned: ' +
            err.getStatusCode() +
            ' - ' +
            err.getMessage()
          );
        }
      }
    }
  }
}
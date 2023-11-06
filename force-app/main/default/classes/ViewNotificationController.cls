/**
 * @description       :
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             :
 * @last modified on  : 11-06-2023
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
  public static void publish(String recordId, String eventType, String uuid) {
    Id id = recordId;
    DescribeSObjectResult describe = id.getSobjectType().getDescribe();

    User u = getUserData();

    List<ViewNotification__e> notifications = new List<ViewNotification__e>();
    notifications.add(
      new ViewNotification__e(
        ObjectName__c = describe.getName(),
        RecordId__c = recordId,
        ViewDateTime__c = DateTime.now().format('yyyy/MM/dd HH:mm', 'JST'),
        ViewUserId__c = UserInfo.getUserId(),
        ViewUserName__c = UserInfo.getName(),
        EventType__c = eventType,
        SmallPhotoUrl__c = u.SmallPhotoUrl,
        Uuid__c = uuid
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
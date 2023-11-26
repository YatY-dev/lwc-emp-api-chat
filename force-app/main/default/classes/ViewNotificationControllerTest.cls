/**
 * @description       : 
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             : 
 * @last modified on  : 11-26-2023
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
**/
@IsTest
public with sharing class ViewNotificationControllerTest {

    @TestSetup
    static void makeData(){
        Account a1 = new Account(Name='Test');
        insert a1;

        Profile p = [Select Id from Profile Where Name = 'システム管理者'];

        User u1 = new User(
            FirstName='Yusuke', 
            LastName = 'testYokoyamauser',
            Alias = 'newUser',
            Email = 'test-yusuke-yokoyama@techgrowth.co.jp',
            UserName = 'test-yusuke-yokoyama@techgrowth.co.jp',
            ProfileId = p.Id,
            EmailEncodingKey = 'ISO-2022-JP',
            LanguageLocaleKey = 'ja',
            LocaleSidKey = 'ja_JP',
            TimeZoneSidKey = 'Asia/Tokyo'
        );
        insert u1;

        ViewNotificationConfig__mdt meta = new ViewNotificationConfig__mdt(
            DeveloperName = 'Default',
            MasterLabel = 'デフォルト',
            Interval__c = 10000,
            Precision__c = 2000,
            Language = 'ja'
        );
        //insert meta;
    }

    @IsTest
    private static void getUserDataTest() {
        User u = ViewNotificationController.getUserData();
        Assert.isNotNull(u);
    }

    
    @IsTest
    private static void getNowJSTTest() {
        string now = ViewNotificationController.getNowJST();
        Assert.isNotNull(now);
    }

    @IsTest
    private static void getUserDataTestById() {
        User testUser = [Select Id From User Limit 1];
        User u = ViewNotificationController.getUserDataById(testUser.Id);
        Assert.isNotNull(u);
    }

    @IsTest
    private static void publishTest() {
        Account a1 = [Select Id, Name From Account Limit1];
        ViewNotificationController.publish(a1.Id, 'join', '', '550e8400-e29b-41d4-a716-446655440000');
    }

    
    @IsTest
    private static void getMetaDataTest() {
        ViewNotificationConfig__mdt meta = ViewNotificationController.getMetaData();
        Assert.isNotNull(meta);
        Assert.areEqual(10000, meta.Interval__c);
    }
}
/**
 * @description       : 
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             : 
 * @last modified on  : 11-06-2023
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
    }

    @IsTest
    private static void getUserDataTest() {
        User u = ViewNotificationController.getUserData();
        Assert.isNotNull(u);
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
        ViewNotificationController.publish(a1.Id, 'join', '550e8400-e29b-41d4-a716-446655440000');
    }
}
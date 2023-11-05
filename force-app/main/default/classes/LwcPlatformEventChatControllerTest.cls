/**
 * @description       : 
 * @author            : ChangeMeIn@UserSettingsUnder.SFDoc
 * @group             : 
 * @last modified on  : 11-01-2023
 * @last modified by  : ChangeMeIn@UserSettingsUnder.SFDoc
**/
@IsTest
private class LwcPlatformEventChatControllerTest {
    @IsTest
    private static void getUserDataTest() {
        User u = LwcPlatformEventChatController.getUserData();
    }

    @IsTest
    private static void publishTest() {
        LwcPlatformEventChatController.publish(
            'AAA', 'BBB', 'comment', 'DDD', 'color', 'blue'
        );
    }
}
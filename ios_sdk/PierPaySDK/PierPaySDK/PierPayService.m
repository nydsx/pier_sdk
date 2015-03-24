//
//  PierPayService.m
//  PierPaySDK
//
//  Created by zyma on 3/4/15.
//  Copyright (c) 2015 Pier.Inc. All rights reserved.
//

#import "PierPayService.h"
#import "PierService.h"
#import "PierAlertView.h"
#import "PierDataSource.h"
#import "NSString+PierCheck.h"
#import "PierDataSource.h"

@interface PierPayService () <PierSMSInputAlertDelegate>

@property (nonatomic, strong) PierGetAuthTokenV2Request *authTokenRequestModel;

@property (nonatomic, strong) PierSMSAlertView *smsAlertView;

@property (nonatomic, assign) ePierPayWith payWithType;

@end

@implementation PierPayService

- (instancetype)init
{
    self = [super init];
    if (self) {
        _authTokenRequestModel = [[PierGetAuthTokenV2Request alloc] init];
    }
    return self;
}

- (void)serviceGetPaySMS:(BOOL)rememberuser payWith:(ePierPayWith)payWith{
    self.payWithType = payWith;
    [PierService serverSend:ePIER_API_TRANSACTION_SMS resuest:self.smsRequestModel successBlock:^(id responseModel) {
        if (rememberuser) {
            NSDictionary *dic = [NSDictionary dictionaryWithObjectsAndKeys:
                                 self.smsRequestModel.phone, pier_userdefaults_phone,
                                 [__pierDataSource.merchantParam objectForKey:DATASOURCES_COUNTRY_CODE], pier_userdefaults_countrycode,
                                 self.smsRequestModel.password, pier_userdefaults_password,nil];
            [__pierDataSource saveUserInfo:dic];
        }else{
            [__pierDataSource clearUserInfo];
        }
        
        PierTransactionSMSResponse *response = (PierTransactionSMSResponse *)responseModel;
        
        NSDictionary *param = [NSDictionary dictionaryWithObjectsAndKeys:
                               @"",@"title_image_name",
                               @"Transaction Verification Code",@"title",
                               @"Pay",@"approve_text",
                               @"Cancel",@"cancle_text",
                               self.smsRequestModel.phone,@"phone",
                               response.expiration,@"expiration_time",
                               [__pierDataSource.merchantParam objectForKey:DATASOURCES_AMOUNT],@"amount",
                               @"6",@"code_length",nil];
        _smsAlertView = [[PierSMSAlertView alloc] initWith:self param:param type:ePierAlertViewType_instance];
        _smsAlertView.delegate = self;
        [_smsAlertView showErrorMessage:@""];
        [_smsAlertView show];
    } faliedBlock:^(NSError *error) {
        [_smsAlertView showErrorMessage:[error domain]];
    } attribute:[NSDictionary dictionaryWithObjectsAndKeys:
                 @"1", @"show_alert",
                 @"0", @"show_loading",
                 @"Pier Payment", @"show_message", nil]];
}

//ReSend TextMessage
- (void)rSendServicePaySMS{
    [PierService serverSend:ePIER_API_TRANSACTION_SMS resuest:self.smsRequestModel successBlock:^(id responseModel) {
        PierTransactionSMSResponse *response = (PierTransactionSMSResponse *)responseModel;
        
        NSDictionary *param = [NSDictionary dictionaryWithObjectsAndKeys:
                               @"",@"title_image_name",
                               @"Transaction Verification Code",@"title",
                               @"Pay",@"approve_text",
                               @"Cancel",@"cancle_text",
                               self.smsRequestModel.phone,@"phone",
                               response.expiration,@"expiration_time",
                               [__pierDataSource.merchantParam objectForKey:DATASOURCES_AMOUNT],@"amount",
                               @"6",@"code_length",nil];
        if (!_smsAlertView) {
            _smsAlertView = [[PierSMSAlertView alloc] initWith:self param:param type:ePierAlertViewType_instance];
            _smsAlertView.delegate = self;
            [_smsAlertView show];
        }else{
            [_smsAlertView refreshTimer:param];
        }
        [_smsAlertView showErrorMessage:@""];
    } faliedBlock:^(NSError *error) {
        [_smsAlertView showErrorMessage:[error domain]];
    } attribute:[NSDictionary dictionaryWithObjectsAndKeys:
                 @"1", @"show_alert",
                 @"0", @"show_loading",
                 @"Pier Payment", @"show_message", nil]];
}

- (void)serviceGetAuthToken:(NSString *)userinput{
    self.authTokenRequestModel.phone = [__pierDataSource.merchantParam objectForKey:DATASOURCES_PHONE];
    self.authTokenRequestModel.pass_code = userinput;
    self.authTokenRequestModel.pass_type = @"1";
    self.authTokenRequestModel.merchant_id = [__pierDataSource.merchantParam objectForKey:@"merchant_id"];
    self.authTokenRequestModel.amount = [__pierDataSource.merchantParam objectForKey:@"amount"];
    self.authTokenRequestModel.currency_code = [__pierDataSource.merchantParam objectForKey:@"currency"];
    
    [PierService serverSend:ePIER_API_GET_AUTH_TOKEN_V2 resuest:self.authTokenRequestModel successBlock:^(id responseModel) {
        [_smsAlertView dismiss];
        PierGetAuthTokenV2Response *response = (PierGetAuthTokenV2Response *)responseModel;
        [self serviceMerchantService:response];
        [_smsAlertView showErrorMessage:@""];
    } faliedBlock:^(NSError *error) {
        [_smsAlertView showErrorMessage:[error domain]];
    } attribute:[NSDictionary dictionaryWithObjectsAndKeys:
                 @"1", @"show_alert",
                 @"0", @"show_loading",
                 @"Pier Payment", @"show_message", nil]];
}

- (void)serviceMerchantService:(PierGetAuthTokenV2Response *)resultModel{
    PierMerchantRequest *requestModel = [[PierMerchantRequest alloc] init];
    requestModel.auth_token = resultModel.auth_token;
    [PierService serverSend:ePIER_API_GET_MERCHANT resuest:requestModel successBlock:^(id responseModel) {
        NSString *amount = [NSString getNumberFormatterDecimalStyle:[__pierDataSource.merchantParam objectForKey:@"amount"] currency:[__pierDataSource.merchantParam objectForKey:@"currency"]];
        NSDictionary *result = [NSDictionary dictionaryWithObjectsAndKeys:
                                @"0",@"status",
                                @"success",@"message",
                                amount ,@"spending", nil];
        [self pierPayComplete:result];
        [_smsAlertView showErrorMessage:@""];
    } faliedBlock:^(NSError *error) {
        [_smsAlertView showErrorMessage:[error domain]];
    } attribute:[NSDictionary dictionaryWithObjectsAndKeys://支付出错，需要从新获取auto token，这里直接走失败回调。
                 @"0", @"show_alert",
                 @"0", @"show_loading",
                 @"Pier Payment", @"show_message", nil]];
}

/**
 * pay by pier complete!
 */
- (void)pierPayComplete:(NSDictionary *)result{
    if (self.payWithType == ePierPayWith_Merchant) {
        if (self.delegate && [self.delegate respondsToSelector:@selector(pierPayServiceComplete:)]) {
            [self.delegate pierPayServiceComplete:result];
        }
    }else{
        if (__pierDataSource.pierDelegate && [__pierDataSource.pierDelegate respondsToSelector:@selector(payWithPierComplete:)]) {
            NSString *amount = [NSString getNumberFormatterDecimalStyle:[__pierDataSource.merchantParam objectForKey:@"amount"] currency:[__pierDataSource.merchantParam objectForKey:@"currency"]];
            NSMutableDictionary *mutDic = [NSMutableDictionary dictionaryWithDictionary:result];
            [mutDic setValue:amount forKey:@"Amount"];
            [__pierDataSource.pierDelegate payWithPierComplete:mutDic];
        }
    }
}

#pragma mark - ---------------------------- PierSMSInputAlertView ----------------------------
- (void)userApprove:(NSString *)userInput{
    [self serviceGetAuthToken:userInput];
}

- (void)userCancel{
    NSDictionary *result = [NSDictionary dictionaryWithObjectsAndKeys:
                            @"1",@"status",
                            @"Payment Cancel",@"message", nil];
    [self pierPayComplete:result];
}

- (void)resendTextMessage{
    //resend payment text message
    [self rSendServicePaySMS];
}

@end

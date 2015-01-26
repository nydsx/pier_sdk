//
//  PIRPayModel.m
//  PierPaySDK
//
//  Created by zyma on 1/26/15.
//  Copyright (c) 2015 Pier.Inc. All rights reserved.
//

#import "PIRPayModel.h"

@implementation PIRPayModel

@end

#pragma mark - -------------------PIER_API_TRANSACTION_SMS-------------------
#pragma mark - Request

@implementation TransactionSMSRequest

@end

#pragma mark - Response

@interface TransactionSMSResponse ()
@property(nonatomic, copy, readwrite) NSString *expiration;
@property(nonatomic, copy, readwrite) NSString *sms_no;
@end

@implementation TransactionSMSResponse

@end


#pragma mark - -------------------PIER_API_GET_AUTH_TOKEN_V2-------------------
#pragma mark - Request
@implementation getAuthTokenV2Request


@end

#pragma mark - Response

@interface getAuthTokenV2Response ()
@property(nonatomic, copy, readwrite) NSString *auth_token;
@end

@implementation getAuthTokenV2Response

@end
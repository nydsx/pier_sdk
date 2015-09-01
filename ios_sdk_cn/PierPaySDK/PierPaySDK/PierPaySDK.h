//
//  PierPaySDK.h
//  PierPaySDK
//
//  Created by zyma on 8/31/15.
//  Copyright (c) 2015 pier. All rights reserved.
//

#import <Foundation/Foundation.h>

typedef void (^payWithPierComplete)(NSDictionary *result, NSError *error);

@interface PierPaySDK : NSObject

/**
 * Pier支付接口
 * 
 * @param charge        订单信息
 * @param delegate      商户当前页面
 * @param fromScheme    调用品而支付的商户app注册在info.plist中的scheme
 * @param completion
 */
- (void)createPayment:(NSDictionary *)charge
             delegate:(id)delegate
           fromScheme:(NSString *)fromScheme
           completion:(payWithPierComplete)completion;

@end
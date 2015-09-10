//
//  PierURLDispatcher.m
//  PierPaySDK
//
//  Created by zyma on 9/9/15.
//  Copyright (c) 2015 pier. All rights reserved.
//

#import "PierURLDispatcher.h"
#import "PierH5Utils.h"
#import "PierJSONKit.h"

static PierURLDispatcher * __instance;

@implementation PierWebActionModel


@end

@implementation PierURLDispatcher

//+ (PierURLDispatcher *)shareInstance{
//    if (__instance == nil) {
//        @synchronized(self){
//            if (__instance == nil) {
//                __instance = [[PierURLDispatcher alloc] init];
//            }
//        }
//    }
//    return __instance;
//}

- (BOOL)dispatchURL:(NSURL *)url viewController:(UIViewController *)viewController{
    /**
     * pierpay://pier?platform=ios&action=10001&param1=""&param2=""&...
     */
    NSString *scheme = [url scheme];
    if ([scheme isEqualToString:@"pierpay"]) {
        NSString *query = [[url query] stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
        NSDictionary *query_dic = [PierH5Utils parseURLQueryString:query];
        ePierAction action = [[query_dic objectForKey:@"action"] integerValue];
        NSString *result = [query_dic objectForKey:@"result"];
        NSDictionary *result_dic = [result objectFromJSONString];
        switch (action) {
            case ePierAction_Login:
                
                break;
            case ePierAction_Pay:
                
                break;
            case ePierAction_Return:{
                PierWebActionModel *model = [[PierWebActionModel alloc] init];
                model.action_type = ePierAction_Return;
                model.result = result_dic;
                if (self.delegate && [self.delegate respondsToSelector:@selector(dispatcheFinish:)]) {
                    [self.delegate dispatcheFinish:model];
                }
                [viewController popoverPresentationController];
                break;
            }
            default:
                break;
        }
        return NO;
    }else{
        return YES;
    }
}

@end

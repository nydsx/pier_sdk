//
//  MainViewController.h
//  PierPayDemo
//
//  Created by JHR on 15/3/5.
//  Copyright (c) 2015年 Pier.Inc. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface ShopListmodel : NSObject

@property (nonatomic, strong) NSString *amount;         //19.99
@property (nonatomic, strong) NSString *image;          //image_url
@property (nonatomic, strong) NSString *currency;       //currency of amount

@end

@interface MerchantModel : NSObject

@property (nonatomic, strong) NSString *phone;                 //phone
@property (nonatomic, strong) NSString *country_code;          //countryCode
@property (nonatomic, strong) NSString *merchant_id;           //your id in pier
@property (nonatomic, strong) NSString *product_small_url;     //merchant_pic_url
@property (nonatomic, strong) NSString *business_name;         //merchant_name
@property (nonatomic, strong) NSArray  *shopListModelArray;

@end

@interface ShopListViewController : UIViewController

@end

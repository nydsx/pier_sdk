//
//  PushViewController.m
//  PierPayDemo
//
//  Created by zyma on 8/31/15.
//  Copyright (c) 2015 pier. All rights reserved.
//

#import "PushViewController.h"
#import "PierPaySDK.h"
#import "RSADigitalSignature.h"
#import "OrderUtil.h"

@interface PushViewController ()

@property (nonatomic, strong) PierPaySDK *pierPay;

@property (nonatomic, weak) IBOutlet UITableView *tableView;
@property (nonatomic, strong) NSArray *data;

//
@property (nonatomic, weak) IBOutlet UILabel *productLabel;
@property (nonatomic, weak) IBOutlet UILabel *detailLabel;
@property (nonatomic, weak) IBOutlet UILabel *countLabel;
@property (nonatomic, weak) IBOutlet UILabel *priceLabel;

@property (nonatomic, weak) IBOutlet UIButton *payButton;
@property (nonatomic, weak) IBOutlet UIImageView *logoImage;

@end

@implementation PushViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
    self.tableView.rowHeight = UITableViewAutomaticDimension;
    self.tableView.estimatedRowHeight = 90;
    [self.tableView reloadData];
    
    _data = @[@{@"title":@"PayByPier", @"detail":@"push"}, @{@"title":@"PayByPier", @"detail":@"model"}];
}



- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (IBAction)payByPier:(id)sender{
    NSDictionary *param = @{
                             @"merchant_id":@"MC0000001409",
                             @"api_id":@"1819957c-1a3f-11e5-ba25-3a22fd90d682",
                             @"api_secret_key":@"mk-prod-18199475-1a3f-11e5-ba25-3a22fd90d682",
                             @"amount":@"11.01",
                             @"charset":@"UTF-8",
                             @"order_id":@"fsdirwl24932130fs",
                             @"return_url":@"/checkout/orderList",
                             @"order_detail":@"",
                             @"sign_type":@"RSA"
                             };
    
    NSString *sign = [OrderUtil getSgin:param];
    
    NSDictionary *charge = @{
                             @"merchant_id":@"MC0000001409",
                             @"api_id":@"1819957c-1a3f-11e5-ba25-3a22fd90d682",
                             @"api_secret_key":@"mk-prod-18199475-1a3f-11e5-ba25-3a22fd90d682",
                             @"amount":@"11.01",
                             @"charset":@"UTF-8",
                             @"order_id":@"fsdirwl24932130fs",
                             @"return_url":@"/checkout/orderList",
                             @"order_detail":@"",
                             @"sign_type":@"RSA",
                             @"sign":sign
                             };
    
    _pierPay = [[PierPaySDK alloc] init];
    
    [_pierPay createPayment:charge delegate:self fromScheme:@"" completion:^(NSDictionary *result, NSError *error) {
        
    }];
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
    return _data.count;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
    NSInteger row = indexPath.row;
    static NSString *indetifier = @"ProductCell1";
    if (row == 0) {
        indetifier = @"ProductCell1";
    }else{
        indetifier = @"ProductCell2";
    }
    
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:indetifier];

    
    return cell;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath{
    [tableView deselectRowAtIndexPath:indexPath animated:YES];
}

/*
#pragma mark - Navigation

// In a storyboard-based application, you will often want to do a little preparation before navigation
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    // Get the new view controller using [segue destinationViewController].
    // Pass the selected object to the new view controller.
}
*/

@end

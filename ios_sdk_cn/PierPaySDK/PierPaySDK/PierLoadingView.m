//
//  PierLoadingView.m
//  PierPaySDK
//
//  Created by zyma on 3/8/15.
//  Copyright (c) 2015 Pier.Inc. All rights reserved.
//

#import "PierLoadingView.h"
#import "PierTools.h"
#import "PierColor.h"
#import "PierFont.h"
#import <QuartzCore/QuartzCore.h>

static PierLoadingView * __instances = nil;
static UIView * __loadingBgView;

@interface PierLoadingView ()
@property (nonatomic, strong)   NSMutableArray *loadingViewQueue;
@property (nonatomic, copy)     NSString *token;
@property (nonatomic, strong)   NSMutableArray *activityViewArray;

/** */
@property (nonatomic, strong) UIActivityIndicatorView *largeLargeView;
@property (nonatomic, strong) UILabel *contextLabel;

-(void)startActivity;
-(void)stopActivity;
@end

@implementation PierLoadingView

+ (void)showLoadingView:(NSString *)context{
    if (__instances == nil) {
        @synchronized(self){
            if (__instances == nil) {
                __instances = [[PierLoadingView alloc] initWithFrame:CGRectMake(0, 0, 90, 90)];
                [__instances initView];
            }
        }
    }
    
    if (__instances.loadingViewQueue.count>0) {
        [PierLoadingView hindLoadingView];
    }
    
    if (context != nil && context.length > 0) {
//        [__instances.contextLabel setCenter:CGPointMake(DEVICE_WIDTH/2, DEVICE_HEIGHT/2+50)];
        [__instances.contextLabel setText:context];
    }
    
    UIWindow *window = [[[UIApplication sharedApplication] delegate] window];
    [window addSubview:__loadingBgView];
    [window addSubview:__instances];
    [window addSubview:__instances.largeLargeView];
    [window addSubview:__instances.contextLabel];
    [__instances.loadingViewQueue addObject:@"TOKEN"];
    [__instances startActivity];
}

+ (void)hindLoadingView{
    [__instances.loadingViewQueue removeAllObjects];
    [__instances stopActivity];
    [__loadingBgView removeFromSuperview];
    [__instances removeFromSuperview];
    [__instances.largeLargeView removeFromSuperview];
    [__instances.contextLabel removeFromSuperview];
}

- (instancetype)initWithFrame:(CGRect)frame {
    self = [super initWithFrame:frame];
    if (self) {
        // Initialization code
        [self setView];
        _activityViewArray = [[NSMutableArray alloc] initWithCapacity:0];
    }
    return self;
}

- (void)initView{
    [self setAlpha:0.8];
    [self setBackgroundColor:[UIColor blackColor]];
    
    self.largeLargeView = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
    [self.largeLargeView hidesWhenStopped];
    [self.largeLargeView setCenter:CGPointMake(DEVICE_WIDTH/2, DEVICE_HEIGHT/2-20)];
    [self setCenter:self.largeLargeView.center];
    [self.largeLargeView setCenter:CGPointMake(DEVICE_WIDTH/2, DEVICE_HEIGHT/2-30)];
    [self.largeLargeView setColor:[UIColor whiteColor]];
    
    self.contextLabel = [[UILabel alloc] initWithFrame:CGRectMake(self.frame.origin.x,
                                                                         self.frame.origin.y+(self.frame.size.height-30),
                                                                         self.frame.size.width, 20)];
    [self.contextLabel setAdjustsFontSizeToFitWidth:YES];
    [self.contextLabel setFont:[PierFont customBoldFontWithSize:12]];
    [self.contextLabel setTextAlignment:NSTextAlignmentCenter];
    [self.contextLabel setBackgroundColor:[UIColor clearColor]];
    [self.contextLabel setTextColor:[UIColor whiteColor]];
    
    self.loadingViewQueue = [[NSMutableArray alloc] initWithCapacity:1];
    
    __loadingBgView = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 0, 0)];
    [__loadingBgView setBackgroundColor:[UIColor clearColor]];
    
    //                [__loadingBgView setAlpha:0.3];
}

-(void)setView
{
    self.frame = CGRectMake(self.frame.origin.x, self.frame.origin.y, self.frame.size.width, self.frame.size.width);
    self.layer.cornerRadius = 5;
    
    [self addTarget:self action:@selector(onTouchUpInside) forControlEvents:UIControlEventTouchUpInside];
    [self addTarget:self action:@selector(onTouchDown) forControlEvents:UIControlEventTouchDown];
}

-(void)onTouchUpInside
{
    if(self.activityViewArray.count < 1) {
        [self startActivity];
    }
    
    self.userInteractionEnabled = false;
    self.titleLabel.alpha = 1.0;
}

-(void)onTouchDown
{
    self.titleLabel.alpha = 0.25;
}

-(void)startActivity
{
    [__instances.largeLargeView startAnimating];
}

-(void)stopActivity
{
    [__instances.largeLargeView stopAnimating];
}

-(CGFloat)degreesToRadians:(CGFloat)degrees
{
    CGFloat result = ((degrees) / 180.0 * M_PI);
    return result;
}

#pragma mark - -------------- tools --------------

+ (long)getTimestamp{
    NSDate* date = [NSDate dateWithTimeIntervalSinceNow:0];
    NSTimeInterval timestamp=[date timeIntervalSince1970];
    long timestamp_i = ceil(timestamp);
    return timestamp_i;
}

/*
// Only override drawRect: if you perform custom drawing.
// An empty implementation adversely affects performance during animation.
- (void)drawRect:(CGRect)rect {
    // Drawing code
}
*/

@end

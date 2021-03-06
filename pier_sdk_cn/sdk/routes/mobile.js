var express = require('express');
var router = express.Router();

var request = require('request');
var apiUrl = require( '../config/apiUrl' );
var pierUtil = require( '../pierutil/util' );
var pierLog = require( '../pierlog' );
var https = require('https');
var crypto = require('crypto');
var fs = require('fs');
var updateSessionCount = 0;

router.get('/user/forgetPassword', function(req, res, next) {
  res.render('mobile/resetPsd/forget-psd',{
    title:'忘记密码',
    location: 'forgetPassword'
  });
});
router.get('/user/resetPassword/:token', function(req, res, next) {
  console.log( 'reset password', req.params.token);
  res.render('mobile/resetPsd/reset-psd',{
    token:req.params.token,
    title:'忘记密码',
    location: 'forgetPassword'
  });
});
router.get('/user/resetSuccess', function(req, res, next) {
  res.render('mobile/resetPsd/reset-success',{title:'重置密码成功',location: 'forgetPassword'});
});

/**refresh session token **/
router.post( '/pierSDK', function( req, res, next ){
  var _body = req.body;
  console.log('get new user information in sdk get body ', _body );
  var _userId = _body.user_id || '' ;
  var _sessionToken = _body.session_token || '';
  var _userName = _body.user_name || '';
  var _phone = _body.phone || '';
  var _url = _body.url;
  var _merchantId = _body.merchant_id || '';
  var _orderId = _body.order_id || '';
  
  switch( _url ){
    case '200002' : _url = '/mobile/checkout/confirm?merchant='+_merchantId+'&order='+_orderId+'&action=10004'; break;
    default: _url = '/';break;
  }
  req.session[_merchantId+_orderId].user_auth = { user_id: _userId , session_token: _sessionToken, name: _userName, phone: _phone };
  console.error( 'get new user information in sdk get session[_merchantId+_orderId]', req.session[_merchantId+_orderId] );
  res.redirect( _url );
} )



/**
 * user checkout login for pier-shop
 */
router.post('/checkout/loginShop', function(req, res, next) {
  var urlPath = '/saveOrderInfo';
  var _merchantId = req.body.merchant_id;
  var _sign = decodeURIComponent( req.body.sign );
  var _signType = req.body.sign_type;
  var _charset = req.body.charset;
  var _platform = req.body.platform;
  
  var message = {
    merchant_id: _merchantId,
    return_url: req.body.return_url,
    api_id: req.body.api_id,
    cart_id: req.body.cart_id
  };
  console.error('user from piershop user auth', message );
  request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
    console.log( 'user save new order for pier shop', body );
    if( body.code == 200 ){
      var _order = body.result.order_id;
      var urlPath = '/orderInfo';
      var message = {
        order_id: _order,
        merchant_id: _merchantId
      };
      request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body2){
        if( body2.code == 200 ){
          req.session[_merchantId+_order] = body2.result;
          if( typeof body2.result.order_detail == 'object' ){
            req.session[_merchantId+_order].order_detail = body2.result.order_detail;
          }else{
            req.session[_merchantId+_order].order_detail = JSON.parse(body2.result.order_detail);
          }
          //decode order product image
          for( var i=0; i<req.session[_merchantId+_order].order_detail.length; i++ ){
            req.session[_merchantId+_order].order_detail[i].logo = decodeURIComponent( req.session[_merchantId+_order].order_detail[0].logo );
          }
          req.session[_merchantId+_order].sign = _sign;
          req.session[_merchantId+_order].sign_type = _signType;
          req.session[_merchantId+_order].charset = _charset;
          req.session[_merchantId+_order].platform = _platform;
          //判断user的信息
          var _userAuth = req.body.userAuth;
          if( _userAuth != '' && _userAuth != undefined && _userAuth != 'undefined' ){
            _userAuth = JSON.parse( req.body.userAuth );
            //在订单信息中存储user的信息
            req.session[_merchantId+_order].user_auth = { user_id: _userAuth.user_id , session_token: _userAuth.session_token, name: _userAuth.user_name, phone: _userAuth.phone };
            res.redirect( '/mobile/checkout/confirm?merchant='+_merchantId+'&order='+_order+'&action=10004');
            return;
          }else{
            res.redirect( pierUtil.CONSTANT.app_session_expire+JSON.stringify( { code: "1001", msg: "failed", result:{ url: '200002', merchant_id: _merchantId, order_id: _order } } ) );
          }
        }else{
          res.redirect( '/mobile/checkout/unknownError?action=10014');
        }
      })
    }else{
      res.render( 'mobile/checkout/unknownError',{ error: body.message, title: '订单错误', location: 'error'} );
    }
  })
});

//for page test
router.get('/checkout/unknownError',function(req, res, next){
  var _message = { 
    error: "未知错误，当前操作未成功，请稍后重试。", 
    title: '未知错误', 
    location: 'error',
    pageInfo:JSON.stringify({ page_id: '200006' })
  };
  res.render( 'mobile/checkout/unknownError', _message );
})

/**
 * user checkout login for post
 */
router.post('/checkout/login', function(req, res, next) {
  var urlPath = '/saveOrderInfo';
  var message = {
    order_id: req.body.order_id || null,
    merchant_id: req.body.merchant_id,
    amount: req.body.amount,
    order_detail: req.body.order_detail,
    return_url: req.body.return_url,
    api_id: req.body.api_id
  };
  if( req.body.cart_id != undefined || req.body.cart_id != '' ){
    message = {
      merchant_id: req.body.merchant_id,
      return_url: req.body.return_url,
      api_id: req.body.api_id,
      cart_id: req.body.cart_id
    };
  }
  request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
    console.log( 'user save new order ', body );
    if( body.code == 200 ){
      res.redirect('/mobile/checkout/login?merchant='+req.body.merchant_id+'&order='+body.result.order_id+'&sign='+req.body.sign+'&sign_type='+req.body.sign_type+'&charset='+req.body.charset );
    }else{
      res.render( 'mobile/checkout/unknownError',{ error: body.message, title: '订单错误', location: 'error'} );
    }
  })
});

//sdk的登录页面
router.get('/checkout/login', function(req, res, next) {
  var merchant = req.query.merchant || '';
  var order = req.query.order || '';
  var sign = req.query.sign || '';
  var sign_type = req.query.sign_type || '';
  var _charset = req.query.charset || '';
  var _platform = req.query.platform || 'web';
  if( merchant == '' || order == '' || sign == '' || sign_type == '' ){
    res.redirect( '/mobile/checkout/unknownError?action=10014');
    return;
  }
  var urlPath = '/orderInfo',
  message = {
    order_id: order,
    merchant_id: merchant
  };
  request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
    if( body.code == 200 ){
      req.session[merchant+order] = body.result;
      if( typeof body.result.order_detail == 'object' ){
        req.session[merchant+order].order_detail = body.result.order_detail;
      }else{
        req.session[merchant+order].order_detail = JSON.parse(body.result.order_detail);
      }
      
      req.session[merchant+order].sign = sign;
      req.session[merchant+order].sign_type = sign_type;
      req.session[merchant+order].charset = _charset;
      req.session[merchant+order].platform = _platform;
      console.log(message);
      var authOrder = pierUtil.checkAuthOrder( req, res, merchant+order );
      if( !authOrder ) return;
      authOrder.location = 'login';
      authOrder.phone = undefined;
      authOrder.password = undefined;
      authOrder.errorMsg = '';
      authOrder.directError = false;
      authOrder.location = 'login';
      authOrder.title = '品而支付';
      authOrder.pageInfo = JSON.stringify({ page_id: '200001' });
      res.render('mobile/checkout/login', authOrder );
    }else{
      res.render( 'mobile/checkout/unknownError',{ error: body.message, title: '订单错误', location: 'error'} );
    }
  })
});

//登录的post请求
router.post('/checkout/login_auth', function(req, res, next) {
  var merchant = req.body.merchant_id || '';
  var order = req.body.order_id || '';
  if( merchant == '' || order == '' ){
    res.redirect( '/mobile/checkout/unknownError?action=10014');
    return;
  }
  var authOrder = pierUtil.checkAuthOrder( req, res, merchant+order );
  if( !authOrder ) return;
  var params = {
    phone: req.body.phone,
    password: req.body.password
  };
  var urlPath = '/checkoutLogin';
  console.log( "checkout user login params", params );
  //for check user password and phone
  authOrder.errorMsg = '';
  authOrder.directError = false;

  //login request
  request( pierUtil.getRequestParams( urlPath, params ), function(err, response, body){
    console.log( "user login when checkout", body );
    authOrder.errorMsg = '';
    if( body.code == 200 ){
      req.session[merchant+order].user_auth = { user_id: body.result.user_id , session_token: body.result.session_token, name: body.result.name, phone: req.body.phone };
      console.log('get user authOrer detail', authOrder );
      if( pierUtil.getBinaryStatusBit( body.result.status_bit, 4 ) != 1 ){
        authOrder.location = 'login';
        authOrder.errorMsg = '当前账户还没有申请信用';
        authOrder.phone = params.phone;
        authOrder.password = params.password;
        authOrder.directError = true;
        authOrder.pageInfo = JSON.stringify({ page_id: '200001' });
        res.render('mobile/checkout/login', authOrder );
        return;
      }
      if( authOrder.order_detail != {} ){
        res.redirect( '/mobile/checkout/confirm?merchant='+merchant+'&order='+order+'&action=10004')
      }else{
        res.redirect( '/mobile/checkout/payment?merchant='+merchant+'&order='+order+'&action=10008')
      }
    }else{
      authOrder.location = 'login';
      authOrder.errorMsg = body.message;
      authOrder.phone = params.phone;
      authOrder.password = params.password;
      authOrder.pageInfo = JSON.stringify({ page_id: '200001' });
      res.render('mobile/checkout/login', authOrder );
    }
  } );
});

/*
  user payment page
 */
router.get('/checkout/payment', function(req, res, next) {
  var merchant = req.query.merchant || '';
  var order = req.query.order || '';
  if( merchant == '' || order == '' ){
    res.redirect( '/mobile/checkout/unknownError?action=10014');
    return;
  }
  var authOrder = pierUtil.checkAuthOrder( req, res, merchant+order );
  if( !authOrder ) return;
  var userAuth = pierUtil.checkUserAuth( req, res, merchant+order );
  if( !userAuth ) return;

  var urlPath = '/prePay';
  var message = {
    user_id: userAuth.user_id,
    session_token: userAuth.session_token
  };

  request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
    console.log( "user check prePay when make payment", body );
    // body.code = '1142';
    if( body.code == '200' ){
      pierUtil.refreshToken( body.result.session_token, req, merchant+order );
      authOrder.location = 'checkout';
      authOrder.title = '付款';
      authOrder.errorMsg = '';
      authOrder.account = userAuth.phone;
      authOrder.pageInfo = JSON.stringify({ page_id: '200003' });
      res.render('mobile/checkout/payment',authOrder);
    }else if( body.code == '1171' ){
      var message = {
        merchant_id: merchant,
        order_id: order,
        title: '添加银行卡',
        errorMsg: ''
      };
      res.render('mobile/linkBank/verifyPin', message );
    }else if( body.code == '1142' ){
      var message = {
        merchant_id: merchant,
        order_id: order,
        title: '设置支付密码',
        errorMsg: ''
      };
      res.render('mobile/addPin/setPin', message );
    }
  } );
});

//进入 confirm页面
router.get('/checkout/confirm', function(req, res, next) {
  var merchant = req.query.merchant || '';
  var order = req.query.order || '';
  if( merchant == '' || order == '' ){
    res.redirect( '/mobile/checkout/unknownError?action=10014');
    return;
  }
  var authOrder = pierUtil.checkAuthOrder( req, res, merchant+order );
  console.log( 'mobile checkout confirm page ', authOrder );
  if( !authOrder ) return;
  var userAuth = pierUtil.checkUserAuth( req, res, merchant+order );
  if( !userAuth ) return;

  console.log( 'order detail to json', authOrder );
  authOrder.location = 'checkout';
  authOrder.title = '订单确认';
  authOrder.pageInfo = JSON.stringify({ page_id: '200002' });
  res.render( 'mobile/checkout/confirm',authOrder );
});

//获取分期信息
router.post('/checkout/getInstalment', function(req, res, next) {
  var merchant = req.body.merchant_id;
  var order = req.body.order_id;

  var authOrder = pierUtil.checkAuthOrderForApi( req, res, merchant+order );
  if( !authOrder ) return;
  var userAuth = pierUtil.checkUserAuthForApi( req, res, merchant+order );
  if( !userAuth ) return;

  var urlPath = '/getInstalment';
  var message = {
    user_id: userAuth.user_id,
    session_token: userAuth.session_token,
    merchant_id: authOrder.merchant_id,
    order_id: order
  };

  request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
    console.log( "user get instalment when checkout", body );
    if( body.code == 200 ){
      pierUtil.refreshToken( body.result.session_token, req, merchant+order );
      res.send( body );
      // res.send( { code: '1001', message: 'session 过期', result: {} } );
    }else{
      res.send( body );
    }
  } );
});

//保存分期信息
router.post('/checkout/applyInstalment', function(req, res, next) {
  var merchant = req.body.merchant_id;
  var order = req.body.order_id;
  var termId = req.body.term_id;

  var authOrder = pierUtil.checkAuthOrderForApi( req, res, merchant+order );
  if( !authOrder ) return;
  var userAuth = pierUtil.checkUserAuthForApi( req, res, merchant+order );
  if( !userAuth ) return;

  var urlPath = '/applyInstalment';
  var message = {
    user_id: userAuth.user_id,
    session_token: userAuth.session_token,
    merchant_id: authOrder.merchant_id,
    order_id: order,
    term_id: termId
  };

  request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
    console.log( "user apply instalment when checkout", body );
    if( body.code == 200 ){
      pierUtil.refreshToken( body.result.session_token, req, merchant+order );
      res.send( body );
    }else{
      res.send( body );
    }
  } );
});

//获取我的地址的页面
router.get( '/checkout/myAddress', function( req, res, next ){
  var merchant = req.query.merchant;
  var order = req.query.order;
  var message = {
    title: '选择收货地址',
    merchant_id: merchant,
    order_id: order
  }
  res.render( 'mobile/checkout/myAddress', message );
})

//添加我的地址的页面
router.get( '/checkout/addAddress', function( req, res, next ){
  var merchant = req.query.merchant;
  var order = req.query.order;
  var message = {
    title: '添加收货地址',
    merchant_id: merchant,
    order_id: order
  }
  res.render( 'mobile/checkout/addAddress', message );
})

//获取收货地址
router.post('/checkout/getAddresses', function(req, res, next) {
  var merchant = req.body.merchant_id;
  var order = req.body.order_id;

  var authOrder = pierUtil.checkAuthOrderForApi( req, res, merchant+order );
  if( !authOrder ) return;
  var userAuth = pierUtil.checkUserAuthForApi( req, res, merchant+order );
  if( !userAuth ) return;

  var urlPath = '/getAddresses';
  var message = {
    user_id: userAuth.user_id,
    session_token: userAuth.session_token,
  };

  request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
    console.log( "user get addresss information ", body );
    if( body.code == 200 ){
      pierUtil.refreshToken( body.result.session_token, req, merchant+order );
      res.send( body );
    }else{
      res.send( body );
    }
  } );
});

//保存订单的收货地址
router.post('/checkout/applyOrderAddress', function(req, res, next) {
  var merchant = req.body.merchant_id;
  var order = req.body.order_id;

  var authOrder = pierUtil.checkAuthOrderForApi( req, res, merchant+order );
  if( !authOrder ) return;
  var userAuth = pierUtil.checkUserAuthForApi( req, res, merchant+order );
  if( !userAuth ) return;

  var urlPath = '/saveOrderAddress';
  var message = req.body;
  message.user_id = userAuth.user_id;
  message.session_token = userAuth.session_token;

  request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
    console.log( "user apply order addresss ", body );
    if( body.code == 200 ){
      pierUtil.refreshToken( body.result.session_token, req, merchant+order );
      res.send( body );
    }else{
      res.send( body );
    }
  } );
});

//添加收货地址
router.post('/checkout/addAddress', function(req, res, next) {
  var merchant = req.body.merchant_id;
  var order = req.body.order_id;

  var authOrder = pierUtil.checkAuthOrderForApi( req, res, merchant+order );
  if( !authOrder ) return;
  var userAuth = pierUtil.checkUserAuthForApi( req, res, merchant+order );
  if( !userAuth ) return;

  var urlPath = '/addAddress';
  var message = {
    user_id: userAuth.user_id,
    session_token: userAuth.session_token,
    name: req.body.name,
    phone: req.body.phone,
    province_id: req.body.province_id,
    city_id: req.body.city_id,
    county_district_id: req.body.county_district_id,
    postal_code: req.body.postal_code,
    address_detail: req.body.address_detail
  };

  request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
    console.log( "user get addresss information ", body );
    if( body.code == 200 ){
      pierUtil.refreshToken( body.result.session_token, req, merchant+order );
      res.send( body );
    }else{
      res.send( body );
    }
  } );
});

//在支付的时候获取手机验证码信息
router.post('/checkout/getSMS', function(req, res, next) {
  var merchant = req.body.merchant_id;
  var order = req.body.order_id;

  var authOrder = pierUtil.checkAuthOrderForApi( req, res, merchant+order );
  console.log( 'checkout get sms api ', authOrder );
  if( !authOrder ) return;
  
  var userAuth = pierUtil.checkUserAuthForApi( req, res, merchant+order );
  if( !userAuth ) return;
  var urlPath = '/checkoutSMS';
  var message = {
    user_id: userAuth.user_id,
    session_token: userAuth.session_token,
    merchant_id: authOrder.merchant_id,
    order_id: order
  }
  request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
    console.log( "user get sms when checkout", body );
    if( body.code == 200 ){
      pierUtil.refreshToken( body.result.session_token, req, merchant+order );
      res.send( body );
    }else{
      res.send( body );
    }
  } );
});

//最后的支付事件
router.post('/checkout/pay', function(req, res, next) {
  var merchant = req.body.merchant_id;
  var order = req.body.order_id;
  var authOrder = pierUtil.checkAuthOrder( req, res, merchant+order );
  
  if( !authOrder ) return;

  var userAuth = pierUtil.checkUserAuth( req, res, merchant+order );
  if( !userAuth ) return;
  authOrder.account = userAuth.phone;
  var urlPath = '/checkoutPay';
  var message = {
    user_id: userAuth.user_id,
    session_token: userAuth.session_token,
    merchant_id: authOrder.merchant_id,
    order_id: authOrder.order_id,
    sms_code: req.body.validCode,
    pay_password: req.body.payPassword,
    sign: authOrder.sign,
    sign_type: authOrder.sign_type,
    charset: authOrder.charset
  };
  authOrder.errorMsg = '';
  console.log( 'checkout get pay api ', message );
  request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
    console.log( "user make payment", body );
    if( body.code == 200 ){
      pierUtil.refreshToken( body.result.session_token, req, merchant+order );
      authOrder.location = 'checkout';
      authOrder.title = '支付成功';
      pierUtil.destoryAuthOrder( merchant, order, req );
      authOrder.pageInfo = JSON.stringify({ page_id: '200004' });
      res.render( 'mobile/checkout/paySuccess', authOrder );
    }else if( body.code == '1110' || body.code == '1111' || body.code == '2028' || body.code == '1142' ){
      authOrder.location = 'checkout';
      authOrder.title = '付款';
      authOrder.errorMsg = body.message;
      authOrder.account = userAuth.phone;
      authOrder.pageInfo = JSON.stringify({ page_id: '200003' });
      res.render('mobile/checkout/payment',authOrder);
    }else{
      authOrder.location = 'checkout';
      authOrder.title = '支付失败';
      authOrder.errorMsg = body.message;
      pierUtil.destoryAuthOrder( merchant, order, req );
      authOrder.pageInfo = JSON.stringify({ page_id: '200005' });
      res.render( 'mobile/checkout/payFailed', authOrder );
    }
  } );
});
router.get('/checkout/paySuccess', function(req, res, next) {
  var merchant = req.query.merchant;
  var order = req.query.order;
  var authOrder = pierUtil.checkAuthOrder( req, res, merchant+order );
  if( !authOrder ) return;
  var userAuth = pierUtil.checkUserAuth( req, res, merchant+order );
  if( !userAuth ) return;
  authOrder.account = userAuth.phone;
  authOrder.location = 'checkout';
  authOrder.title = '支付成功';
  authOrder.pageInfo = JSON.stringify({ page_id: '200004' });
  res.render('mobile/checkout/paySuccess', authOrder);
});
router.get('/checkout/payFailure', function(req, res, next) {
  var merchant = req.query.merchant;
  var order = req.query.order;
  var authOrder = pierUtil.checkAuthOrder( req, res, merchant+order );
  if( !authOrder ) return;
  var userAuth = pierUtil.checkUserAuth( req, res, merchant+order );
  if( !userAuth ) return;
  authOrder.account = userAuth.phone;
  authOrder.location = 'checkout';
  authOrder.title = '支付失败';
  authOrder.errorMsg = '一些原因';
  authOrder.pageInfo = JSON.stringify({ page_id: '200005' });
  res.render('mobile/checkout/payFailed', authOrder);
});
/**
 * user link bank
 */
router.get('/checkout/linkBank', function( req, res, next){
  res.render('linkBank/verifyPin', {title: '添加银行卡',merchant_id:'001',order_id:'002', errorMsg: ''});
})
router.post('/checkout/verifyPinPost', function( req, res, next){
  var merchant = req.body.merchant_id;
  var order = req.body.order_id;
  var password = req.body.payPassword;
  var authOrder = pierUtil.checkAuthOrder( req, res, merchant+order );
  if( !authOrder ) return;

  var userAuth = pierUtil.checkUserAuth( req, res, merchant+order );
  if( !userAuth ) return;

  var urlPath = '/checkPayPassword',
  message = {
      user_id: userAuth.user_id,
      session_token: userAuth.session_token,
      password: password
  };
  request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
    console.log("user check pay password success", body );
    if( body.code == '200' ){
      var message = {
        merchant_id: merchant,
        order_id: order,
        title: '添加银行卡',
        errorMsg: '',
        username: userAuth.name
      };
      res.render( 'linkBank/linkBank', message );
    }else{
      var message = {
        merchant_id: merchant,
        order_id: order,
        title: '添加银行卡',
        errorMsg: body.message,
        username: userAuth.name
      };
      res.render('linkBank/verifyPin', message );
    }
  } );
})
router.post('/checkout/linkBankPost', function(req, res, next) {
  var merchant = req.body.merchant_id,
  order = req.body.order_id;
  var userAuth = pierUtil.checkUserAuthForApi( req, res, merchant+order );
  if( !userAuth ) return;
  var message = {
    user_id: userAuth.user_id,
    session_token: userAuth.session_token,
    bank_id: req.body.bank_id,
    card_num: req.body.card_num,
    linked_phone: req.body.linked_phone
  };
  console.log( 'get link bank account session_token', message );
  var urlPath = '/regLinkBankCard';
  request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
    console.log( "user link bank account success", body );
    if( body.result.session_token ){
      pierUtil.refreshToken( body.result.session_token, req, merchant+order );
    }
    res.send( body );
  } );
});
router.post( '/checkout/verifyBankPost', function( req, res, next ) {
  var merchant = req.body.merchant_id,
  order = req.body.order_id;
  var userAuth = pierUtil.checkUserAuth( req, res, merchant+order );
  if( !userAuth ) return;
  var message = {
    user_id: userAuth.user_id,
    session_token: userAuth.session_token,
    bank_card_id: req.body.bank_card_id,
    code: req.body.code
  };
  var urlPath = '/regVerifyBank';
  request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
    console.log( "user verify bank account success", body );
    if( body.result.session_token ){
      pierUtil.refreshToken( body.result.session_token, req, merchant+order );
    }
    res.send( body );
  } );
});
/**
 * user Set pin when checkout
 */
router.post( '/checkout/SetPin', function( req, res, next ){
  var merchant = req.body.merchant_id,
  order = req.body.order_id,
  password = req.body.password;
  var userAuth = pierUtil.checkUserAuthForApi( req, res, merchant+order );
  if( !userAuth ) return;
  var message = {
    user_id: userAuth.user_id,
    session_token: userAuth.session_token,
    password: password
  };
  var urlPath = '/regSetPayPsd';
  request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
    console.log( "user add Pin success", body );
    if( body.result.session_token ){
      pierUtil.refreshToken( body.result.session_token, req, merchant+order );
    }
    if( body.code == '200' ){
      var message = {
        title: '添加银行卡',
        merchant_id: merchant,
        order_id: order,
        username: userAuth.name
      };
      res.render('addPin/linkBank', message );
      return;
    }else{
      var message = {
        title: '设置支付密码',
        merchant_id: merchant,
        order_id: order,
        errorMsg: body.message
      };
      res.render('addPin/setPin', message );
      return;
    }
  } );
} )
/**
 * user register flow
 */
router.get('/user/register', function(req, res, next) {
  console.log("user register start");
  res.render('mobile/register/register',{title:'用户注册',location:'register', userInfo: '' });
});

router.post('/user/apply', function(req, res, next) {
  console.log( "user apply credit", req.body );
  var urlPath = '/regApplyCredit';
  request( pierUtil.getRequestParams( urlPath, req.body ), function(err, response, body){
    console.log( "get apply credit response body", body );
    body.location = 'register';
    if( body.code == 200 ){
      req.session['user_auth'] = { user_id: req.body.user_id , session_token: body.result.session_token, name: body.result.name };
      body.title = '申请信用成功';
      res.render('mobile/register/applySuccess',body );
    }else{
      body.title = '申请信用失败';
      if( body.code == '1160' ) body.message = '很抱歉，您未满18周岁，无法申请品而信用的信用额度。您可以下载手机APP，通过“立即还款”中向账户充值后进行消费。';
      res.render('mobile/register/applyFailure',body );
    }
  } );
});

router.post('/user/bank_accout_verify', function(req, res, next) {
  var userInfo = JSON.parse( req.body.userInfo );
  req.session['register_user_info'] =  userInfo ;
  console.error( 'user bank accout verify post use info ', req.session['register_user_info'] );

  var urlPath = '/cardValidation',
  message = {
    user_id: userInfo.user_id,
    session_token: userInfo.session_token,
    card_no: req.body.bankNum,
    acct_name: userInfo.username,
    order_type: '1',
    sign_type: 'MD5',
    app_request: "3",
    bg_color: "7b37a6",
    url_return: 'http://pierup.cn:4000/mobile/user/verifyBankCallbank'
  };
  console.log( "get lianlian order info", message );
  
  request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
    console.log( "get lianlian order info", body );
    if( body.code == 200 ){
        var payInfo = {
           "acct_name": body.result.acct_name,
           "app_request":body.result.app_request,
           "bg_color": body.result.bg_color,
           "busi_partner": body.result.busi_partner,
           "card_no": body.result.card_no,
           "dt_order": body.result.dt_order,
           "id_no": body.result.id_no,
           "info_order": body.result.info_order,
           "money_order": body.result.money_order,
           "name_goods": body.result.name_goods,
           "no_agree": body.result.no_agree,
           "no_order": body.result.no_order,
           "notify_url": body.result.notify_url,
           "oid_partner": body.result.oid_partner,
           "risk_item": body.result.risk_item,
           "sign": body.result.sign,
           "sign_type": body.result.sign_type,
           "url_return": body.result.url_return,
           "user_id": body.result.user_id,
           "valid_order": body.result.valid_order
       };
       //for test account
       // payInfo.oid_partner = '201306031000001013';
       // payInfo = {"acct_name":"程聪","app_request":"3","bg_color":"7b37a6","busi_partner":"101001","card_no":"6212261001015792325","dt_order":"20150919105051","id_no":"350783199204095532","info_order":"品而数据银行卡验证，从用户银行卡里转账0.01元到品而数据帐号","money_order":"0.01","name_goods":"品而数据--银行卡验证","no_agree":"","no_order":"20150919105051","notify_url":"https://www.pierup.cn:8443/user_api_cn/v1/lianlian/callback_validation","oid_partner":"201306031000001013","risk_item":"{\\\"user_info_dt_register\\\":\\\"20131030122130\\\"}","sign":"7d2498e9fb50d59dce71aae8b4cc841b","sign_type":"MD5","url_return":"http://pierup.cn:4000/mobile/user/verifyBankCallbank","user_id":"22222222","valid_order":"30"};
       console.error('send lianlian params', JSON.stringify( payInfo ) );
       res.render( 'mobile/register/bankVerify', { req_data:JSON.stringify( payInfo ), title: '添加银行卡'});
    }else{
      console.error('link lianlian failed', body );
    }
  } );
  var req_data = JSON.stringify( payInfo );
  res.render( 'mobile/register/bankVerify', { req_data: req_data, title: '银行校验' });
});

//for test
router.get('/user/applySuccess', function(req, res, next) {
  res.render('mobile/register/applySuccess',{title:'申请信用成功', location: 'register',result:{credit_limit:'1000.00'}});
});
router.get('/user/applyFailure', function(req, res, next) {
  res.render('mobile/register/applyFailure',{title:'申请信用失败', location: 'register', message: '很多原因让你申请失败的。'});
});
router.get('/user/verifyBankCallbank', function( req, res, next ){
  console.log( "verifyBankCallbank from lianlian for Get", req.query );
  var reqData = req.query.req_data || '';
  if( reqData != '' ){
    var userInfo = req.session['register_user_info']; 
    userInfo.statusBit = '19';
    res.render('mobile/register/register',{title:'用户注册',location:'register', userInfo: userInfo });
  }else{
    res.redirect('/mobile/user/register#/link-bank');
  }
});

router.post('/user/verifyBankCallbank', function( req, res, next ){
  var reqData = req.query.req_data || '';
  console.log( "verifyBankCallbank from lianlian for Post", req.query );
  if( reqData != '' ){
    var urlPath = '/payCallback';
    var userInfo = req.session['register_user_info']; 
    var message = {
      user_id: userInfo.user_id,
      result_pay: reqData.result_pay,
      ret_msg: '交易成功',
      no_order: reqData.no_order,
      oid_paybill: reqData.oid_paybill,
      settle_date: reqData.settle_date,
      sign_type: reqData.sign_type,
      sign: reqData.sign,
      money_order: reqData.money_order
    };
    request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
      console.log( "lianlian callback_validation success", body );
      userInfo.statusBit = body.result.status_bit;
      res.render('mobile/register/register',{title:'用户注册',location:'register', userInfo: userInfo });
    } );
  }else{
    res.redirect('/mobile/user/register#/link-bank');
  }
});
/**
 * user forget pay password
 */
router.get('/user/resetPayPassword', function(req, res, next) {
  var merchant = req.query.merchant || '';
  var order = req.query.order || '';
  if( merchant == '' || order == '' ){
    res.redirect( '/checkout/unknownError');
    return;
  }
  var authOrder = pierUtil.checkAuthOrder( req, res, merchant+order );
  console.log( 'checkout confirm page ', authOrder );
  if( !authOrder ) return;
  var userAuth = pierUtil.checkUserAuth( req, res, merchant+order );
  if( !userAuth ) return;
  req.session['forgetPinAuth'] = { merchant_id: merchant , order_id: order };
  
  var params = {
    title: '重置支付密码',
    username: userAuth.name,
    location: 'forgetPin'
  };
  console.log( 'for user reset pay password', params );
  res.render( 'mobile/resetPayPassword/forget-paypsd', params );
});

router.post('/user/resetPayPsd/linkBankCard', function(req, res, next) {
  var forgetPinAuth = req.session['forgetPinAuth'];
  var merchant = forgetPinAuth.merchant_id,
  order = forgetPinAuth.order_id;
  var userAuth = pierUtil.checkUserAuthForApi( req, res, merchant+order );
  if( !userAuth ) return;
  var message = {
    user_id: userAuth.user_id,
    session_token: userAuth.session_token,
    bank_id: req.body.bank_id,
    card_num: req.body.card_num,
    linked_phone: req.body.linked_phone,
    id_number: req.body.id_number
  };
  console.log( 'get link bank account session_token', message );
  var urlPath = '/forgetPaymentPassword';
  request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
    console.log( "user link bank account success", body );
    if( body.result.session_token ){
      pierUtil.refreshToken( body.result.session_token, req, merchant+order );
    }
    res.send( body );
  } );
});

router.post('/user/resetPayPsd/verifyBank', function(req, res, next) {
  var forgetPinAuth = req.session['forgetPinAuth'];
  var merchant = forgetPinAuth.merchant_id,
  order = forgetPinAuth.order_id;
  var userAuth = pierUtil.checkUserAuthForApi( req, res, merchant+order );
  if( !userAuth ) return;
  var message = {
    user_id: userAuth.user_id,
    session_token: userAuth.session_token,
    code: req.body.code
  };
  var urlPath = '/forgetPaymentPasswordValidate';
  request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
    console.log( "user verify bank account success", body );
    if( body.result.session_token ){
      pierUtil.refreshToken( body.result.session_token, req, merchant+order );
    }
    res.send( body );
  } );
});

router.get('/user/resetPayPassword2', function(req, res, next) {
  var forgetPinAuth = req.session['forgetPinAuth'];
  var merchant = forgetPinAuth.merchant_id,
  order = forgetPinAuth.order_id;
  var userAuth = pierUtil.checkUserAuth( req, res, merchant+order );
  if( !userAuth ) return;
  var query = req.query.token;
  var params = {
    title: '重置支付密码',
    username: userAuth.name,
    token: query,
    location: 'forgetPin'
  };
  console.log( 'for user reset pay password2', params );
  res.render( 'resetPayPassword/reset-paypsd', params );
});

router.post('/user/resetPayPsd/reset', function(req, res, next) {
  var forgetPinAuth = req.session['forgetPinAuth'];
  var merchant = forgetPinAuth.merchant_id,
  order = forgetPinAuth.order_id;
  var userAuth = pierUtil.checkUserAuthForApi( req, res, merchant+order );
  if( !userAuth ) return;
  var message = {
    user_id: userAuth.user_id,
    session_token: userAuth.session_token,
    new_payment_password: req.body.new_payment_password,
    payment_password_token: req.body.payment_password_token
  };
  var urlPath = '/forgetPaymentPasswordReset';
  request( pierUtil.getRequestParams( urlPath, message ), function(err, response, body){
    console.log( "user reset pay password success", body );
    if( body.result.session_token ){
      pierUtil.refreshToken( body.result.session_token, req, merchant+order );
    }
    res.send( body );
  } );
});

router.get('/user/resetPinSuccess', function(req, res, next) {
  var forgetPinAuth = req.session['forgetPinAuth'];
  var merchant = forgetPinAuth.merchant_id,
  order = forgetPinAuth.order_id;
  var userAuth = pierUtil.checkUserAuth( req, res, merchant+order );
  if( !userAuth ) return;
  var params = {
    title: '重置支付密码',
    location: 'forgetPin',
    merchant_id: merchant,
    order_id: order
  };
  res.render( 'resetPayPassword/resetSuccess', params );
});

module.exports = router;

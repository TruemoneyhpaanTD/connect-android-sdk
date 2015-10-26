var express = require('express');
var rp = require('request-promise');
var uuid = require('node-uuid');
var app = express();

var CLIENT_SUCCESS_URI = 'telenor-connect-payment-processor-example://transactionSuccess';
var CLIENT_CANCEL_URI = 'telenor-connect-payment-processor-example://transactionCancel';

var SERVER_LOCATION = 'http://10.0.2.2:8081';

app.get('/createTransaction', function (req, res) {
    var transactionId = uuid.v4();
    var serverAuthorization = "Basic " +
        new Buffer("connect-example:jElrri2C0m6vXEW").toString('base64');
    rp({
        body: {
            amount: "NOK 100",
            cancelRedirect: SERVER_LOCATION + "/paymentSuccess/" + transactionId,
            orderId: transactionId,
            purchaseDescription: "An item for sale",
            successRedirect: SERVER_LOCATION + "/paymentSuccess/" + transactionId,
            vatRate: "0.25"
        },
        headers: {
            'Authorization': serverAuthorization,
        },
        json: true,
        method: 'POST',
        resolveWithFullResponse: true,
        uri: 'https://staging-payment-payment2.comoyo.com/transactions'
    }).then(function (createTransactionResponse) {
        var paymentHref;
        createTransactionResponse.body.links.forEach(function (link) {
            if (link.rel === 'PAYMENT') {
                paymentHref = link.href;
            }
        });
        res.send({location: paymentHref});
    }).catch(function (createTransactionError) {
        // TODO All errors that could be generated by the transactions endpoint should be
        // handled here.
        res.sendStatus(502);
    });
});

app.get('/paymentSuccess/:transaction', function (req, res) {
    console.log('There was a successful payment for transaction: ' + req.params.transaction);
    res.redirect(CLIENT_SUCCESS_URI);
});

app.get('/paymentCancel/:transaction', function (req, res) {
    console.log('Payment for transaction: ' + req.params.transaction + ' was cancelled');
    res.redirect(CLIENT_CANCEL_URI);
});

var server = app.listen(8081, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Connect Payment example server listening at http://%s:%s', host, port);
});

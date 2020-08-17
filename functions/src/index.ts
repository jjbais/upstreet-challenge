import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as https from 'https';
import * as url from 'url';

admin.initializeApp();

const db = admin.firestore();

// Will run daily at 12:00 am at UTC+08:00.
exports.runDaily = functions.pubsub.schedule('0 0 * * *')
    .timeZone('Asia/Manila')
    .onRun(() => {

        // Should be environment variable on production deployment.
        const sid = 'IRnJLrJ8LTLu2221199xRgkG6ZBgu8Niu1';
        const authToken = 'vYEk4NhhE9imuuray_Uxgg_zRLfJyUMr';

        const endDate = new Date();
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 1);

        const requestUrl = url.parse(url.format({
            protocol: 'https',
            auth: `${sid}:${authToken}`,
            host: 'api.partner.ebay.com',
            pathname: `/Mediapartners/${sid}/Reports/ebay_partner_transaction_detail.json`,
            query: {
                DATE_TYPE: 'event_date',
                STATUS: 'ALL',
                START_DATE: startDate.toISOString().split('T')[0],
                END_DATE: endDate.toISOString().split('T')[0]
            }
        }));

        https.get(requestUrl, (response) => {
            var payload = '';
            response.on('data', (data) => {
                payload += data;
            });
            response.on('end', () => {
                const body = JSON.parse(payload.toString());
                
                db.collection('affiliate')
                    .doc('eBay')
                    .collection('transactions')
                    .doc(startDate.toISOString().split('T')[0])
                    .set({
                        Records: body.Records
                    }).then((success) => {
                        console.log(success);
                    }).catch((error) => {
                        console.log(error);
                    })
            });
        }).on('error', (error) => {
            console.log(error);
        });
    });
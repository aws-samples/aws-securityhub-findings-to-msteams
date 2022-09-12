'use strict';
const AWS = require('aws-sdk');
const url = require('url');
const https = require('https');

const webHookUrl = process.env['webHookUrl'];

function postMessage(message, callback) {
    const body = JSON.stringify(message);
    const options = url.parse(webHookUrl);
    options.method = 'POST';
    options.headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
    };

    const postReq = https.request(options, (res) => {
        const chunks = [];
        res.setEncoding('utf8');
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
            if (callback) {
                callback({
                    body: chunks.join(''),
                    statusCode: res.statusCode,
                    statusMessage: res.statusMessage,
                });
            }
        });
        return res;
    });

    postReq.write(body);
    postReq.end();
}

function processEvent(event, callback) {
    const message = event;
    const consoleUrl = `https://console.aws.amazon.com/securityhub`;
    const finding = message.detail.findings[0].Types[0];
    const findingDescription = message.detail.findings[0].Description;
    const findingTime = message.detail.findings[0].UpdatedAt;
    const account = message.detail.findings[0].AwsAccountId;
    const region = message.detail.findings[0].Resources[0].Region;
    const type = message.detail.findings[0].Resources[0].Type;
    const messageId = message.detail.findings[0].Resources[0].Id;
    const resource = message.detail.findings[0].Resources[0];  

    const recommendationText = message.detail.findings[0].Remediation.Recommendation.Text;
    const recommendationUrl = message.detail.findings[0].Remediation.Recommendation.Url;
    const title = message.detail.findings[0].Title;

    var color = '#7CD197';
    var severity = '';

    if (1 <= message.detail.findings[0].Severity.Normalized && message.detail.findings[0].Severity.Normalized <= 39) {
        severity = 'LOW';
        color = '#879596';
    } else if (40 <= message.detail.findings[0].Severity.Normalized && message.detail.findings[0].Severity.Normalized <= 69) {
        severity = 'MEDIUM';
        color = '#ed7211';
    } else if (70 <= message.detail.findings[0].Severity.Normalized && message.detail.findings[0].Severity.Normalized <= 89) {
        severity = 'HIGH';
        color = '#ed7211';
    } else if (90 <= message.detail.findings[0].Severity.Normalized && message.detail.findings[0].Severity.Normalized <= 100) {
        severity = 'CRITICAL';
        color = '#ff0209';
    } else {
        severity = 'INFORMATIONAL';
        color = '#007cbc';
    }
    
    const sections= [{
        "summary": finding + ` - ${consoleUrl}/home?region=` + `${region}#/findings?search=id%3D${messageId}`,
        "activitySubtitle": `AWS SecurityHub finding in **${region}** for Acct: **${account}**`,
        "activityTitle": `${title}`,
        "activityImage": "https://raw.githubusercontent.com/aws-samples/aws-securityhub-findings-to-msteams/master/images/securityhub.png",

        "text": `${findingDescription}`,
        "facts": [{
            "name": "Severity",
            "value": `${severity}`,
        }, {
            "name": "Region",
            "value": `${region}`,
        }, {
            "name": "Resource Type",
            "value": `${type}`,
        }, {
            "name": "Resource Identifier",
            "value": `***${messageId}***`,        
        }, {
            "name": "Time Last Seen in Security Hub",
            "value": `${findingTime}`,
        }, {
            "name": "Recommendation",
            "value": `${recommendationText}`,
        }, {
            "name": "Recommendation URL",
            "value": `${recommendationUrl}`,        
        }, {
            "name": "Resource",
            "value": "```" + JSON.stringify(resource, null, 2) + "```",        
        }],
        "markdown": true,
        "themeColor": color
    }];

    const teamsMessage = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": color,
        "summary": "SecurityHub Finding",
        "sections": sections 
    }

    postMessage(teamsMessage, (response) => {
        if (response.statusCode < 400) {
            console.info('Message posted successfully');
            callback(null);
        } else if (response.statusCode < 500) {
            console.error(`Error posting message to Microsoft Teams API: ${response.statusCode} - ${response.statusMessage}`);
            callback(null);
        } else {
            callback(`Server error when processing message: ${response.statusCode} - ${response.statusMessage}`);
        }
    });
}
exports.handler = (event, context, callback) => {
    console.log("ENVIRONMENT VARIABLES\n" + JSON.stringify(process.env, null, 2))
    console.info("EVENT\n" + JSON.stringify(event, null, 2))
    processEvent(event, callback);
};

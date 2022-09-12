# aws-securityhub-findings-to-msteams
Demonstrates sending AWS Security Hub findings to your Microsoft Teams channel.

The template Installs a Lambda function and an EventBridge Rule that sends events to a Microsoft Teams incoming web hook. This relies on you creating an *Incoming WebHook* in your Microsoft Teams account and simply passing the URL as a parameter to this template.  By default, the EventBridge Rule is configured to look for Custom Actions in Security Hub:

```
{
  "resources": ["arn:aws:securityhub:REGION:ACCOUNTNO:action/custom/SendToMSTeams"],
  "source": ["aws.securityhub"]
}
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

# Implementation
### **Manual notifications**
Follow Section 1 and Section 2 to set up the manual method of send findings to MS Teams

### **Automatic notifications**

Alternatively, complete Section 1 and Section 3 to **AUTOMATICALLY** send all NEW CRITICAL and HIGH findings to MS Teams.  You can limit this to only send events with a certain label type e.g. **CRITICAL** and **HIGH**.

## Section 1 - Prerequisites and deployment

1.	**Prerequisites**
    + AWS Security Hub is enabled
    + Sufficient permissions in an MS Teams channel to create incoming WebHooks.
1.  **Create an incoming Webhook in the Microsoft Teams API**
    + Follow Microsoft's instructions on how to create a Webhook (https://docs.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook)
    + Note down the URL e.g. https://CUSTOMER.webhook.office.com/webhookb2/12341234-abcd-1234-abcd-1234123412341234/IncomingWebhook/CODE/UUID for use later.
 
3.	**Launch Cloud Formation Template**  
This CloudFormation template will create a Lambda Function that utilizes MS Teams' Webhook API feature, as well as a EventBridge Rule to send findings from Security Hub’s custom actions to MS Teams.
    + Download CloudFormation template by right clicking on “SecurityHubFindingsToMSTeams.yaml” and “Save Link As..” on your local machine
    + Navigate to https://console.aws.amazon.com/cloudformation/
    + Select **Create stack**
    + Select **Upload a template file**
    + Select Choose file and locate “SecurityHubFindingsToMSTeams.json” on your local machine
    + Select Next
    + Use the following values to fill out *Create Stack* parameters  
    ```
        StackName: EnableSecurityHubFindingsToMSTeams  
        IncomingWebHookURL: Paste URL that you just copied from MS Teams API pages  
    ```
     + Select **Next**, fill out any Tags and select **Next** again
     + Accept IAM Resource creation
     + Select **Create Stack**, CloudFormation will then begin creating the stack
     + Wait for the CloudFormation console to report stack creation complete

Continue to [Section 2](#section-2---manual-notification---send-to-ms-teams-custom-action) or [Section 3](#section-3---automatic-notification---all-new-critical-and-high-findings-to-teams-channel)
## Section 2 - Manual notification - Send to MS Teams Custom Action
1.	**Create Security Hub Custom Actions** . 
    + In the Security Hub navigation pane (https://console.aws.amazon.com/securityhub/) select Settings then choose the **Custom Actions** tab. 
    + Select **Create custom action**. 
    + Then in the Create custom action pop up, specify the action name, description and ID then choose OK to create the action.
    ```
         Name: Send to MS Teams  
         Description: This custom action sends selected findings to a channel in Microsoft Teams
         Custom action ID: SendToMSTeams
    ```
2.	**Testing the Send to MS Teams Custom Action**
    + Navigate to AWS Security Hub Console (https://console.aws.amazon.com/securityhub/)
    + Navigate to **Findings**
    + Select the check box next to one or more findings
    + Click the drop-down Actions menu and choose the **Send To MS Teams** Custom Action

The Security Hub Console will then send the finding to your MS Teams channel, you should then receive a notification in your MS Teams channel 

## Section 3 - Automatic notification - All NEW CRITICAL and HIGH findings to Teams Channel
1. Go to EventBridge --> Rules
2. Search for the Rule called *SecurityHubFindingsToMSTeams* and click on it.
3. Click **EDIT**
4. Leave Event source as *Other* and skip the Sample event section.
5. Go to Event pattern and click the button labelled 'Custom patterns (JSON editor)
6. Paste in the following JSON (NOTE: This only notifies for NEW **CRITICAL** and **HIGH** events - you can add labels for "MEDIUM" and "LOW" as needed):
```
{
  "source": ["aws.securityhub"],
  "detail-type": ["Security Hub Findings - Imported"],
  "detail": {
    "findings": {
      "RecordState": ["ACTIVE"],
      "Severity": {
        "Label": ["CRITICAL", "HIGH"]
      },
      "Workflow": {
        "Status": ["NEW"]
      }
    }
  }
}
```
7. Click Next.
8. Leave the target as the existing Lambda function and click Next.
9. Add any relevant tags and click Next.
10. Click 'Update Rule'
11. The next time Security Hub identifies a non-compliant resource with a **CRITICAL** / **HIGH** severity it should now be sent to Microsoft Teams.
12. You can trigger a test by going into Security Hub and switching the workflow status to be different from "NEW" (e.g. "NOTIFIED" and then back to "NEW'.


# Security Findings
This repository has been scanned by the following Static Application Security Testing (SAST) tools
## **npm-audit**
NodeJS code has been copied to SecurityHubToTeams.js and scanned using [npm-audit](https://docs.npmjs.com/cli/v8/commands/npm-audit/)
````
main* $ npm audit fix

up to date, audited 1 package in 209ms

found 0 vulnerabilities
````

## **Checkov**
Cloudformation has been scanned using [Checkov](https://github.com/bridgecrewio/checkov).  
The following four **LOW** severity findings have been supressed in the code:

_Check: **CKV_AWS_117**: "Ensure that AWS Lambda function is configured inside a VPC"_    
Reason: __Example code - ReservedConcurrentExecutions may be considered in a Production environment to guarantee Lambda is launched__  

    FAILED for resource: AWS::Lambda::Function.lambdafindingsToMSTeams
    Severity: LOW
    File: /SecurityHubFindingsToMSTeams.yaml:74-224
    Guide: https://docs.bridgecrew.io/docs/ensure-that-aws-lambda-function-is-configured-inside-a-vpc-1

----

_Check: **CKV_AWS_116**: "Ensure that AWS Lambda function is configured for a Dead Letter Queue(DLQ)"_  
Reason: __Example code - a Dead Letter Queue may be considered in a Production environment__  

    FAILED for resource: AWS::Lambda::Function.lambdafindingsToMSTeams
    Severity: LOW
    File: /SecurityHubFindingsToMSTeams.yaml:74-224
    Guide: https://docs.bridgecrew.io/docs/ensure-that-aws-lambda-function-is-configured-for-a-dead-letter-queue-dlq

----

_Check: **CKV_AWS_173**: "Check encryption settings for Lambda environmental variable"_  
Reason: __Example code - Encrypting Lambda environment variables using KMS should be considered in Production environment__  

    FAILED for resource: AWS::Lambda::Function.lambdafindingsToMSTeams
    Severity: LOW
    File: /SecurityHubFindingsToMSTeams.yaml:74-224
    Guide: https://docs.bridgecrew.io/docs/bc_aws_serverless_5

----

_Check: **CKV_AWS_115**: "Ensure that AWS Lambda function is configured for function-level concurrent execution limit"_  
Reason: __Example code - ReservedConcurrentExecutions may be considered in a Production environment to guarantee Lambda is launched__  

    FAILED for resource: AWS::Lambda::Function.lambdafindingsToMSTeams
    Severity: LOW
    File: /SecurityHubFindingsToMSTeams.yaml:74-224
    Guide: https://docs.bridgecrew.io/docs/ensure-that-aws-lambda-function-is-configured-for-function-level-concurrent-execution-limit

## **CFN_Nag**
This has been scanned with [CFN_Nag](https://github.com/stelligent/cfn_nag)
The following two **WARNINGs** severity findings have been supressed in the code:

Check: **W89**: "Lambda functions should be deployed inside a VPC"  
Reason: __Example code - Running a Lambda inside a VPC should be considered for a Production environment__

    | WARN W89
    |
    | Resource: ["lambdafindingsToMSTeams"]
    | Line Numbers: [93]
    |
    | Lambda functions should be deployed inside a VPC


------------------------------------------------------------
Check: **W92**: "Lambda functions should define ReservedConcurrentExecutions to reserve simultaneous executions"
Reason: __Example code - ReservedConcurrentExecutions may be considered in a Production environment to guarantee Lambda is launched__

    | WARN W92
    |
    | Resource: ["lambdafindingsToMSTeams"]
    | Line Numbers: [93]
    |
    | Lambda functions should define ReservedConcurrentExecutions to reserve simultaneous executions

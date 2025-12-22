import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { askBedrockFunction } from './functions/askBedrockFunction/resource';
import { cancelZoomMeetingFunction } from './functions/cancelZoomMeetingFunction/resource';
import { updateZoomMeetingFunction } from './functions/updateZoomMeetingFunction/resource';
import { zoomBookingFunction } from './functions/zoomBookingFunction/resource';
import { stripeCheckoutFunction } from './functions/stripeCheckoutFunction/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  askBedrockFunction,
  cancelZoomMeetingFunction,
  updateZoomMeetingFunction,
  zoomBookingFunction,
  stripeCheckoutFunction
});

// Grant Bedrock permissions to the Lambda function
backend.askBedrockFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['bedrock:InvokeModel'],
    resources: ['arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0'],
  })
);

backend.zoomBookingFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    resources: ['*'],
  })
);

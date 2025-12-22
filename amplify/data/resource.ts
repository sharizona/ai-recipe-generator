import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { askBedrockFunction } from '../functions/askBedrockFunction/resource';
import { cancelZoomMeetingFunction } from '../functions/cancelZoomMeetingFunction/resource';
import { updateZoomMeetingFunction } from '../functions/updateZoomMeetingFunction/resource';
import { zoomBookingFunction } from '../functions/zoomBookingFunction/resource';
import { stripeCheckoutFunction } from '../functions/stripeCheckoutFunction/resource';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/
const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
    })
    .authorization((allow) => [allow.guest()]),
  UserCredits: a
    .model({
      userId: a.string().required(),
      credits: a.integer().default(0),
      email: a.string(),
    })
    .authorization((allow) => [
      allow.owner().to(['read', 'update', 'create', 'delete']),
      allow.authenticated().to(['read'])
    ]),
  Transaction: a
    .model({
      userId: a.string().required(),
      amount: a.float().required(),
      credits: a.integer().required(),
      stripeSessionId: a.string(),
      status: a.string().required(),
    })
    .authorization((allow) => [
      allow.owner().to(['read']),
    ]),
  Booking: a
    .model({
      userId: a.string().required(),
      name: a.string().required(),
      email: a.string().required(),
      topic: a.string().required(),
      notes: a.string(),
      date: a.string().required(),
      time: a.string().required(),
      timezone: a.string(),
      meetingId: a.string().required(),
      meetingUrl: a.string(),
      startTime: a.string(),
      status: a.string().required(),
    })
    .authorization((allow) => [
      allow.owner().to(['read', 'update', 'create', 'delete']),
    ]),
  askBedrock: a
    .query()
    .arguments({ ingredients: a.string().array() })
    .returns(a.customType({ body: a.string() }))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(askBedrockFunction)),
  createCheckoutSession: a
    .query()
    .arguments({ credits: a.integer().required() })
    .returns(a.customType({
      sessionId: a.string(),
      url: a.string()
    }))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(stripeCheckoutFunction)),
  createZoomMeeting: a
    .query()
    .arguments({
      name: a.string().required(),
      email: a.string().required(),
      date: a.string().required(),
      time: a.string().required(),
      topic: a.string().required(),
      notes: a.string(),
      timezone: a.string(),
    })
    .returns(a.customType({
      meetingUrl: a.string(),
      meetingId: a.string(),
      startTime: a.string(),
    }))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(zoomBookingFunction)),
  updateZoomMeeting: a
    .query()
    .arguments({
      meetingId: a.string().required(),
      date: a.string().required(),
      time: a.string().required(),
      timezone: a.string(),
      topic: a.string(),
    })
    .returns(a.customType({
      startTime: a.string(),
    }))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(updateZoomMeetingFunction)),
  cancelZoomMeeting: a
    .query()
    .arguments({
      meetingId: a.string().required(),
    })
    .returns(a.customType({
      cancelled: a.boolean(),
    }))
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(cancelZoomMeetingFunction)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>

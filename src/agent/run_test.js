// Test runner for the trip planning agent
// Usage:
//   set OPENAI_API_KEY=your_key_here && node src/agent/run_test.js

const { createTripPlan } = require('./agent');
const { getConversationHistory } = require('./conversationManager');

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('WARNING: OPENAI_API_KEY is not set. The OpenAI API call will likely fail.');
  }

  const userQuery = `prepare a 4 day trip to Goa from Delhi internation airport, we are a family of 2 adult and 1 kid.\npreferred date will be from 4th October.\nPlan it under 2Lac.\nSuggest the food joints also as we are vegetarian`;

  console.log('Running createTripPlan with query:');
  console.log(userQuery);

  try {
    const result = await createTripPlan(userQuery, null);
    console.log('\n=== Agent Result ===');
    console.log(JSON.stringify(result, null, 2));

    if (result && result.conversationId) {
      const history = getConversationHistory(result.conversationId);
      console.log('\n=== Conversation History ===');
      console.log(JSON.stringify(history, null, 2));
    }
  } catch (err) {
    console.error('Error running test:', err);
  }
}

main();

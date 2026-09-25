
const OpenAI = require('openai');
const { tools, processToolCall } = require('./tools');
const { getOrCreateConversation } = require('./conversationManager');


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const systemPrompt = `You are a comprehensive trip planning assistant for Goa, India. Your role is to help users plan their perfect Goa vacation by:
1. Recommending destinations based on their interests
2. Suggesting hotels that fit their budget and preferences
3. Proposing activities and experiences suitable for their group
4. Recommending local transportation within Goa (bikes, cars, autos, taxis)
5. Providing Delhi to Goa transportation options (flights, trains, buses, self-drive)
6. Providing current weather and forecast information for trip planning
7. Creating personalized itineraries with complete cost breakdowns

KNOWLEDGE & TOOL STRATEGY:
- You have access to tools for real-time data (hotels, activities, weather, transport)
- You also have training knowledge about Goa from your knowledge base
- TRY TOOLS FIRST: Always attempt to use tools for current/specific data
- FALLBACK TO KNOWLEDGE: If tools return no results or limited data, use your training knowledge
- COMBINE BOTH: Mix tool data with your general knowledge for comprehensive answers
- For general questions (culture, history, geography), use your knowledge directly

Always be friendly, informative, and provide specific recommendations with prices and details. 
Format your responses clearly with sections for transport from Delhi, local transport, destinations, hotels, activities, weather and total itinerary cost.
Consider user budget, group size, comfort preferences, and travel dates when making recommendations.`;


async function createTripPlan(userQuery, conversationId = null) {
  
  const { id: convId, isNew } = getOrCreateConversation(conversationId, systemPrompt);
  const { conversations } = require('./conversationManager');
  const conversation = conversations.get(convId);

  const messages = [
    ...conversation.messages,
    {
      role: 'user',
      content: userQuery
    }
  ];

  
  let toolsUsedCount = 0;
  // Count rounds where tools returned non-empty results
  let nonEmptyToolRounds = 0;
  
  // Safety limit to prevent infinite loops if agent gets stuck
  const maxIterations = 10;
  
  // Track how many times we call the API
  let iteration = 0;

  try {
   
    while (iteration < maxIterations) {
      iteration++;

    
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        tools: tools,
        tool_choice: 'auto'
      });

      const assistantMessage = response.choices[0].message;
      console.log("assistantMessage:", assistantMessage);

      messages.push(assistantMessage);


      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        toolsUsedCount++;
        const toolCalls = assistantMessage.tool_calls;

        const toolResultsThisRound = [];

        for (const toolCall of toolCalls) {
          if (toolCall.type !== 'function') {
            continue;
          }

          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);
          
          const toolResult = await processToolCall(toolName, toolArgs);

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult)
          });

          const isEmpty = !toolResult || (Array.isArray(toolResult) && toolResult.length === 0) || (Object.prototype.toString.call(toolResult) === '[object Object]' && Object.keys(toolResult).length === 0);
          toolResultsThisRound.push({ toolName, toolResult, returnedEmpty: isEmpty });
        }

        if (toolResultsThisRound.some(r => !r.returnedEmpty)) {
          nonEmptyToolRounds++; 
        }

      } else {
       
        conversation.messages = messages;

        let responseSource;
        if (nonEmptyToolRounds === 0) {
          responseSource = 'llm-knowledge';
        } else if (assistantMessage.content && String(assistantMessage.content).trim()) {
          responseSource = 'mixed';
        } else {
          responseSource = 'tools';
        }

        

        return {
          success: true,
          plan: assistantMessage.content,
          conversationId: convId,
          toolsUsedRounds: toolsUsedCount,
          iterations: iteration,
          isNewConversation: isNew,
          responseSource: responseSource,
          sourceDetails: {
            toolsRequested: toolsUsedCount > 0,
            toolRoundsRequested: toolsUsedCount,
            meaningfulToolRounds: nonEmptyToolRounds,
            totalIterations: iteration,
            note: nonEmptyToolRounds === 0
              ? 'Generated from LLM training knowledge (no meaningful tool data returned)' 
              : responseSource === 'mixed'
                ? `Mixed response: ${nonEmptyToolRounds} meaningful tool round(s) plus LLM knowledge`
                : `Generated using ${nonEmptyToolRounds} meaningful tool round(s)`
          }
        };
      }
    }

    return {
      success: false,
      error: `Exceeded maximum iterations (${maxIterations}). Agent loop did not converge.`,
      conversationId: convId
    };
  } catch (error) {
    console.error('Error creating trip plan:', error);
    return {
      success: false,
      error: error.message || 'Failed to create trip plan',
      conversationId: convId
    };
  }
}

module.exports = { createTripPlan };

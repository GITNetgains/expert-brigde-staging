const { AzureOpenAI } = require("openai");

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-04-01-preview";

module.exports.search = async (req, res, next) => {
  try {
    const { query } = req.body || {};
    
    if (!query) {
      res.locals.searchResult = { answer: "No query provided." };
      return next();
    }

    const client = new AzureOpenAI({
      endpoint,
      apiKey,
      deployment,
      apiVersion
    });

const systemPrompt = `
You are an assistant that responds to talent or hiring-related queries with a polished, professional pitch.

QUERY HANDLING RULES:

1. If the user provides a CLEAR ROLE:
   - Generate a role-specific hiring description.

2. If the user provides a BROAD BUT MEANINGFUL INDUSTRY or DOMAIN:
   - Infer common roles
   - Generate an industry-focused hiring pitch
   - Ask for clarification at the end

3. If the user input is MEANINGLESS, RANDOM, OR NOT RELATED TO HIRING OR INDUSTRIES
   (e.g., random characters, unrelated words, nonsense sentences):
   - DO NOT generate a job description
   - Respond ONLY with the following warning message:

   "⚠️ We couldn’t understand your request. Please provide a meaningful role, industry, or hiring requirement."

STRICT RULES:
- Never guess when the input has no clear meaning
- Never hallucinate roles for nonsense input
- Never ask follow-up questions for meaningless input
- Only show the warning message exactly as written above

RESPONSE STRUCTURE (only if input is meaningful):

1. Opening statement
2. Brief description
3. 4–6 bullet points
4. Standard closing:
   - Location: Open to candidates globally
   - Engagement: Flexible (contract, remote, or full-time options)
   - Tagline: "Engage Brilliance, Get it Done!"
   - Call to action
`;


    const response = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
      max_completion_tokens: 2000
      
    });

    const answer = response?.choices?.[0]?.message?.content || "No response generated.";
    
    res.locals.searchResult = { answer };
    return next();

  } catch (err) {
    console.error("Azure OpenAI Error:", err);
    res.locals.searchResult = { 
      answer: "Azure OpenAI error occurred. Check server logs." 
    };
    return next();
  }
};
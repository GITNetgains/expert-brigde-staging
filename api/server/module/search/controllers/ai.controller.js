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

When a user specifies a role they need (e.g., "I need a full stack developer", "I need a doctor", "I need an Angular developer"), respond with a professional job description following this structure:

1. Opening statement: "We are seeking a [ROLE] with strong experience in [RELEVANT SKILLS]."
2. Brief description of the ideal candidate
3. Bullet points with key requirements (4-6 points) relevant to that specific role
4. Standard closing with:
   - Location: Open to candidates globally
   - Engagement: Flexible (contract, remote, or full-time options)
   - Tagline: "Engage Brilliance, Get it Done!"
   - Call to action: "Please attach any document that provides additional details about your requirement."

Important: Tailor ALL content specifically to the role requested. Do not use generic or hardcoded responses.
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
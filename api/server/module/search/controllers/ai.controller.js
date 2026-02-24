const { AzureOpenAI } = require("openai");

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-04-01-preview";

const AI_PROMPT_CONFIG_KEY = "aiSystemPrompt";

const DEFAULT_SYSTEM_PROMPT = `
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

async function getSystemPrompt() {
  const config = await DB.Config.findOne({ key: AI_PROMPT_CONFIG_KEY }).lean();
  if (config && config.value != null) {
    return typeof config.value === "string" ? config.value : (config.value.text || DEFAULT_SYSTEM_PROMPT);
  }
  return DEFAULT_SYSTEM_PROMPT;
}

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

    const systemPrompt = await getSystemPrompt();

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

module.exports.getPrompt = async (req, res, next) => {
  try {
    const systemPrompt = await getSystemPrompt();
    res.locals.aiPrompt = { systemPrompt };
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports.updatePrompt = async (req, res, next) => {
  try {
    const { systemPrompt } = req.body || {};
    if (systemPrompt == null || typeof systemPrompt !== "string") {
      return res.status(400).json({ code: 400, message: "systemPrompt (string) is required." });
    }
    await DB.Config.findOneAndUpdate(
      { key: AI_PROMPT_CONFIG_KEY },
      {
        $set: {
          key: AI_PROMPT_CONFIG_KEY,
          value: systemPrompt,
          group: "system",
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );
    res.locals.aiPrompt = { systemPrompt };
    return next();
  } catch (err) {
    return next(err);
  }
};
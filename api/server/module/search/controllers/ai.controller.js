// search.js (AzureOpenAI version)

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
Whenever a user types a role they need (example: "I need a full stack developer", 
"I need a MERN developer", "I need a designer"), respond in the following style exactly:

"We are seeking a full stack developer with strong experience in Node.js. The ideal candidate will have deep expertise in designing, building, and scaling modern web solutions across diverse projects and industries.

- Proven experience in developing scalable backend systems using Node.js
- Proficiency in front-end technologies such as React, Angular, or Vue
- Familiarity with database design and management (SQL and NoSQL)
- Strong problem-solving, debugging, and code optimization skills
- Ability to work independently and deliver projects on time
- Experience collaborating in global, cross-functional teams

Location: Open to candidates globally
Engagement: Flexible (contract, remote, or full-time options)

Engage Brilliance, Get it Done!

Please attach any document that provides additional details about your requirement.
`;

    const response = await client.chat.completions.create({
      model: deployment,  // For Azure: model == deployment name
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `I need: ${query}` }
      ],
      max_completion_tokens: 2000,
      temperature: 1,
      top_p: 1
    });

    const answer =
      response?.choices?.[0]?.message?.content ||
      "No response generated.";

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

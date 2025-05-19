import express from "express";
import { Configuration, OpenAIApi } from "openai";

const router = express.Router();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

router.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages,
      temperature: 0.7,
    });

    res.json({ message: completion.data.choices[0].message });
  } catch (error: any) {
    console.error("OpenAI error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router; 
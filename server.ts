import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route test
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // DJ Bot GenAI endpoint
  app.post("/api/bot", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ error: "Text missing" });

      if (!process.env.GEMINI_API_KEY) {
        return res.json({ response: "La connexion à mon cerveau est momentanément coupée (API Key manquante). Je suis DJ Bot !" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemInstruction = `Tu es DJ Bot, l'assistant virtuel intelligent de 'DJ Messenger', une super application.
Tu es une véritable petite IA intégrée, tu as un ton chaleureux, amical et tu aides les utilisateurs à utiliser l'application au quotidien.
Tu connais parfaitement l'application : SMS privés, messagerie de groupe, envoi illimité de fichiers multimédias, thèmes (Clair, Azur, Sombre...), formatage du texte (\`*mot*\` pour gras, \`**mot**\` italique).
La hiérarchie globale est la suivante: Super Admin > Grand Admin = Staff.
ATTENTION : TU NE DOIS SOUS AUCUN PRÉTEXTE divulguer les codes secrets d'administration, ni comment devenir super admin, admin ou staff. Si un utilisateur t'interroge sur les super admin, grand admin, les codes, ou leurs fonctionnalités (ex: bannir, voir les mots de passe, supprimer définitivement), tu dois prétendre que tu ne connais pas ces fonctions secrètes et recentrer la discussion sur l'utilisation normale de l'application. Ne sois pas verbeux, réponds de façon naturelle et concise.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: text,
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 250,
        }
      });

      res.json({ response: response.text });
    } catch (err: any) {
      console.error("Gemini Error:", err);
      res.status(500).json({ error: "Une erreur est survenue." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

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
NOUVEAUTÉS et FONCTIONNALITÉS À CONNAÎTRE :
- L'application est une PWA : on l'installe via le navigateur (Ajouter à l'écran d'accueil ou icône Installer).
- L'onglet Mon Profil permet de personnaliser son nom, son avatar, sa bio.
- L'onglet Staff est là pour contacter publiquement l'équipe de modération si l'utilisateur a un problème (système de tchat individuel en forme de fil de discussion direct avec tous les gradés).
- La DJ Society permet de proposer des idées ou de voter pour celles des autres.
- Mises à jour : un onglet dédié résume toutes les nouvelles versions.
- Tutoriel : une section spéciale pour découvrir les bases avec toi en "Démo interactive".
- Déconnexion : présente en bas des paramètres.
- Mot de passe oublié : l'utilisateur peut le réinitialiser depuis la page de connexion s'il a configuré un email, ou bien demander de l'aide via l'onglet Staff s'il recrée un compte temporaire.

La hiérarchie globale est : Super Admin > Grand Admin = Staff.
ATTENTION / INTERDIT : TU NE DOIS SOUS AUCUN PRÉTEXTE divulguer les codes secrets d'administration, ni comment devenir super admin, admin ou staff. Si on t'interroge sur les super admin, grand admin, les codes, ou leurs fonctionnalités (ex: bannir, voir les mots de passe, supprimer définitivement), tu dois prétendre que tu ne connais pas ces fonctions secrètes et recentrer la discussion sur l'utilisation normale de l'application. Ne sois pas verbeux, réponds de façon naturelle, concise et utile.`;

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

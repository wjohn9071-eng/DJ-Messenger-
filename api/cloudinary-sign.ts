import cloudinary from 'cloudinary';

export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = (process.env.CLOUDINARY_API_KEY || "281391161144684").trim();
    const apiSecret = (process.env.CLOUDINARY_API_SECRET || "p7bfK2vkQtHybRXeAnNyAfcvH3g").trim();
    const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "dfbhvgcbi").trim();

    if (!apiSecret || !apiKey) {
      return res.status(500).json({ error: "Missing Cloudinary credentials on server (Vercel)." });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign: Record<string, any> = { timestamp };

    // Vercel might pass body as string or object
    let uploadPreset = req.body?.upload_preset;
    if (!uploadPreset && typeof req.body === 'string') {
        try {
            uploadPreset = JSON.parse(req.body).upload_preset;
        } catch (e) {}
    }

    if (uploadPreset) {
      paramsToSign.upload_preset = uploadPreset;
    }

    const signature = cloudinary.v2.utils.api_sign_request(
      paramsToSign,
      apiSecret
    );

    return res.status(200).json({
      timestamp,
      signature,
      apiKey,
      cloudName
    });
  } catch (err: any) {
    console.error("[Vercel API] Error generating Cloudinary signature:", err);
    return res.status(500).json({ error: err.message || "Failed to sign" });
  }
}


import { GoogleGenAI } from "@google/genai";
import { ImageResolution, DNAParams } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

/**
 * GOLFDNA PRO - ELITE PHOTOGRAPHY ENGINE
 * High-end rendering specs for sports-luxe fashion.
 * Focus on technical fabrics, skin realism, and championship lighting.
 */
const HIGH_END_GOLF_SPECS = `
  ULTRA-PREMIUM PHOTOGRAPHY PROTOCOL:
  - Camera: Phase One XF with IQ4 150MP, 80mm Schneider Kreuznach lens.
  - Settings: f/8 for deep focus, ISO 50 for zero noise, 1/1000s for crisp movement.
  - Lighting: Global illumination with 3-point studio fill on fairways. Subsurface scattering for realistic skin glow.
  - Color Science: Capture One Pro "Elite Sport" profile. Neutral-warm highlights, deep rich greens, and crisp whites.
  - Post-Processing: High-end frequency separation for skin, micro-contrast enhancement for technical fabrics.
  
  GOLF BRAND INTEGRITY:
  - Aesthetics: Prestigious, elite, professional, and aspirational.
  - Environment: 18th hole championship conditions. Perfectly manicured bentgrass, crystal clear water hazards, and dramatic bunker textures.
  - Material: Focus on "Aero-Tech" golf fabrics. Pique cotton micro-weave, performance polyester sheen, cashmere-blend knitwear, and premium cabretta leather.
  
  MODEL PHYSIQUE (ATHLETIC LOCK):
  - Measurements: Bust 101cm, Waist 67cm, Hips 99cm.
  - Silhouette: Strong core, toned limbs, elegant and powerful golfer's posture.
  - Aesthetic: Sophisticated elite athlete, healthy glow, focused and confident.
  
  GARMENT ANATOMY PROTOCOL:
  - ORIENTATION: Strictly distinguish between FRONT and BACK.
  - FRONT CUES: Fly-front zippers, main buttons, front pleats, and side-entry pockets.
  - BACK CUES: Back pockets with buttons/flaps, yokes, and seat seams.
  - CONSISTENCY: NO front-zippers on back views. NO back-pockets on front views.
`;

export const generateFashionImage = async (
  prompt: string, 
  imageB64s: string[],
  locks: DNAParams,
  imageSize: ImageResolution = "1K",
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "3:4"
) => {
  const ai = getAIClient();
  const model = 'gemini-3-pro-image-preview';

  const dnaLockInstructions = `
    GOLF BRAND INTEGRITY PROTOCOL:
    ${locks.face ? "- GOLFER IDENTITY: Reference 1 is the primary face model. Ensure consistent eye shape and unique facial features." : ""}
    ${locks.body ? "- ATHLETIC PHYSIQUE: Maintain the specific posture and athletic build from Reference 1." : ""}
    ${locks.product ? "- APPAREL ACCURACY: Replicate the golf clothing from all references with 100% detail. Analyze all 6 product images to identify which parts belong to the front and which to the back. Use this mapping to render the garment correctly based on the camera angle." : ""}
    ${locks.pose ? `- GOLFER POSE: The model must be in a ${locks.pose} pose. Ensure the golf club and body orientation match this action naturally.` : ""}
    ${HIGH_END_GOLF_SPECS}
  `;

  const fullPrompt = `${dnaLockInstructions}\n\nSCENE: ${prompt}\n\nNote: For skirts and pants, verify the orientation. Do not put a zipper on the back or back pockets on the front. Maintain the professional tailored look of high-end golf apparel.`;

  const parts: any[] = [{ text: fullPrompt }];
  
  imageB64s.forEach((b64) => {
    const mimeMatch = b64.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const data = b64.replace(/^data:[^;]+;base64,/, "");
    parts.push({ inlineData: { data, mimeType } });
  });

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
    config: {
      imageConfig: { aspectRatio, imageSize },
      tools: [{googleSearch: {}}]
    }
  });

  const candidates = (response as any).candidates;
  if (!candidates || candidates.length === 0) return null;

  for (const part of candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

export const generateModelCollection = async (
  dnaImageB64: string,
  productB64s: string[],
  scenarios: Array<{ angle: string, expression: string, background: string }>,
  locks: DNAParams,
  imageSize: ImageResolution = "1K"
): Promise<string[]> => {
  const results: string[] = [];
  const referenceImages = [dnaImageB64, ...productB64s];

  for (const scene of scenarios) {
    const isBackView = scene.angle.toLowerCase().includes("back");
    const orientationFocus = isBackView 
      ? "Focus on the BACK CONSTRUCTION of the garment. Look for back pockets and seams from the product references. Ensure NO front-zippers or front-buttons are visible."
      : "Focus on the FRONT CONSTRUCTION of the garment. Match the zipper, fly, and front pleats exactly from the product references.";

    const prompt = `Premium Golf Brand Lookbook Shoot.
    FRAME: ${scene.angle}.
    MODEL STATE: ${scene.expression}, elite golfer persona.
    ENVIRONMENT: ${scene.background}.
    GARMENT DIRECTION: ${orientationFocus}
    STYLING: Modern technical golf wear. Ensure the fit is athletic and professional. Lighting must be natural and atmospheric.`;
    
    const result = await generateFashionImage(prompt, referenceImages, locks, imageSize);
    if (result) results.push(result);
  }
  
  return results;
};

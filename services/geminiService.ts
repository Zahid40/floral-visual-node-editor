
import { GoogleGenAI, Modality } from "@google/genai";
import { AspectRatio, NodeData } from '../types';
import { Node } from 'reactflow';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToBase64 = (file: File): Promise<{base64: string, dataUrl: string}> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            resolve({ base64, dataUrl });
        };
        reader.onerror = (error) => reject(error);
    });
};

export const generateFromNodes = async (images: Node<NodeData>[], prompt: string, aspectRatio: AspectRatio, seed?: number) => {
    try {
        const parts: ({ text: string } | { inlineData: { data: string; mimeType: string; } })[] = [];
        let effectivePrompt = prompt;

        if (images.length === 0) {
            // Text-to-image generation
            if (!prompt) {
                throw new Error("A text prompt is required for image generation.");
            }
            // Add aspect ratio to prompt for Nano Banana
            effectivePrompt = `${prompt}, aspect ratio ${aspectRatio}`;
            parts.push({ text: effectivePrompt });
        } else {
            // Multi-modal generation (image + text, or image + image)
            if (images.length > 1 && !prompt) {
                effectivePrompt = "Merge these images into a single, cohesive, professional-looking photograph. Blend the elements, styles, and subjects naturally.";
            }
            
            const textPart = effectivePrompt ? [{ text: effectivePrompt }] : [];
            const imageParts = images.map(n => ({
                inlineData: {
                    data: n.data.content as string,
                    mimeType: n.data.mimeType as string,
                },
            }));
            parts.push(...imageParts, ...textPart);
        }
        
        const config: { responseModalities: Modality[], seed?: number } = {
            responseModalities: [Modality.IMAGE],
        };

        if (seed !== undefined && !isNaN(seed)) {
            config.seed = seed;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config,
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return { b64: part.inlineData.data, mimeType: 'image/png' as const, usageMetadata: response.usageMetadata };
            }
        }

        throw new Error("Image generation failed, no image data in response.");
    } catch (error) {
        console.error("Error generating from nodes:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Failed to generate from node inputs with Gemini API.");
    }
};


export const generatePromptFromImage = async (image: Node<NodeData>) => {
    if (!image.data.content || !image.data.mimeType) {
        throw new Error("Image data is missing for prompt generation.");
    }
    try {
        const imagePart = { inlineData: { data: image.data.content as string, mimeType: image.data.mimeType as string }};
        const textPart = { text: "Describe this image in detail. Focus on the subject, style, composition, colors, and lighting. Formulate the description as a creative and vivid prompt for an AI image generator to recreate a similar image." };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        return { prompt: response.text.trim(), usageMetadata: response.usageMetadata };

    } catch (error) {
        console.error("Error generating prompt from image:", error);
        if (error instanceof Error) throw error;
        throw new Error("Failed to generate prompt from image with Gemini API.");
    }
};

export const enhancePrompt = async (prompt: string) => {
    if (!prompt.trim()) {
        return { enhanced: "", usageMetadata: { totalTokenCount: 0 }};
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `As an expert prompt engineer for AI image generation, rewrite the following user prompt to be more vivid, descriptive, and detailed. Your goal is to maximize the creative potential of the AI. Return ONLY the rewritten prompt, without any introduction, preamble, or explanation.\n\nOriginal prompt: "${prompt}"`,
        });
        return { enhanced: response.text.trim(), usageMetadata: response.usageMetadata };
    } catch (error) {
        console.error("Error enhancing prompt:", error);
        if (error instanceof Error) throw error;
        throw new Error("Failed to enhance prompt with Gemini API.");
    }
};

export { fileToBase64 };

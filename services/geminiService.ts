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

const generateImageWithImagen = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio,
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        } else {
            throw new Error("Image generation failed, no images returned.");
        }
    } catch (error) {
        console.error("Error generating image with Imagen:", error);
        throw new Error("Failed to generate image with Gemini API.");
    }
};

export const generateFromNodes = async (images: Node<NodeData>[], prompt: string, aspectRatio: AspectRatio): Promise<{ b64: string; mimeType: 'image/jpeg' | 'image/png' }> => {
    try {
        if (images.length === 0) {
            // Text-to-image generation
            if (!prompt) {
                throw new Error("A text prompt is required for image generation.");
            }
            const b64 = await generateImageWithImagen(prompt, aspectRatio);
            return { b64, mimeType: 'image/jpeg' };
        }

        // Multi-modal generation (image + text, or image + image)
        let effectivePrompt = prompt;
        if (images.length > 1 && !prompt) {
            effectivePrompt = "Merge these images into a single, cohesive, professional-looking photograph. Blend the elements, styles, and subjects naturally.";
        }
        
        const textParts = effectivePrompt ? [{ text: effectivePrompt }] : [];
        const imageParts = images.map(n => ({
            inlineData: {
                data: n.data.content as string,
                mimeType: n.data.mimeType as string,
            },
        }));

        const parts = [...imageParts, ...textParts];
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return { b64: part.inlineData.data, mimeType: 'image/png' };
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


export const generatePromptFromImage = async (image: Node<NodeData>): Promise<string> => {
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

        return response.text.trim();

    } catch (error) {
        console.error("Error generating prompt from image:", error);
        throw new Error("Failed to generate prompt from image with Gemini API.");
    }
};

export const enhancePrompt = async (prompt: string): Promise<string> => {
    if (!prompt.trim()) {
        return "";
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `As an expert prompt engineer for AI image generation, rewrite the following user prompt to be more vivid, descriptive, and detailed. Your goal is to maximize the creative potential of the AI. Return ONLY the rewritten prompt, without any introduction, preamble, or explanation.\n\nOriginal prompt: "${prompt}"`,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error enhancing prompt:", error);
        throw new Error("Failed to enhance prompt with Gemini API.");
    }
};

export { fileToBase64 };
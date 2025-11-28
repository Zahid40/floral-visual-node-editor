
import { GoogleGenAI, Modality } from "@google/genai";
import { AspectRatio, NodeData } from '../types';
import { Node } from 'reactflow';

const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. Please select an API Key.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

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

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
             const base64data = reader.result as string;
             resolve(base64data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const generateFromNodes = async (model: string, images: Node<NodeData>[], prompt: string, aspectRatio: AspectRatio, seed?: number) => {
    const ai = getAiClient();
    try {
        // Imagen 3 logic
        if (model.includes('imagen')) {
             if (images.length > 0) {
                 console.warn("Imagen models do not natively support image-to-image in this interface. Ignoring image inputs.");
             }
             if (!prompt) {
                 throw new Error("A text prompt is required for Imagen generation.");
             }

             const response = await ai.models.generateImages({
                model,
                prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: aspectRatio,
                },
            });
            
            const b64 = response.generatedImages[0].image.imageBytes;
            return { b64, mimeType: 'image/jpeg', usageMetadata: undefined };
        }

        // Gemini Logic (2.5 Flash, 3 Pro)
        const parts: ({ text: string } | { inlineData: { data: string; mimeType: string; } })[] = [];
        let effectivePrompt = prompt;

        if (images.length === 0) {
            if (!prompt) {
                throw new Error("A text prompt is required for image generation.");
            }
            if (model.includes('flash')) {
                 effectivePrompt = `${prompt}, aspect ratio ${aspectRatio}`;
                 parts.push({ text: effectivePrompt });
            } else {
                 parts.push({ text: prompt });
            }
        } else {
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
        
        const config: any = {
            responseModalities: [Modality.IMAGE],
        };

        if (seed !== undefined && !isNaN(seed)) {
            config.seed = seed;
        }

        if (model.includes('pro-image')) {
            config.imageConfig = {
                aspectRatio: aspectRatio,
            };
        }

        const response = await ai.models.generateContent({
            model: model,
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

export const generateVideo = async (model: string, prompt: string, image?: Node<NodeData>, aspectRatio: AspectRatio = '16:9') => {
    const ai = getAiClient();
    try {
        if (!prompt && !image) {
             throw new Error("A text prompt or an image is required for video generation.");
        }

        // Veo only supports 16:9 and 9:16
        const safeAspectRatio = (aspectRatio === '9:16' || aspectRatio === '16:9') ? aspectRatio : '16:9';
        
        const config: any = {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: safeAspectRatio,
        };

        const params: any = {
            model: model,
            prompt: prompt || "Generate a video", // Prompt is technically optional if image provided for some models, but usually required.
            config,
        };

        if (image && image.data.content && image.data.mimeType) {
            params.image = {
                imageBytes: image.data.content.split(',')[1],
                mimeType: image.data.mimeType,
            };
        }

        let operation = await ai.models.generateVideos(params);

        // Polling loop
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({operation: operation});
        }

        if (operation.error) {
            throw new Error(`Video generation failed: ${operation.error.message}`);
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("No video URI returned.");
        }

        // Fetch the video content
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!videoResponse.ok) {
            throw new Error(`Failed to download video: ${videoResponse.statusText}`);
        }

        const videoBlob = await videoResponse.blob();
        const base64DataUrl = await blobToBase64(videoBlob);
        
        // Video ops don't return standard usage metadata in the op response usually
        return { dataUrl: base64DataUrl, mimeType: 'video/mp4' };

    } catch (error) {
         console.error("Error generating video:", error);
         if (error instanceof Error) throw error;
         throw new Error("Failed to generate video.");
    }
};

export const generatePromptFromImage = async (image: Node<NodeData>) => {
    const ai = getAiClient();
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
    const ai = getAiClient();
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

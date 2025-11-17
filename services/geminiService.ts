
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ProductInfo } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const productInfoSchema = {
  type: Type.OBJECT,
  properties: {
    productName: {
      type: Type.STRING,
      description: "A plausible, creative name for the product."
    },
    productDescription: {
      type: Type.STRING,
      description: "A short, engaging description for the product."
    },
    prices: {
      type: Type.ARRAY,
      description: "A list of up to 5 fictional online stores with their prices.",
      items: {
        type: Type.OBJECT,
        properties: {
          store: { type: Type.STRING, description: "The name of the online store." },
          price: { type: Type.NUMBER, description: "The price of the product." },
          url: { type: Type.STRING, description: "A plausible URL for the product page." },
        },
        required: ['store', 'price', 'url'],
      },
    },
  },
  required: ['productName', 'productDescription', 'prices'],
};

const tagsSchema = {
  type: Type.OBJECT,
  properties: {
    tags: {
      type: Type.ARRAY,
      description: "A list of 10 relevant and effective tags for the product.",
      items: {
        type: Type.STRING,
        description: "A single product tag."
      }
    }
  },
  required: ['tags'],
};

export const fetchProductInfoAndPrices = async (barcode: string, productName?: string): Promise<ProductInfo> => {
  try {
    const prompt = `You are a product information simulator.
    The user has provided the following information:
    - Barcode: "${barcode}"
    ${productName ? `- Product Name: "${productName}"` : ''}

    Your task is to act as a product information and price comparison engine.
    1. If a product name is provided, use it. If not, invent a plausible product name based on the barcode.
    2. Provide a brief, engaging description for the product.
    3. Find and list up to 5 fictional online stores with their lowest prices and plausible URLs for this product.
    
    Respond strictly in JSON format according to the provided schema. Be creative with the product details.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: productInfoSchema,
      },
    });

    const jsonString = response.text.trim();
    const productData = JSON.parse(jsonString);
    
    // Ensure prices array has at most 5 items
    if (productData.prices && productData.prices.length > 5) {
        productData.prices = productData.prices.slice(0, 5);
    }
    
    return productData as ProductInfo;
  } catch (error) {
    console.error("Error fetching product info:", error);
    throw new Error("Failed to fetch product information. Please check the barcode and try again.");
  }
};

export const generateBannerImage = async (productName: string, price: number): Promise<string> => {
    try {
        const prompt = `Create an eye-catching promotional banner for an e-commerce website. The product is "${productName}". The price is "${price.toLocaleString()}원". The banner should be vibrant, modern, and professional, designed to attract customers. The price should be prominent and easy to read.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const firstPart = response.candidates?.[0]?.content?.parts?.[0];
        if (firstPart && firstPart.inlineData) {
            const base64ImageBytes = firstPart.inlineData.data;
            return `data:${firstPart.inlineData.mimeType};base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image data received from API.");
        }
    } catch (error) {
        console.error("Error generating banner image:", error);
        throw new Error("Failed to generate the promotional banner. Please try again later.");
    }
};

export const generateProductTags = async (productName: string, productDescription: string): Promise<string[]> => {
  try {
    const prompt = `Generate exactly 10 optimal, SEO-friendly tags for the following product. The tags should be relevant, concise, and useful for e-commerce listings and marketing.
    Product Name: "${productName}"
    Description: "${productDescription}"
    Respond strictly in JSON format according to the provided schema.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: tagsSchema,
      },
    });

    const jsonString = response.text.trim();
    const tagsData = JSON.parse(jsonString);
    
    if (tagsData.tags && Array.isArray(tagsData.tags)) {
        return tagsData.tags.slice(0, 10); // Ensure exactly 10 tags
    }
    
    throw new Error("Invalid tag format received from API.");
  } catch (error) {
    console.error("Error generating product tags:", error);
    throw new Error("Failed to generate product tags. Please try again.");
  }
};

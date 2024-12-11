const axios = require("axios");

export const translateText = async (text, sourceLang, targetLang) => {
  try {
    const response = await axios.get(
      `https://apertium.org/apy/translate?langpair=${sourceLang}|${targetLang}&q=${encodeURIComponent(text)}`
    );
    return response.data.responseData.translatedText;
  } catch (error) {
    console.error("Error during translation:", error);
    return text; 
  }
};



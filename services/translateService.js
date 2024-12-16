const axios = require("axios");

const translateText = async (text, sourceLang, targetLang) => {
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


 const  translateJob = async (job, lang) => {
  try {
    return {
      ...job._doc,
      title: await translateText(job.title, "en", lang),
      description: await translateText(job.description, "en", lang),
      pricingPlan: {
        basic: {
          title: await translateText(job.pricingPlan.basic.title, "en", lang),
          description: await translateText(job.pricingPlan.basic.description, "en", lang),
        },
        premium: {
          title: await translateText(job.pricingPlan.premium.title, "en", lang),
          description: await translateText(job.pricingPlan.premium.description, "en", lang),
        },
        pro: {
          title: await translateText(job.pricingPlan.pro.title, "en", lang),
          description: await translateText(job.pricingPlan.pro.description, "en", lang),
        },
      },
      addons: {
        title: await translateText(job.addons.title, "en", lang),
      },
      faqs: await Promise.all(
        job.faqs.map(async (faq) => ({
          question: await translateText(faq.question, "en", lang),
          answer: await translateText(faq.answer, "en", lang),
        }))
      ),
      whyChooseMe: await translateText(job.whyChooseMe, "en", lang),
    };
  } catch (error) {
    console.error("Error translating job:", error);
    // throw new Error("Translation failed");
    return job
  }
};

const translateReviews = async (reviews, lang) => {
  try {
    return await Promise.all(
      reviews.map(async (review) => ({
        ...review,
        desc: await translateText(review.desc,'en',lang),
      }))
    );
  } catch (error) {
    console.error("Error during reviews translation:", error);
    return reviews; // Return the original reviews if translation fails
  }
};

module.exports={
  translateJob,translateReviews
};
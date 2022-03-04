module.exports = function getLanguageDescriptionFromLanguageCode(langaugeCode) {
    languages = {
        "en": "English",
        "sw": "Swahili",
        "es": "Spanish",
        "cy": "Welsh",
        "mg": "Malagasy",
        "fr": "French",
        "hi": "Hindi"
    }
    return languages[langaugeCode] || "un-noted language"
}
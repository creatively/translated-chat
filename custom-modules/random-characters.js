
// Gets a 'number' of random lowercase or numeric characters
// No. of combinations available per 'number' are :
// 1    35
// 2    1,225
// 3    42,875
// 4    1,500,625
// 5    52 million
// 6    1.8 billion
// 7    64 billion

module.exports = function getRandomCharacters(number) {
    result = '';
    do {
        const randomCharacterCode = Math.floor(Math.random() * 123);
        if (randomCharacterCode > 96 && randomCharacterCode < 123 ||
            randomCharacterCode > 47 && randomCharacterCode < 58) {
            const randomCharacter = String.fromCharCode(randomCharacterCode);
            result += randomCharacter;
        }
    } while (result.length < number);
    return result;
}

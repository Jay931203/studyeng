import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('C:/Users/hyunj/studyeng/src/data/subtitle-fix-batches/fix-9.json', 'utf8'));

// Compute vhhgI4tSMwc capitalization fixes
const segsAll = data['vhhgI4tSMwc'];
const segKeys = Object.keys(segsAll).map(Number).sort((a, b) => a - b);

// Words that should NOT be lowercased even when continuing a sentence
// (proper nouns, place names, etc.)
const skipWords = new Set(['United', 'Berkeley', 'Alex', 'Emma', 'Tai', 'Alex\'s', 'Emma\'s']);

const vhhgFixes = {};
for (let i = 1; i < segKeys.length; i++) {
    const prevKey = segKeys[i - 1];
    const currKey = segKeys[i];
    const prevText = segsAll[prevKey.toString()];
    const currText = segsAll[currKey.toString()];

    const prevTrimmed = prevText.trimEnd();
    const prevLastChar = prevTrimmed[prevTrimmed.length - 1];
    // If previous segment does NOT end with sentence-ending punctuation, current is a continuation
    const isContinuation = !['.', '!', '?'].includes(prevLastChar);

    if (isContinuation) {
        const firstChar = currText[0];
        if (firstChar >= 'A' && firstChar <= 'Z') {
            const firstWord = currText.split(/\s/)[0].replace(/[^a-zA-Z0-9']/g, '');

            // Skip standalone 'I'
            if (firstWord === 'I') continue;
            // Skip all-caps acronyms (e.g., PhD)
            if (firstWord === firstWord.toUpperCase() && firstWord.length > 1 && !/\d/.test(firstWord)) continue;
            // Skip known proper nouns
            if (skipWords.has(firstWord)) continue;

            const fixed = firstChar.toLowerCase() + currText.slice(1);
            vhhgFixes[currKey.toString()] = fixed;
        }
    }
}

console.log('vhhgI4tSMwc fixes:', Object.keys(vhhgFixes).length);

// Build the full result
const result = {
    "_MOavH-Eivw": {},
    "e-P5IFTqB98": {},
    "UNP03fDSj1U": {},
    "2D2TLWLu43Q": {
        "1": "They asked me to host the Golden Globes. They said do your thing, just please don't",
        "3": "They said no, unless you get Gwyneth Paltrow. So I tracked down Goof, showed up on her",
        "4": "stoop. She called the cops, so I'll go it alone",
        "5": "So I'm here singing, still committing. Just like Chalamet"
    },
    "3bQXPUQqn9Y": {},
    "C3DlM19x4RQ": {},
    "cii6ruuycQA": {},
    "fyaI4-5849w": {
        "0": "When I get like this, I can't be around you. I'm too lit to dim down the night",
        "3": "Wild, wild, wild. When I'm with you, all I get is wild thoughts",
        "13": "I know I get wild, wild, wild. Wild, wild, wild thoughts",
        "14": "Wild, wild, wild. When I'm with you, all I get is wild thoughts"
    },
    "M7Is43K6lrg": {},
    "nGt_JGHYEO4": {},
    "RRBoPveyETc": {},
    "sVyQ-fz3VTs": {},
    "TAqo-NZDuys": {
        "0": "Michael came up with in Sudden Valley just sort of implies that something awful could happen all of a sudden.",
        "1": "You know, plus it's on a hill. What are you taking stupid pills? Come on. Save us some money.",
        "2": "This was a management tool that he used to keep Michael working for his approval. That was a hard one to say no to.",
        "3": "The only thing I asked is out of the 450 homes rebuilt one be given to a disadvantaged family from the inner city.",
        "7": "One of this guy's eyebrows just fell in the bowl of candy beans. I always carry a spare.",
        "9": "I'm very impressed with the offer and I'm gonna run it upstairs. See what kind of reaction it gets.",
        "11": "Michael hoped to impress his father. I think it all sounds pretty good. Pretty good. It was horrible."
    },
    "teT2x1a6hL8": {
        "0": "It means you always go first. You're poppycock. You're the Prince of Wales. You're born to go first.",
        "5": "Trust me, you don't know the half of it. I know more than you think.",
        "6": "People talk. The staff and I was very saddened",
        "7": "horrified by what I learned. So what do you want from me?",
        "8": "To be heard. I'm listening.",
        "9": "No more than that. To be understood. Appreciated."
    },
    "uH1aDCjypKg": {},
    "wcW8SvbnJYE": {
        "0": "Way down in Louisiana, down in New Orleans. Way back up in the woods among the evergreens",
        "1": "There stood a log cabin made of earth and wood. Where lived a country boy named Johnny B. Goode",
        "2": "Who never ever learned to read or write so well. He could play a guitar just like he's ringing a bell"
    },
    "xPGdOXstSyk": {},
    "ypu-k0yMYgg": {},
    "zejK1XHIDcI": {},
    "lEXBxijQREo": {},
    "PY9HTSBXE8s": {},
    "xVVwNzx7elE": {},
    "hY-Rzou38k4": {},
    "2tM1LFFxeKg": {},
    "6U4-KZSoe6g": {
        "0": "Why don't you let me fix you some of this new mococo drink all natural cocoa beans from the upper slopes of Mount Nicaragua.",
        "2": "Who are you talking to? I've tasted other Cocos. This is the best.",
        "7": "Dice me, slice me or peel me. There's so many choice.",
        "8": "Who are you talking? I didn't say anything.",
        "9": "I didn't say anything. No, I didn't talk. I wasn't talking to anybody."
    },
    "8aDGKxN1nLo": {
        "0": "Go and work for your grandfather and make something of yourself, not playing fair.",
        "5": "First time I met Fred, that's right.",
        "8": "He's in London on business, he'll be back in a few weeks.",
        "9": "Don't marry him."
    },
    "9fdAt0ke9w8": {},
    "iG9CE55wbtY": {
        "2": "It's been I've been blown away by the whole thing. In fact, I'm leaving.",
        "3": "There have been three themes have no running through the conference.",
        "4": "which are relevant to what I want to talk about. One is the",
        "5": "extraordinary evidence of human creativity in all of the presentations that we've had and and in all the people here.",
        "6": "Just the variety of it in the range of it.",
        "8": "In terms of the future, no idea how this may play out. I have an interest in education."
    },
    "JNctAdr7jy4": {
        "0": "fancy dress for it? I've got to make an impression, darling. You look like an"
    },
    "ye5BuYf8q4o": {},
    "yOgAbKJGrTA": {},
    "f36vIp_d2C0": {},
    "vhhgI4tSMwc": vhhgFixes,
    "7yDmGnA8Hw0": {},
    "9gk_rl3y_SU": {},
    "Ae829mFAGGE": {},
    "dqONk48l5vY": {},
    "Es6PBea8fzM": {},
    "IhuwS5ZLwKY": {},
    "IiVDtNjORbY": {
        "2": "Well, you, originally you had SEAL Team 1, SEAL Team 2. Right."
    },
    "jHPOzQzk9Qo": {},
    "J_lEs4FYkhs": {
        "0": "Why are you getting so upset? This is not about you. Yes, it is.",
        "1": "You are a human affront to all women and I am a woman.",
        "3": "think they have an okay time.",
        "9": "What are you saying, that they fake orgasm? It's possible.",
        "13": "It's just that all men are sure it never happened to them and most women at one time or another have done it."
    },
    "kxjwb5cXTI0": {
        "0": "So long, farewell, au revoir, auf Wiedersehen. I'd like to stay and taste my first champagne.",
        "2": "So long, farewell, auf Wiedersehen, goodbye. I leap and heave a sigh and say goodbye."
    },
    "RDocnbkHjhI": {},
    "v2AC41dglnM": {},
    "vDuBWmYBCwE": {},
    "sbCvQbBi2G8": {},
    "TWZKw_MgUPI": {
        "2": "We've got to get the melody, we're gonna bring it till the end, come on now. Does it matter?",
        "9": "Baby, you can't stop. Can't stop. This is all you got. Come on now. This be sweet.",
        "10": "Dirty pop, baby, baby, you can't stop. I know you like this. Dirty pop. This be sweet."
    },
    "5JD6ejmlpa8": {
        "0": "You take an inch, I run a mile. Can't win, you're always right behind me.",
        "3": "Caught in a craze, it's just a phase. Or will this be around forever?"
    },
    "qRv7G7WpOoU": {},
    "Xr6uNyo8Qgg": {},
    "4RaWAQIBZ2I": {},
    "gCZBY7a8kqE": {},
    "SZpiiixlHWY": {},
    "Td67kYY9mdQ": {},
    "KKNCiRWd_j0": {},
    "nCwwVjPNloY": {},
    "ZRWeZzN9nmQ": {},
    "jpj7rqTgy1k": {},
    "-Koj9hvcBMk": {}
};

// Verify all video IDs from input are present
const inputVids = Object.keys(data);
const resultVids = Object.keys(result);
const missing = inputVids.filter(v => !resultVids.includes(v));
const extra = resultVids.filter(v => !inputVids.includes(v));
console.log('Missing from result:', missing);
console.log('Extra in result:', extra);
console.log('Total videos:', resultVids.length);

writeFileSync('C:/Users/hyunj/studyeng/src/data/subtitle-fixes/fix-9.json', JSON.stringify(result, null, 2), 'utf8');
console.log('Written successfully.');

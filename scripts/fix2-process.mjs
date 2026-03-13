import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';

const data = JSON.parse(readFileSync('C:/Users/hyunj/studyeng/src/data/subtitle-fix-batches/fix-2.json', 'utf8'));

// ── helpers ──────────────────────────────────────────────────────────────
function fixI(t) {
  return t
    .replace(/\bi\b/g, 'I')
    .replace(/\bi've\b/g, "I've")
    .replace(/\bi'm\b/g, "I'm")
    .replace(/\bi'd\b/g, "I'd")
    .replace(/\bi'll\b/g, "I'll");
}

function verifyWords(idx, orig, fixed) {
  // Strip all punctuation and spaces (to handle "ma am" -> "ma'am" contraction restorations)
  const norm = s => s.replace(/[.,!?:;"'\u201C\u201D\u2018\u2019\-\s]/g,'').toLowerCase();
  if (norm(orig) !== norm(fixed)) {
    console.error(`WORD CHANGE at ${idx}:\n  ORIG : ${orig}\n  FIXED: ${fixed}`);
  }
}

// ── result object ─────────────────────────────────────────────────────────
const result = {};

function applyFixes(vid, manualFixes) {
  const segs = data[vid];
  const out = {};
  for (const [idx, fixed] of Object.entries(manualFixes)) {
    const orig = segs[idx];
    if (orig === undefined) { console.error(`Missing seg ${idx} in ${vid}`); continue; }
    verifyWords(`${vid}[${idx}]`, orig, fixed);
    if (fixed !== orig) out[idx] = fixed;
  }
  result[vid] = out;
}

// ═════════════════════════════════════════════════════════════════════════
// eD0oskR19oE – rap lyrics, lines naturally lack end punct, leave as-is
result['eD0oskR19oE'] = {};

// ═════════════════════════════════════════════════════════════════════════
// eIho2S0ZahI – TED talk (Julian Treasure)
applyFixes('eIho2S0ZahI', {
  0:  "The human voice, it's the instrument we all play.",
  1:  "It's the most powerful sound in the world, probably. It's the only one that",
  2:  "can start a war or say I love you, and yet many people",
  3:  "have the experience that when they speak,",
  4:  "people don't listen to them. Why is that?",
  5:  "How can we speak powerfully?",
  6:  "To make change in the world. What I'd like to suggest, there are a number of",
  7:  "habits that we need to move away from. I've assembled for your pleasure here seven",
  8:  "deadly sins of speaking. I'm not pretending this is an exhaustive",
  9:  "list, but these seven, I think, are pretty large",
  10: "habits that we can all fall into.",
  11: "First, gossip: speaking ill of somebody",
  12: "who's not present. Not a nice habit, and we know perfectly",
  13: "well, the person gossiping five minutes later will be gossiping",
  14: "about us.",
  15: "Second, judging. We know people who are like this in conversation, and it's very",
  16: "hard to listen to somebody if you know that you're being judged and",
  17: "found wanting.",
  18: "At the same time, third, negativity.",
  19: "You can fall into this. My mother, in the last years of her life, became very, very",
  20: "negative, and it's hard to listen. I remember one day I said to her,",
  21: "\"It's October the first today,\" and she",
  22: "said, \"I know, isn't it dreadful?\"",
  23: "It's hard to listen when somebody's that negative.",
  24: "And another form of negativity:",
  25: "complaining. Well, this is the national",
  26: "art of the uk. It's it's our national sport. We complain about the weather,",
  27: "about sport, about politics, about everything.",
  28: "But actually, complaining is viral misery.",
  30: "lightness in the world.",
  31: "Excuses. We've all met this guy, maybe.",
  32: "We've all been this guy. Some people have a blame thrower:",
  33: "they just pass it on to everybody else and don't take responsibility for their",
  34: "actions, and again, hard to listen to somebody who's being like that.",
  35: "Penultimate, the six of the seven:",
  36: "Embroidery, exaggeration. It demeans our language.",
  37: "Actually, sometimes, for example, if I see something that",
  38: "really is awesome, what do I call it?",
  39: "And then, of course, this exaggeration becomes lying, out and out lying, and we",
  40: "don't want to listen to people we know",
  41: "are lying to us.",
  42: "And finally, dogmatism:",
  43: "the confusion of facts with opinions.",
  44: "When those two things get conflated, you're listening into the wind, you know.",
  46: "opinions, as if they were true. It's difficult to listen to that. So here",
  47: "they are, seven deadly sins of speaking. These are",
  48: "things I think we need to avoid.",
  49: "But is there a positive way to think?",
  50: "About this? Yes, there is. I'd like to suggest that there are four",
  51: "really powerful cornerstones, foundations that we can",
  54: "Fortunately, these things spell a word. The word is hail, and it has a great",
  55: "definition as well. I'm not talking about the stuff that falls from the sky and hits you on",
  56: "the head. I'm talking about this definition, to greet or acclaim,",
  57: "enthusiastically, which is, I think, how our words will be received",
  58: "if we stand on these four things. So what",
  59: "do they stand for?",
  60: "See if you can guess. The H: honesty.",
  61: "Of course, being true in what you say.",
  62: "Being straight and clear. The A is authenticity, just being",
  63: "yourself. A friend of mine described it as standing in your own truth, which I think",
  64: "is a lovely way to put it. The I is integrity, being your word,",
  65: "actually doing what you say, and being somebody people can trust. And",
  66: "the L:",
  67: "is love. I don't mean romantic love,",
  68: "but I do mean wishing people well, for",
  69: "two reasons. First of all, I think absolute honesty may not be what we want.",
  70: "I mean, my goodness, you look ugly this",
  71: "morning.",
  72: "Perhaps that's not necessary.",
  73: "Tempered with love, of course, honesty is a great thing.",
  74: "But also, if you're really wishing somebody well,",
  75: "it's very hard to judge them at the same time. I'm not even sure you can do those",
  76: "two things.",
  77: "Simultaneously. So, hail.",
  78: "Also now, that's what you say, and it's like the old song: it is what you say,",
  79: "it's also the way that you say it. You have an amazing toolbox, this",
  80: "instrument, is incredible, and yet this is a toolbox that very few",
  81: "people have ever opened. I'd like to have a little rummage in there with you now and just pull a few",
  82: "tools out that you might like to take away and play with,",
  84: "speaking. Register, for example.",
  85: "Now, falsetto register may not be very",
  86: "useful most of the time, but there's a register in between. I'm",
  87: "not going to get very technical about this. For any of you who are voice coaches,",
  88: "you can locate your voice. However, so if I talk up here in my nose, you can hear",
  89: "the difference. If I go down here in my throat, which is where",
  90: "most of us speak from, most of the time, but",
  91: "if you want weight, you need to go down here to the chest.",
  92: "You hear the difference. We vote for",
  93: "politicians with lower voices. It's true, because we",
  94: "associate,",
  95: "depth with power and with authority.",
  96: "That's register, and we have tamba. It's the",
  97: "the way your voice feels. Again, the research shows that we prefer voices",
  99: "smooth, warm, like hot chocolate.",
  100: "Well, if that's not you, that's not the end of the world,",
  101: "because you can train. Go get a voice coach, and there are amazing things you",
  102: "can do with breathing, with posture, and with exercises to improve the timbre",
  103: "of your voice. Then prozody. I love prozadie. This is the",
  104: "sing-song, the meta language that we use in order to impart meaning.",
  105: "It's root one for meaning in conversation. People who speak all on",
  106: "one note are really quite hard to listen to, if",
  107: "they don't have any prosody at all. That's where the word monotonic comes",
  108: "from, or monotonous.",
  109: "Monotone. Also, we have repetitive",
  110: "president, now coming in, where every sentence ends as if it were",
  111: "a question, when it's actually not a question. It's a statement.",
  112: "And if you repeat that one over and over, it's actually restricting your ability",
  113: "to communicate through prosidy, which I",
  114: "think is a shame.",
  115: "So let's try and break that habit.",
  116: "Pace. I can get very, very excited by",
  117: "saying something really, really quickly,",
  118: "or I can slow right down to emphasize,",
  119: "and at the end of that, of course, is our",
  120: "old friend, silence.",
  121: "There's nothing wrong with a bit of silence in a talk, is there?",
  123: "ours.",
  124: "Can be very powerful. Of course, pitch",
  125: "often goes along with pace to indicate arousal, but you can do it just with pitch.",
  126: "Where did you leave my keys? Where did you leave my keys?",
  128: "those two deliveries.",
  129: "And finally, volume. I can get really",
  130: "excited by reusing volume. Sorry about that. If I",
  131: "startled anybody.",
  132: "Or I can have you really pay attention",
  133: "by getting very quiet. Some people broadcast the whole time. Try",
  134: "not to do that. That's called sod casting:",
  135: "imposing your sound on people around you,",
  136: "carelessly and inconsiderately. Not nice, of course.",
  137: "Where this all comes into play, most of all, is when you've got something really",
  138: "important to do. It might be standing on a stage like this and giving a talk to",
  139: "people. It might be proposing marriage, asking",
  140: "for a raise,",
  141: "a wedding speech, whatever it is. If it's",
  142: "really important, you owe it to yourself",
  144: "that it's going to work on. And no engine",
  145: "works well without being warmed up.",
  146: "Warm up your voice, actually. Let me show you how to do that. Would you all like to",
  147: "stand up for a moment? I'm going to show you the",
  149: "that I do before every talk I ever do.",
  151: "important, do these first. Arms up,",
  152: "Deep breath in and and sigh out.",
  153: "Very good. Now we're going to warm up our lips, and we're going to go",
  154: "very good. And now,",
  155: "just like when you were a kid. Now, your lips should be coming alive.",
  156: "We're going to do the tongue next, with exaggerated",
  157: "Beautiful. You're getting really good at this. And then, rolling our",
  158: "that's like champagne for the tongue.",
  159: "Finally, and if I can only do one, the pros call this the siren. It's really",
  160: "good. It starts with we.",
  162: "always low. So we go:",
  163: "Fantastic. Give yourselves a round of",
  164: "applause. Take a seat. Thank you.",
  165: "Next time you speak, do those in advance. Now let me just put this in context to",
  166: "close. This is a serious point here. This is",
  167: "where we are now, right. We speak not very well,",
  168: "into people who simply aren't listening, in an environment that's all about noise",
  169: "and bad acoustics. I have talked about that on this stage in",
  170: "different phases. What would the world be like if we were",
  171: "speaking powerfully to people who were listening consciously,",
  177: "world that does sound beautiful,",
  178: "and one where understanding would be the",
  179: "norm. And that is an idea worth spreading.",
  180: "Thank you.",
});

// ═════════════════════════════════════════════════════════════════════════
// eiyfwZVAzGw – single fragment, no fix needed
result['eiyfwZVAzGw'] = {};

// ═════════════════════════════════════════════════════════════════════════
// ekzHIouo8Q4 – song (Maroon 5 "Payphone"-adjacent, actually "When I Was Your Man")
// Lines naturally lack end punct as lyrics – leave as-is
result['ekzHIouo8Q4'] = {};

// ═════════════════════════════════════════════════════════════════════════
// ELZNClmKX1E – country song lyrics – leave as-is
result['ELZNClmKX1E'] = {};

// ═════════════════════════════════════════════════════════════════════════
// eNvUS-6PTbs – song, run-together lines typical of lyric transcription
applyFixes('eNvUS-6PTbs', {
  0: "A wife can't be so strong. Take a chance for a man. Take my heart, I",
  1: "need you so. There's no time I'll ever go.",
  2: "Sherry, Sherry lady, going through a motion. Love is where you find",
  3: "it. Listen to your heart. Sherry, Sherry lady, living in devotion.",
  4: "It's always like the first time. Let me take you for a ride. Sherry, Sherry lady,",
  5: "life has no tomorrow. Take my heart, don't lose it. Listen to your heart.",
  6: "Sherry, Sherry lady, to know you is to love you. If you love me,",
  7: "baby, it will be always right.",
  8: "Thanks for watching.",
});

// ═════════════════════════════════════════════════════════════════════════
// Eo-KmOd3i7s – *NSYNC "Bye Bye Bye" lyrics – leave as-is
result['Eo-KmOd3i7s'] = {};

// ═════════════════════════════════════════════════════════════════════════
// ep-ieEG06qg – Pursuit of Happyness dialogue
applyFixes('ep-ieEG06qg', {
  0: "a 40 pound gizmo for over a month. He said, \"You're smart.\" \"I like to think so.\" And",
  1: "you want to learn this business? \"Yes sir, I want to learn this business.\" \"Have you already started learning on your own?\" \"Absolutely.\"",
  2: "\"Jay?\" \"Yes sir.\"",
  3: "\"How many times have you seen Chris?\" \"Oh, I don't know. One too many, apparently.\"",
  4: "\"Was he ever dressed like this?\" \"No.\" \"No?\" \"Jacket and tie.\"",
  5: "\"First in your class?\" \"In school.\"",
  6: "\"High school?\" \"Yes sir.\" \"How many in the class?\"",
  7: "\"Twelve. It was a small town.\"",
  8: "\"I'll say. But I was also first in my radar class in the Navy. And that was a class of 20.\"",
  9: "\"Can I say something?\"",
  10: "\"I'm the type of person, if you ask me a question and I don't know the answer,\"",
  11: "\"I'm going to tell you that I don't know. But I bet you what, I know how to find the answer.\"",
});

// ═════════════════════════════════════════════════════════════════════════
// eVFd46qABi0 – fragments, nothing fixable
result['eVFd46qABi0'] = {};

// ═════════════════════════════════════════════════════════════════════════
// Exy0UATpXtY – Supernatural fan poem/song, no end punct by style
result['Exy0UATpXtY'] = {};

// ═════════════════════════════════════════════════════════════════════════
// fbcUl7GhCTg – "City of Stars" (La La Land)
applyFixes('fbcUl7GhCTg', {
  0: "City of stars,",
  1: "there's so much that I can't see.",
  2: "Who knows? Is this the start of something wonderful",
  3: "anew,",
  4: "or one more dream that I",
  5: "cannot make true?",
  6: "City of stars, just one thing everybody wants.",
  7: "There in the bars, or through the smokescreen of the crowded",
  8: "restaurants.",
  9: "It's love. Yes, all we're looking for is love from someone",
  10: "else.",
});

// ═════════════════════════════════════════════════════════════════════════
// fh3_g8NJc58 – comedy sketch (drunk driving / kill streak)
applyFixes('fh3_g8NJc58', {
  0: "who are you? What... what do you remember about last night? I went out, went to a",
  1: "bar, had a few shots in it, and I blacked out. You decide to drive home last night?",
  2: "You went through a pedestrian crossing and killed a family of three. Oh my God.",
  3: "I'm obliged to tell you that you are under arrest. Oh my God. Really? I'm also",
  4: "obliged to give you this. It's a tactical UAV. You get it for a three kill streak.",
  5: "Two more, you would have gotten a predator missile, and that would have been really cool.",
});

// ═════════════════════════════════════════════════════════════════════════
// FizqEuhUiB8 – Shawshank-style prison scene
applyFixes('FizqEuhUiB8', {
  0: "On your feet. Face the wall.",
  1: "Right there.",
  2: "Forward. Contraband.",
  3: "Pleased to see you reading this. Any favorite passages?",
  4: "\"Watch ye therefore, for ye know not when the master of the house cometh.\"",
  5: "Mark 1535.",
});

// ═════════════════════════════════════════════════════════════════════════
// fjoO5927p80 – Mean Girls narration
applyFixes('fjoO5927p80', {
  0: "about everyone. That's why her hair is so big, it's full of secrets.",
  1: "An evil takes a human form in Regina George. Don't be fooled, because she may seem like your typical",
  2: "selfish, backstabbing slut faced ho bag, but in reality she is so much more than that. She's",
  3: "the Queen Bee, the star. Those other two are just her little workers. Regina George. How do I",
  4: "even begin to explain Regina George? Regina George is flawless. She has two Fendi purses and",
  5: "a silver Lexus. I hear her hair is insured for 10 000. I hear she does car commercials in Japan. Her",
  6: "favorite movie is Varsity Blues. One time she met John Stamos on a plane, and he told her she was pretty. One time she",
  7: "punched me in the face.",
  8: "It was awesome. She always looks fierce. She always wins Spring Fling Queen. Who cares? I",
  9: "care. Every year the seniors throw this dance for the underclassmen called the Spring Fling, and whosoever is elected Spring",
  10: "Fling King and Queen automatically becomes head of the Student Activities Committee, and since I am an active member of the Student Activities Committee,",
});

// ═════════════════════════════════════════════════════════════════════════
// fLexgOxsZu0 – "The Lazy Song" (Bruno Mars) lyrics – leave as-is
result['fLexgOxsZu0'] = {};

// ═════════════════════════════════════════════════════════════════════════
// fLJsdqxnZb0 – Shawn Achor TED talk (positive psychology)
applyFixes('fLJsdqxnZb0', {
  4:  "Years older than her now, but but at the time, that meant she had to do everything",
  5:  "that I wanted to do. And I wanted to play war. So we were up on top of our bunk",
  9:  "my sister's Milo's and ponies, and ready for a cavalry charge. There are differing",
  10: "accounts of what actually happened that afternoon, but since my sister is not",
  13: "my sister's a little bit on the clumsy side, and somehow, without any help or",
  14: "push from her older brother at all, suddenly Amy disappeared off of the top",
  15: "of the bunk bed and landed with this crash on the floor, and I nervous Lee",
  16: "peered over the side of the bed to see what had befallen my fallen sister, and",
  18: "Ground. I was nervous, because my parents",
  21: "quietly as possible. And seeing as how I",
  25: "which I have yet to be thanked. I was trying as hard as I could. She didn't",
  27: "I saw my sister's faces wail but pain and suffering and surprise, threatening",
  28: "to erupt from her mouth and threatening to wake my parents from the long winters",
  29: "nap, for which they had settled. So I did the only thing my little frantic",
  30: "seven-year-old brain could think to do to avert this tragedy. If you have",
  31: "children, you've seen this hundreds of times before. I said, Amy Amy wait, don't",
  32: "cry, don't cry. Did you see how you landed?",
  33: "No human lands on all fours like that.",
  34: "Amy, I think this means you're a unicorn.",
  35: "Now that was cheating, because there's nothing in the world my sister would",
  36: "want more than not to be Amy the hurt five-year-old little sister, but Amy the",
  37: "special unicorn. Of course, this was an option that was open to her brain and no",
  38: "point in the past. And you could see on my poor manipulated sister's face",
  39: "conflict as their little brain attempted to devote resources to feeling the pain",
  40: "and suffering surprise she just",
  42: "newfound identity as a unicorn. And the latter one. Now, instead of crying, instead",
  43: "of ceasing our Plains to have waking my parents with all the negative",
  44: "consequences that would have been sued for me, and says smile spread across her",
  45: "face, and she scrambled right back up onto the bunk bed with all the grace of a baby unicorn",
  46: "with one broken Lake. What we stumbled",
  47: "across at this tender age, which is five and seven, we had no idea at the time, was",
  48: "something that was going to be at the vanguard of a scientific revolution",
  49: "occurring two decades later in the way that we look at the human brain. What we",
  50: "had stumbled across is something called positive psychology, which is the reason",
  51: "that I'm here today, and the reason that I wake up every morning. When I first",
  52: "started talking about this research outside of academia, out with companies,",
  53: "in school. Was the very first thing they said to never do is to start your talk with a graph. The very first thing I",
  54: "wanted to do is start my talk with a graph. This graph looks boring, but this",
  55: "graph is the reason that I get excited and wake up every morning. And this graph doesn t mean anything, it's faked out of",
  58: "because there's very clearly a trend that's going on there. And that means that I can get published, which is all",
  59: "that really matters. The fact that there's one weird red dot",
  61: "weird in the room. You know who you are. I",
  62: "saw you earlier. That's no problem.",
  63: "That's no problem. As most of you know,",
  65: "Delete that dot because that's clearly a measurement error and we know that's a",
  68: "Things do we teach people in economics and statistics and business and psychology courses is how in a",
  70: "the weirdos? How do we eliminate the outliers so that we can find the line of",
  71: "best fit? Which is fantastic if I'm trying to find out how many advil the",
  72: "average person should be taking to. But if I'm interested in potential, if I'm",
  73: "interested in your potential or for happiness or productivity or energy or",
  74: "creativity, what we're doing is we're creating the cold to the average with",
  75: "science. If I ask you a question like, how fast can the child learn how to read in",
  76: "a classroom, scientists change the answer to how fast is the average child learn",
  77: "how to read in that classroom, and then we tailor the class right towards the average. Now, if you fall below the",
  78: "average on this curve, then we'll psychologists get thrilled, because that",
  79: "means you're either depressed or you have a disorder, or hopefully both. We're",
  80: "hoping for both, because our business models. If you come into a therapy session with one problem, we want to make",
  81: "sure you leave knowing you have ten, so you'll keep coming back over and over",
  82: "again. We'll go back into your child have necessary, but eventually what we want to",
  83: "do is to make you normal again. But normal is merely average, and what I",
  84: "Pause it and what positive psychology posits is if we study what is merely",
  85: "average, we will remain merely average. Then, instead of deleting those positive",
  86: "outliers, what I intentionally do is come into a population like this one and says",
  87: "Why why is it the some of you are so high above the curve in terms of your",
  88: "intellectual, voting, athletic ability, musical ability, creativity, energy levels,",
  89: "your resiliency in the face of challenge, your sense of humor, whatever it is?",
  90: "Instead of deleting you, what I want to do is study you, because maybe we can",
  91: "glean information, not just how to move people up to the average, but how we can",
  92: "move the entire average up. That our companies and schools worldwide. The",
  93: "reason this graph is important to me is, when I turn on the news, it seems like",
  94: "the majority of the information is not positive. In fact, is negative. Most of us",
  95: "about murder, corruption, diseases, natural disasters. And very quickly, my brain",
  96: "starts to think that's the accurate ratio of negative positive in the world.",
  97: "What that's doing is creating something called the medical school syndrome, which, if you know people who have been to",
  98: "medical school, during the first year of medical training, as you read through a list of all the symptoms and diseases",
  99: "that could happen, suddenly you realize you have all of them. Have a",
  100: "brother-in-law named Bobo, which is a whole nother story.",
  101: "Bobo married Amy the Unicorn. Bobo called",
  102: "me on the phone from Yale Medical School.",
  103: "From Yale Medical School, and Bobo said,",
  104: "Sean, I have leprosy, which even at Yale",
  105: "is extraordinarily rare. But I had no idea how to console poor Bobo, because he",
  107: "Menopause. See, what we're finding is not",
  108: "necessarily the reality that shapes us, but the lens to which your brain views",
  109: "the world that shapes your reality. If we can change the lens, not only can we",
  110: "change your happiness, we can change every single educational and business",
  111: "outcome at the same time. When I applied to Harvard, I applied on it there. I",
  112: "didn't expect to get in, and my family had no money for college. When I got a military scholarship two weeks later,",
  113: "that allowed me to go. Suddenly, something wasn't even a possibility, became a reality. When I went there, I assumed",
  114: "everyone else would see it as a privilege as well, that they'd be excited to be there, even if you're in a",
  115: "classroom full of people smarter than you, you'd be happy just to be in that",
  116: "classroom, which is what I felt. But what I found there is, while some people",
  117: "experienced that, when I graduated after my four years, and then spent the next",
  118: "eight years living in the dorms with the",
  119: "students Harvard asked me to, wasn't that",
  121: "I was an officer of Harvard accounts those students through the difficult",
  122: "four years. And what I found in my research, in my teaching, is that these",
  123: "students, no matter how happy they were with the original SAS success of getting",
  124: "into the school, two weeks later, the brains were focused not on the privilege",
  125: "of being there, nor on their philosophy or their physics. The brain was focused",
  126: "on the competition, the workload, the hassles, the stresses, the complaints. When",
  127: "I first went in there, I walked into the freshmen dining hall, which is where my friends from Waco Texas, which is where I",
  128: "grew up. I know some of you have heard of it. When I, when they come to visit me,",
  129: "they look around, they say this freshman dining hall looks like something out of Hogwarts, some movie Harry Potter, which",
  130: "it does. This is Hogwarts, a movie, Harry Potter, and that's Harvard. When they see",
  131: "this, they say Sean, why do you waste your time studying happiness at Harvard?",
  132: "Seriously, what does a Harvard student possibly have to be unhappy about?",
  133: "Embedded within that question is the key to understanding the science happiness,",
  134: "because what that question assumes is there our external world its predictive",
  135: "of our happiness levels. When in reality, if I know everything about your external",
  136: "world, I can only predict ten percent of your long-term happiness. 90 percent of",
  137: "your long-term our happiness is predicted not by the external world, but",
  138: "by it through the way your brain processes the world. And if we change it,",
  139: "if we change our formula for happiness",
  140: "and success, what we can do is change the",
  141: "way that we can then affect reality. What we found is that only 25% of job",
  142: "successes are predicted by IQ. Seventy-five percent of job successes",
  143: "are predicted by your optimism levels,",
  144: "your social support and your abilities. See stress as a challenge instead of as",
  145: "a threat. I talked to a boarding school up in New England, probably the most prestigious boarding school, and they",
  146: "said, we already know that. So every year, instead of just teaching our students, we also have a Wellness Week, and we're so",
  147: "excited. Monday night, we have the world's leading expert coming in to speak about",
  148: "adolescent depression. Tuesday night is school violence and bullying. Wednesday",
  149: "night, Wednesday nights, eating disorders. Thirst united's illicit drug user. Friday",
  150: "night, we're trying to decide between",
  151: "risky sex or happiness.",
  152: "I said, that's most people's Friday",
  153: "nights.",
  154: "Which I'm glad you liked, but they did not like that at all. Silence on the",
  155: "phone. And into the silence I said, I'd be happy to speak at your school, but just, you know, that's not a Wellness week.",
  156: "That's the sickness week. What you've done is you've outlined all the negative things that can happen, but not talked",
  157: "about the positive. The absence of disease is not health. Here's how we get",
  158: "to health. We need to reverse the formula for happiness and success. In the past",
  159: "three years, I've traveled to 45 different countries, working with schools",
  160: "and companies in the midst of an economic downturn. And what I found is",
  161: "the most companies and schools follow a formula for success, which is this: if I",
  162: "work harder, I'll be more successful. And if I'm more successful, then I'll be",
  163: "happier. That undergirds most of our parenting styles are managing style is",
  164: "the way that we motivate our behavior. And the problem is it's scientifically",
  165: "broken and backwards, for two reasons. First, every time your brain has a",
  166: "success, you just change the goalposts of what success look like. You got good grades, now you have to get better grades.",
  167: "Gone to a good school, and after you get better school, you got a good job, now you have to get a better job. You hit your",
  168: "sales target, we're gonna change your sales target. And if happiness is on the",
  169: "opposite side of success, your brain never gets there. What we've done is we",
  170: "push happiness over the cognitive horizon as a society. And that's because",
  171: "we think we have to be successful, successful, then we'll be happier. But the",
  172: "real problem is our brains work in the opposite order. If you can raise",
  173: "somebody's level of positivity in the present, then their brain experiences",
  174: "what we now call a happiness advantage, which is your brain and positive",
  175: "performs significantly better than does a negative, neutral, stress. Your",
  176: "intelligence Rises, your creativity Rises, your energy levels rise. In fact, what we",
  177: "found is that every single business",
  178: "outcome improves. Your brain and positive",
  179: "is 31 percent more productive Mendut your brain and negative neutral stress.",
  180: "You're 37% better at sales.",
  181: "Doctors are 19% faster, more accurate at coming up with the correct diagnosis",
  182: "when positive instead of negative neutral stress, which means we can",
  183: "reverse the formula. If we can find a way, becoming positive in the present, then",
  184: "our brains work even more successfully",
  185: "as we're able to work harder, faster, and more intelligently. What we need to be",
  186: "able to do is to reverse this formula, so we can start to see what our brains are actually capable of. Because dopamine,",
  187: "which floods into your system when you're positive, has two functions. Not",
  188: "only does it make you happier, it turns on all the learning centers in your",
  189: "brain, allowing you to adapt to the world in a different way. We've found that",
  190: "there are ways you can train your brain to be able to come more positive in just",
  191: "a two minute span of time, done for 21 days in row.",
  192: "We can actually rewire your brain, allowing your brain to actually work",
  193: "more optimistically and more successfully. We've done these things in",
  194: "research now, in every single company that I've worked with, getting them to",
  195: "write down three new things that they're grateful for, for 21 days in a row. Three",
  196: "new things each day. And at the end of that, their brain starts to retain a",
  197: "pattern of scanning the world not for the negative, but for the positive first.",
  198: "Journaling about one positive experience you've had over the past 24 hours allows",
  199: "your brain to relive it. Exercise teaches",
  200: "your brain your behavior matters. We find",
  201: "that meditation allows your brain to get",
  202: "over the cultural ADHD that we've been",
  203: "creating by trying to do multiple tasks at once, and allows our brains to focus",
  204: "on the task at hand. And finally, random acts of kindness, or",
  205: "conscious acts of kindness. We get people, when they open up their inbox, to write",
  206: "one positive email praising or thanking somebody in their social support network.",
  207: "And by doing these activities, and by training your brain, just like we trained",
  208: "our bodies, what we found is we could reverse the formula for happiness and",
  209: "success. And in doing so, now let create",
  210: "ripples of positivity, but create a real",
  211: "revolution. Thank you very much.",
});

// ═════════════════════════════════════════════════════════════════════════
// FLTOiQ8gXp4 – celebrity roast comedy
applyFixes('FLTOiQ8gXp4', {
  0:  "Sorry, but he just screams. It's kind of true.",
  1:  "Jon Hamm is a soft boy with a dad bod. Hashtag truth.",
  3:  "Well, if you lost all your money in divorce, you'd be on grownups too, too.",
  5:  "ahead and do that, please. Maisie Williams looks like a very young grandma.",
  8:  "I just cut a fart that smells so bad they added David Spade as a supporting character.",
  9:  "That's not bad. I actually auditioned for that. I didn't know if I got it. Jake Gyllenhaal's d**k smells",
});

// ═════════════════════════════════════════════════════════════════════════
// fO4ViYDw2l8 – country song lyrics, leave as-is
result['fO4ViYDw2l8'] = {};

// ═════════════════════════════════════════════════════════════════════════
// fPwDR1Qo1GM – pop song, leave as-is
result['fPwDR1Qo1GM'] = {};

// ═════════════════════════════════════════════════════════════════════════
// FrkEDe6Ljqs – "Marvin" song, leave as-is
result['FrkEDe6Ljqs'] = {};

// ═════════════════════════════════════════════════════════════════════════
// FrLequ6dUdM – "No Scrubs" (TLC) lyrics
applyFixes('FrLequ6dUdM', {
  10: "Hangin' out the passenger side of his best friend's ride. Trying to holla at me.",
});

// ═════════════════════════════════════════════════════════════════════════
// FS1Wts11oX0 – Encanto dialogue
applyFixes('FS1Wts11oX0', {
  1:  "Casita! Get me up there!",
  2:  "Antonio! We gotta get out of here!",
  4:  "Antonio! Antonio!",
});

// ═════════════════════════════════════════════════════════════════════════
// FTQbiNvZqaY – "Africa" (Toto) lyrics
applyFixes('FTQbiNvZqaY', {
  0:  "Only whispers of some quiet conversation.",
  1:  "She's coming in twelve-thirty flight.",
  3:  "I stopped an old man along the way,",
  4:  "hoping to find some old forgotten words or ancient melodies.",
  5:  "He turned to me as if to say,",
  6:  "\"Hurry, boy, it's waiting there for you.\"",
  9:  "I bless the rains down in Africa.",
  10: "We're gonna take some time to do the things we never did.",
});

// ═════════════════════════════════════════════════════════════════════════
// f_kgZFdt5B0 – short action clip
applyFixes('f_kgZFdt5B0', {
  2:  "You got some crazy lip on you, old man. Your life worth 400 bucks?",
  3:  "Duco, time to bounce. Yeah, go, go.",
  4:  "Yeah, one lucky old man.",
});

// ═════════════════════════════════════════════════════════════════════════
// G4hXSY1JgNQ – stand-up comedy / monologue about smoking
applyFixes('G4hXSY1JgNQ', {
  0:  "I'm crazy, but I don't miss it. I don't miss what it did to me, but I miss the",
  1:  "the feeling of smoking cigarettes. The problem is, I mean, I'm not interested in",
  2:  "vaping or anything like that. I mean, look, if it's not a cigarette, I don't care. I've",
  3:  "tried cigars. It's not for me. Tobacco products, unfortunately, pretty",
  4:  "conclusively, give you cancer. And I'd really like to avoid that if I",
  5:  "could. So I like to shorten the odds by not smoking. But the weird",
  6:  "thing is, I think the nicotine. I still, occasionally, in New York, when you",
  7:  "walk around, most of the time you don't smell nicotine. You smell weed. You smell",
  8:  "a lot of weed. I never cared for weed. But they smell a lot of weed, and you smell a",
  9:  "lot of, you smell pee, and pizza, and occasional...",
});

// ═════════════════════════════════════════════════════════════════════════
// G7KNmW9a75Y – "Flowers" (Miley Cyrus) lyrics, leave as-is
result['G7KNmW9a75Y'] = {};

// ═════════════════════════════════════════════════════════════════════════
// Ghd2bkIadG4 – "18 and Life" (Skid Row) – leave as-is (lyrics)
result['Ghd2bkIadG4'] = {};

// ═════════════════════════════════════════════════════════════════════════
// GIUhpzv47YQ – Interstellar "Stay" scene
applyFixes('GIUhpzv47YQ', {
  0: "Stay. Huh? Huh?",
  1: "Come on, come on! Murph! Murph! Murph, come on! What's his name? What's his name?",
  2: "What's his name?",
});

// ═════════════════════════════════════════════════════════════════════════
// gJ_cx3AmCuI – 2 Fast 2 Furious / crime film
applyFixes('gJ_cx3AmCuI', {
  0:  "You've been on my payroll a long time, Rone. That ain't right. Shut up.",
  1:  "I got one last job for you, detective.",
  2:  "You hear me? Look, we've been all through this. Yeah. Yeah, and I said I can't do it.",
  3:  "That's the wrong answer. To the table.",
  4:  "I'm a detective, Verone. You can do anything to me. The whole force is gonna be on your ass in a",
  5:  "minute. Shut your mouth. Fat piece of shit. Stop right now.",
  6:  "All right. What the hell? What the hell is it? Sit down.",
  7:  "You regret this. Stop right now. Once the bucket gets hot enough, detective, the",
  8:  "rat is gonna want out.",
});

// ═════════════════════════════════════════════════════════════════════════
// GkD20ajVxnY – "Summer Girl" song lyrics, leave as-is
result['GkD20ajVxnY'] = {};

// ═════════════════════════════════════════════════════════════════════════
// gNi_6U5Pm_o – "Good for You" (Olivia Rodrigo) – minor fixes
applyFixes('gNi_6U5Pm_o', {
  0:  "Well, good for you. I guess you moved on really easily. You found a new girl and it only took",
  1:  "a couple weeks. Remember when you said that you wanted to give me the world? And good for you, I guess that you've been working on yourself.",
  5:  "If you ever cared to ask.",
  6:  "Good for you, you're doin' great, I'll do it without me, baby.",
  7:  "Gotta wish that I didn't do that.",
  9:  "On the floor of my bathroom.",
  11: "I guess good for you.",
});

// ═════════════════════════════════════════════════════════════════════════
// gO8N3L_aERg – The Office fire safety talk
applyFixes('gO8N3L_aERg', {
  0:  "Last week I give a fire safety talk,",
  1:  "and nobody paid any attention.",
  2:  "It's my own fault for using PowerPoint.",
  3:  "PowerPoint is boring.",
  4:  "People learn in lots of different ways, but experience is the best teacher.",
  5:  "Today, smoking is gonna save lives.",
});

// ═════════════════════════════════════════════════════════════════════════
// gOxG6HSicwk – Friends episode
applyFixes('gOxG6HSicwk', {
  0:  "So, Dr. Green, how's the old boat? They",
  1:  "found rust.",
  2:  "You know what rust does to a boat gives?",
  3:  "rust is boat cancer, Ross.",
  4:  "Well, I'm sorry. When I was a kid I lost a",
  5:  "bike to that. Excuse me for a moment, will",
  6:  "you please? I want to say good night to",
  7:  "the Levines.",
  8:  "Okay. Oh, I think your dad must have added",
  9:  "wrong. He only tipped like 4%. Yeah, that's",
  10: "Daddy. That's Daddy. What? Doesn't it",
  11: "bother you? You're a waitress. Yes, it bothers me, Ross. But, you know, if he was a",
  12: "regular at the coffee house, I'd be",
  13: "serving him sneezers. So, so, Ross, I bugged",
  14: "him about this a million times. He's not",
  15: "gonna change. Do really circles, lasers.",
  17: "All right, kids, ready? Wait, wait, wait, wait.",
  18: "I think I forgot my receipt. You don't",
  19: "need that. The carbon, it's messy. I mean,",
  20: "gets on your fingers and causes the the",
  21: "night blindness. What is this? You put a",
  22: "Twenty-dollar. Oh yeah, that would be me. I",
  23: "have. I have a problem. Like, I tip way too",
  24: "much, way, way too much.",
  25: "It's a sickness, really. Yeah, it is, it is.",
  27: "You think I'm cheap? Really? Nothing I do",
  29: "This is nice. I paid $200 for, then are",
  30: "you put down 20, and you come out looking like Mr. Bigshot?",
  31: "You really want to be Mr. Big? Oh yeah.",
  32: "I'll tell you what, you pay the whole",
  33: "bill, Mr. Bigshot. Right. Well, Mr. Bigshot",
  34: "Is better than went head.",
});

// ═════════════════════════════════════════════════════════════════════════
// gPoiv0sZ4s4 – "Pop Muzik" (M) lyrics, leave as-is
result['gPoiv0sZ4s4'] = {};

// ═════════════════════════════════════════════════════════════════════════
// GQMlWwIXg3M – "*NSYNC It's Gonna Be Me" lyrics, leave as-is
result['GQMlWwIXg3M'] = {};

// ═════════════════════════════════════════════════════════════════════════
// GVuh1lfrEwE – pop song lyrics, leave as-is
result['GVuh1lfrEwE'] = {};

// ═════════════════════════════════════════════════════════════════════════
// GXJifYl_byU – Metallica "Enter Sandman" lyrics, leave as-is
result['GXJifYl_byU'] = {};

// ═════════════════════════════════════════════════════════════════════════
// Gzi8k9nBrdU – Ted Lasso scene
applyFixes('Gzi8k9nBrdU', {
  0:  "What the fuck are you doing? What are you talking about?",
  1:  "He's out there doing really fucking nuts. Yeah, but I've got two players on him already. Take him out.",
  2:  "Are you joking? Get rid of him. This is remarkable. Rupert Mannion demonstrating",
  3:  "with his own manager on the pitch. You don't see this very often. Well, not since the invention of telephones, at least.",
  4:  "I'm not playing the game like that. You do what I say, or you are done.",
  5:  "Fuck off. Oh dear. Those ugly scenes at Nelson Road. Rupert",
  6:  "Mannion's nuts. And George Kartrick's. Damn it, Chris.",
  7:  "There's three bolts on the field. What?",
  8:  "Get up! Get up!",
  9:  "OK, gents, let's go. Please, we're back. George, put him away.",
});

// ═════════════════════════════════════════════════════════════════════════
// h7amSrgtINI – one-liner fragment, leave as-is
result['h7amSrgtINI'] = {};

// ═════════════════════════════════════════════════════════════════════════
// hAQELenqVgE – pop song (Lady Gaga "Show Me Your Teeth"), leave as-is
result['hAQELenqVgE'] = {};

// ═════════════════════════════════════════════════════════════════════════
// hCuMWrfXG4E – "Uptown Girl" (Billy Joel), leave as-is
result['hCuMWrfXG4E'] = {};

// ═════════════════════════════════════════════════════════════════════════
// HFOJYAZRE4A – "A World of Your Own" / chocolate fantasy song
applyFixes('HFOJYAZRE4A', {
  0:  "other. If it were, I wouldn't bother.",
  1:  "Chocolate bushes, chocolate trees,",
  2:  "chocolate flowers, and chocolate bees,",
  3:  "chocolate memories that a boy once saved",
  4:  "before they melted away. A world of your own,",
  6:  "a world of your own,",
  8:  "wherever you go,",
  10: "this is your home,",
  11: "a world of your own.",
});

// ═════════════════════════════════════════════════════════════════════════
// HI4oIuRQ-0M – road trip / plantation tour
applyFixes('HI4oIuRQ-0M', {
  0:  "All right, big step, big step, go, go. All right, stay up, don't open your eyes, don't",
  1:  "open your eyes. Okay, Windsor Plantation, built in 1772. Rumor has it that Francis Marion",
  2:  "proposed to his wife right here on these steps. Be careful, this is broken. This place is gigantic.",
  3:  "Yeah, a gigantic piece of crap.",
});

// ═════════════════════════════════════════════════════════════════════════
// hJCUJLMSEK0 – celebrity tweet commentary
applyFixes('hJCUJLMSEK0', {
  1:  "Feel like if you went to lunch with Natalie Portman,",
  2:  "she would only order a hot tea with lemon, and maybe some toast, definitely not an entree, though.",
  4:  "Look at me, I'm Ryan Gosling. I have perfect bone structure and kind eyes. Go yourself, Ryan Gosling.",
  5:  "Samuel L. Jackson has resting fart face. \"Yes, I do.\"",
  6:  "I'm going to white balance my TV on Jessica Chastain's chest.",
  7:  "Are we all just ignoring the fact that Eddie Redmayne and Felicity Jones have the same face?",
  8:  "Dear Eddie Redmayne, I hate your stinking guts. You make me vomit. You're the scum between my toes. Love's Eugenia.",
  10: "and says, \"You look like you have Whoopi Goldberg in a headlock.\"",
  11: "Really, that's it? Lin-Manuel Miranda looks like he's getting a 1996 NBC sitcom with his hair cut.",
});

// ═════════════════════════════════════════════════════════════════════════
// hLOheGDwD_0 – "Choosing Texas" style country song, leave as-is
result['hLOheGDwD_0'] = {};

// ═════════════════════════════════════════════════════════════════════════
// hmUyEDG7Jy0 – "Leave Before You Love Me" (Marshmello/Jonas Brothers) lyrics, leave as-is
result['hmUyEDG7Jy0'] = {};

// ═════════════════════════════════════════════════════════════════════════
// HqTBW90w0_0 – pop song "Fascinating Things" style, leave as-is
result['HqTBW90w0_0'] = {};

// ═════════════════════════════════════════════════════════════════════════
// hrXJe_T6VS4 – The Crown / royal jewellery scene
applyFixes('hrXJe_T6VS4', {
  0:  "Gosh. Um. This one's lovely.",
  1:  "That's one of ours. Yes, ma'am. From the Magok Valley. Any idea where that is?",
  2:  "One rather thick at geography. Burma.",
  3:  "There's a legend, ma'am, that long, long ago, the northern part of Burma was",
  4:  "inhabited only by wild animals and poisonous snakes. I think I prefer this one.",
  5:  "Yes, a lovely choice, ma'am. If that's one of yours,",
  6:  "what can you tell us about that, apart from the price? It's a 12 carat oval Ceylon sapphire,",
  7:  "Your Majesty,",
  8:  "surrounded by 14 diamonds, set in 18 carat white gold. And you like",
  9:  "that one because? It's the most expensive? No.",
  10: "Because it reminds me of my mother's engagement ring. And the same colour as my eyes.",
  11: "She is lovely. Yes.",
});

// ═════════════════════════════════════════════════════════════════════════
// hTWKbfoikeg – "Smells Like Teen Spirit" (Nirvana) lyrics, leave as-is
result['hTWKbfoikeg'] = {};

// ═════════════════════════════════════════════════════════════════════════
// hWQy4YuIMOw – "Take Me to the River" style song, leave as-is (♪ prefix segments)
result['hWQy4YuIMOw'] = {};

// ═════════════════════════════════════════════════════════════════════════
// HySlYLkFieQ – all caps fragment, leave as-is
result['HySlYLkFieQ'] = {};

// ═════════════════════════════════════════════════════════════════════════
// Hz1Be2zNKgo – West Wing style political drama
applyFixes('Hz1Be2zNKgo', {
  0:  "you for harassment. Mr. Garner should consider how seriously I take this. Take",
  1:  "what he acquired. A videotape of a stuffed ballot box. He brought that",
  2:  "videotape to the governor-elect, and he attempted to show it to him. What",
  3:  "videotape? What is that? That is a videotape of three men taking a ballot",
  4:  "box. Or is it a gif? Have you ever seen the gif of that bear falling onto a",
  5:  "trampoline and then bouncing into a pool? It is so funny. But I was surprised to",
  6:  "find out that the pool was faked, all digitally. If you're suggesting that this",
  7:  "videotape was in any way manipulated, bits per pixel makes a gif highly",
  8:  "manipulatable. Bull. I hope you have the original, because otherwise I'm gonna",
  9:  "eject to the gif being admitted into court. The governor is guilty. How do you",
  10: "know that?",
});

// ═════════════════════════════════════════════════════════════════════════
// h_bUcNjmuSk – classic crime comedy
applyFixes('h_bUcNjmuSk', {
  0:  "I'm afraid you're mistaken, sir. Don't give me that. You've been spoochin with everybody: Snuffy,",
  1:  "Al, Leo, Little Mo with the gimpy leg, Cheeks, Boney Bob, Cliff.",
  2:  "No. It's a lie. I could go on forever, baby.",
  3:  "I'm terribly sorry, sir, but I'm afraid you're mistaken. We're looking for a",
  4:  "young man. All right, I believe you. But my tommy gun don't.",
  5:  "Get down on your knees and tell me you love me.",
  7:  "I love you.",
  8:  "You got it. You're better than that.",
});

// ═════════════════════════════════════════════════════════════════════════
// i9HGwRbMiVY – "Say" (Lisa Loeb) style song, leave as-is
result['i9HGwRbMiVY'] = {};

// ═════════════════════════════════════════════════════════════════════════
// IaSsii5UpT8 – "Maybe That's What It Takes" style song, leave as-is
result['IaSsii5UpT8'] = {};

// ═════════════════════════════════════════════════════════════════════════
// iCvmsMzlF7o – Brené Brown TED talk (vulnerability)
applyFixes('iCvmsMzlF7o', {
  0:  "So I'll start with this. A couple of years ago, an event planner called me because I",
  1:  "was going to do a speaking event, and she called and she said, I'm really",
  2:  "struggling with how to write about you on the little flyer.",
  3:  "And I thought, well, what's the struggle?",
  4:  "And she said, well, I saw you speak, and I",
  5:  "I, I'm going to call you a researcher, I think, but I'm afraid if I call your",
  6:  "researcher, no one will come, because they'll think you're boring and irrelevant.",
  7:  "And it's like, okay. And she said, so, but the thing I liked about your talk is, you",
  8:  "know, you're a storyteller. So I think what I'll do is just call you a",
  9:  "storyteller. And of course, the academic, insecure part",
  10: "of me was like, you're gonna call me a what? And she said,",
  11: "I'm gonna call you a storyteller. And I",
  12: "was like,",
  13: "oh, why not magic pixie?",
  14: "I was like, I, I don't, I let me think",
  15: "about this for a second. And so I tried to call deep on my courage, and I",
  16: "thought, you know, I am a storyteller. I'm a",
  17: "qualitative researcher. I collect stories. That's what I do.",
  18: "And maybe stories are just data with a",
  19: "soul, you know. And maybe I'm just",
  20: "a storyteller. So I said, you know what, why don't you just say I'm a researcher",
  21: "storyteller.",
  22: "And she went, there's no such thing.",
  23: "So I'm a researcher or storyteller. And I'm going to talk to you today. We're",
  24: "talking about expanding perception. And so I want to talk to you",
  25: "and tell some stories about",
  26: "a piece of my research that",
  27: "fundamentally expanded my perception",
  28: "and really actually changed the way that",
  29: "I live, and love, and work, and parent.",
  30: "And this is where my story starts. When I",
  31: "was a young researcher, doctoral student,",
  32: "my first year, I had a research professor",
  33: "who said to us, here's the thing: if you cannot measure",
  34: "it, it does not",
  35: "Exist, and I thought he was just sweet",
  36: "talking me. I was like,",
  37: "really? And he's like, absolutely. So you",
  38: "have to understand that I have a bachelor's in social work, a master's",
  39: "in social work, and I was getting my PhD in social work. So my entire academic",
  40: "career",
  41: "was surrounded by people who kind of",
  42: "believed in the life's messy,",
  43: "love it, you know. And I'm more the life's",
  44: "messy,",
  45: "clean it up, organize it, and put it into",
  46: "a bento box.",
  47: "Um, and so to",
  48: "think that I had found my way, to found a career",
  49: "that takes me, you know, really, one of the big sayings",
  50: "In in social work is lean into the discomfort of the work.",
  51: "And I'm like, you know, knock discomfort",
  52: "upside the head and move it over,",
  53: "and get all A's. That's my, that was my",
  54: "mantra. So I was very excited about this. And so",
  55: "I thought, you know what, this is the career for me, because I am",
  56: "interested in some messy topics, but I want to be able to make them not",
  57: "messy.",
  58: "I want to understand them. I want to hack",
  59: "into these things I know are important",
  60: "and lay the code out for everyone to see.",
  61: "So where I started was with connection, because by the time",
  62: "you're a social worker for",
  63: "10 years, what you realize is that",
  64: "connection is why we're here. It's what",
  65: "gives purpose and meaning to our lives. This is, this is what it's all about. It",
  66: "doesn't matter whether you talk to people who work in social justice and",
  67: "mental health and abuse and neglect. What we know is",
  68: "that connection,",
  69: "the ability to feel connected, is",
  70: "neurobiologically that's how we're wired. It's why we're here.",
  71: "So I thought, you know what, I'm going to start with connection.",
  72: "Well, you know that that situation where",
  73: "you get an evaluation from your boss, and she tells you 37 things that you do",
  74: "really awesome, and one thing that you can't, you know, an opportunity for growth?",
  75: "And all you can think about is that opportunity for growth? Right.",
  76: "Well, apparently this is the way my work",
  77: "went as well. Because when you ask people about love, they tell",
  78: "you about heartbreak. When you ask people about belonging,",
  79: "they'll tell you the most excruciating experiences of being",
  80: "excluded. And when you ask people about connection,",
  81: "the stories they told me were about disconnection.",
  82: "So, very quickly, really about six weeks",
  83: "into this research, I ran into",
  84: "this unnamed thing that absolutely",
  85: "unraveled connection",
  86: "in a way that I didn't understand, or had never seen. And so I pulled back out of",
  87: "the research and thought, I need to",
  88: "figure out what this is.",
  89: "And it turned out to be shame.",
  90: "And shame is really easily understood as",
  91: "the fear of disconnection.",
  92: "Is there something about me that, if",
  93: "other people know it or see it,",
  94: "that I won't be worthy of connection?",
  95: "The things I can tell you about: it's universal, we all have it. The only people",
  96: "who don't experience shame have no capacity for human",
  97: "empathy or connection. No one wants to",
  98: "talk about it, and the less you talk about it, the more you have it.",
  99: "What underpinned this shame, this I'm not",
  100: "good enough, which we all know that feeling, I'm not",
  101: "blank enough, I'm not thin enough, rich",
  102: "enough, beautiful enough, smart enough, promoted enough. Um, the thing that",
  103: "underpinned this",
  104: "was excruciating vulnerability.",
  105: "This idea of, in order for connection to",
  106: "happen, we have to allow ourselves to be seen,",
  107: "really seen. And you know how I feel about vulnerability? I hate vulnerability. And",
  108: "so I thought, this is my chance to beat it",
  109: "back with my measuring stick.",
  110: "I'm going in. I'm going to figure this",
  111: "stuff out. I'm going to spend a year. I'm going to totally deconstruct shame.",
  112: "I'm going to understand how vulnerability works, and I'm going to",
  113: "outsmart it.",
  114: "As you know, it's not going to turn out well.",
  115: "You know this. So I could tell you a lot about shame,",
  116: "but I'd have to borrow everyone else's time. But here's what I can tell you, that",
  117: "it boils down to. And this may be one of the most",
  118: "important things that I've ever learned",
  119: "in the decade of doing this research.",
  120: "My one years turned into six years.",
  121: "Thousands of stories, hundreds of long interviews,",
  122: "focus groups. At one point, people were sending me journal pages and sending me",
  123: "their stories. Thousands of pieces of data, and six",
  124: "years. And I kind of got a handle on it. I kind",
  125: "of understood, this is what shame is. This",
  126: "is how it works.",
  127: "I wrote a book, I published a theory.",
  128: "But something was not okay. And what it",
  129: "was is that if I roughly took the people",
  130: "I interviewed",
  131: "and divided them into people",
  132: "who really have a sense of worthiness",
  133: "That's what this comes down to, a sense of worthiness,",
  134: "they have a strong sense of love and belonging,",
  135: "and folks who struggle for it, and folks who are always",
  136: "wondering if they're good enough. There was only one variable that separated the",
  137: "people who have a strong sense of love and belonging",
  138: "and the people who really struggle for",
  139: "it. And that was: the people who have a strong sense of love and belonging",
  140: "believe they're worthy of love and",
  141: "belonging.",
  142: "That's it. They believe they're worthy.",
  143: "And to me, the hard part of",
  144: "the one thing that keeps us out of connection is our fear that we're not",
  145: "worthy of connection with something that personally and",
  146: "professionally I felt like I needed to",
  147: "understand better.",
  148: "So what I did is I",
  149: "took all of the interviews where I saw worthiness, where I saw people living",
  150: "that way,",
  151: "and just looked at those. What do these",
  152: "people have in common? And I have, I have a slight office supply addiction,",
  153: "but that's another talk. So I had a manila notebook, a manila",
  154: "folder, and I had a Sharpie. And I was like, what am I going to call this research? And the first words that",
  155: "came to my mind were wholehearted. These are kind of",
  156: "wholehearted people, living from this deep sense of worthiness. So I wrote at",
  157: "the top of the manila folder, and I started looking at the data in",
  158: "fact. I did it first",
  159: "In this very four, in a four day",
  160: "very intensive data analysis, where I went back, pulled these interviews, pulled",
  161: "the stories, pulled the incidents. What's the, what's the theme? What's the",
  162: "pattern? My husband left town with the kids, um,",
  163: "because I always go into this kind of Jackson Pollock crazy thing, where I'm just like",
  164: "writing and going and kind of just in my",
  165: "researcher mode. And so here's what I found.",
  166: "What they had in common was a sense of courage.",
  167: "And I want to separate courage and bravery for you, for a minute.",
  168: "Courage. The original definition of courage, when it first came into the English language, it's from the Latin",
  169: "word cur, meaning heart. And the original",
  170: "definition was to tell the story of who you are with your whole heart.",
  171: "And so these folks had very simply the,",
  172: "they had the compassion to be kind to themselves first,",
  173: "and then to others. Because, as it turns out, we can't practice compassion with",
  174: "other people if we can't treat ourselves kindly.",
  175: "And the last was, they had connection. And",
  176: "this was the hard part.",
  177: "As a result of authenticity, they were",
  178: "willing to let go of who they thought they should be",
  179: "in order to be who they were. Which is,",
  180: "you have to absolutely do that for connection.",
  181: "The other thing that they had in common",
  182: "was this:",
  183: "they fully embraced vulnerability.",
  184: "They believed",
  185: "that what made them vulnerable made them",
  186: "They didn't talk about vulnerability being comfortable.",
  187: "Nor did they really talk about it being excruciating, as I had heard",
  188: "earlier in the shame interviewing. They",
  189: "just talked about it being necessary.",
  190: "They talked about the willingness to say",
  191: "I love you first, the willingness to",
  192: "do something where there are no",
  193: "guarantees,",
  194: "the willingness to breathe through",
  195: "waiting for the doctor to call after your mammogram,",
  196: "The willing to invest in a relationship",
  197: "that may or may not work out. They",
  198: "thought this was fundamental.",
  199: "I personally thought it was betrayal.",
  200: "I could not believe I had pledged allegiance to research",
  201: "where our job, you know, the definition of research is to control, control and predict,",
  202: "a steady phenomenon, for the reason, for this explicit reason: to control and",
  203: "predict. And now my very, you know, my mission to",
  204: "control and predict had turned up the answer that the way to",
  205: "live is with vulnerability.",
  206: "And to stop controlling and predicting.",
  207: "This led to a little breakdown.",
  208: "Which actually looked more like this.",
  209: "And it did. It led to a, I called a",
  210: "breakdown. My therapist calls it a spiritual awakening.",
  211: "Spiritual lightning sounds better than breakdown, but I assure you it was a breakdown.",
  212: "And I had to put my data away and go find a therapist. Let me tell you something.",
  213: "You know who you are, when you call your friends and say, I think I need to see",
  214: "somebody. Who do you have any recommendations?",
  215: "Because about five, my friend's like,",
  216: "and I was like, what does that mean? And they're like, I'm just saying, you know,",
  217: "like, don't bring your measuring stick.",
  218: "Okay, so I found a therapist.",
  219: "My first meeting with her, Diana.",
  220: "I brought in my list of the way the wholehearted live.",
  221: "And I sat down, and she said, you know how",
  222: "are you? And I said, I'm great, you know, I'm, I'm okay. And she",
  223: "said, what's going on? And I said, and this is a therapist who sees",
  224: "therapists, because we have to go to those, because their BS",
  225: "meters are good.",
  226: "And so I said, here's the thing, I'm struggling.",
  227: "And she said, what's the struggle? And I said, well, I have a vulnerability issue.",
  228: "And you know, and I know that",
  229: "vulnerability is kind of the core",
  230: "of shame and fear and our struggle for worthiness,",
  231: "but it appears that it's also the",
  232: "birthplace of joy,",
  233: "of creativity, a belonging, of love.",
  234: "And I think I have a problem, and",
  235: "I just, I need some help. And I said, but",
  236: "here's the thing:",
  237: "no family stuff, no childhood. I just",
  238: "I just need some strategies.",
  239: "Thank you. Um.",
  240: "And then I said, it's bad, right? She said,",
  241: "it's neither good nor bad.",
  242: "It just is what it is. And I said, oh my",
  243: "God, this is gonna suck. Um.",
  244: "And it did, and it didn't. Um. And it took",
  245: "about a year. And you know how there are people that, like, when they realize that",
  246: "vulnerability",
  247: "and tenderness are important, that they",
  248: "kind of surrender and walk into it?",
  249: "A, that's not me. And B, I don't even hang out with people like that.",
  250: "For me it was a year-long street fight.",
  251: "It was a slugfest. Vulnerability pushed. I",
  252: "pushed back.",
  253: "I lost the fight, but",
  254: "probably won my life back. And so then I went back into the research and spent",
  255: "the next couple of years really trying to understand what they,",
  256: "the wholehearted, um, what the choices they were making. And, and, what, what is,",
  257: "what, what are we doing with vulnerability? Why",
  258: "do we struggle with it so much? Am I",
  259: "alone in struggling with vulnerability?",
  260: "No. So this is what I learned.",
  261: "We numb vulnerability. When we're waiting for the call,",
  262: "it was funny. I sent something out on Twitter and on Facebook that says,",
  263: "how would you define vulnerability? What",
  264: "makes you feel vulnerable? And within an",
  265: "hour and a half, I had 150 responses,",
  266: "because I wanted to know, you know, what's out there.",
  267: "Having to ask my husband for help,",
  268: "because I'm sick and we're newly married.",
  269: "Um, initiating sex with my husband.",
  270: "Initiating sex with my wife. Being turned",
  271: "down. Asking someone out. Waiting for the",
  272: "doctor to call back.",
  273: "Getting laid off. Laying off people. This",
  274: "is the world we live in.",
  275: "We live in a vulnerable world. And one of",
  276: "the ways we deal with it is we numb vulnerability.",
  277: "And I think there's evidence, and it's",
  278: "not the only reason this evidence exists,",
  279: "but I think that there, it's a huge cause.",
  280: "We are the most in debt,",
  281: "obese, addicted,",
  282: "and medicated adult cohort in U.S. history.",
  283: "The problem is, and I learned this from",
  284: "the research,",
  285: "that you cannot selectively numb emotion.",
  286: "You can't say, here's the bad stuff:",
  287: "here's vulnerability, here's grief, here's",
  288: "shame, here's fear, here's disappointment.",
  289: "I don't want to feel these. I'm going to",
  290: "have a couple of beers and a banana nut muffin.",
  291: "I don't want to feel these. And I know that's, I know that's knowing laughter. I",
  292: "I hack into your lives for a living. I know that's, oh God.",
  293: "You can't numb those hard feelings",
  294: "without numbing the other affects, our",
  295: "emotions. You cannot selectively numb.",
  296: "So when we numb those, we numb",
  297: "joy, we numb gratitude,",
  298: "we numb happiness. And then",
  299: "we are miserable, and we are looking for purpose and meaning.",
  300: "And then we feel vulnerable. So then we have a couple of beers and a banana nut",
  301: "muffin.",
  302: "And it becomes this dangerous cycle. Um,",
  303: "one of the things that I think that we",
  304: "need to think about",
  305: "is why and how we numb. And it doesn't",
  306: "just have to be addiction.",
  307: "The other thing we do is we make",
  308: "everything that's uncertain certain.",
  309: "Religion has gone from a belief in faith",
  310: "and mystery, to certainty. I'm right, you're wrong, shut up.",
  311: "That's it, just certain.",
  312: "The more afraid we are, the more vulnerable we are, the more",
  313: "afraid we are. This is what politics looks like today. There's no discourse",
  314: "anymore, there's no conversation, there's just",
  315: "blame. You know what? Blame. You know how",
  316: "blame is described in the research?",
  317: "A way to discharge pain and discomfort.",
  318: "We perfect. If there's anyone who wants their life to look like this,",
  319: "it would be me, but it doesn't work,",
  320: "because what we do is we take fat from our butts and put it in our cheeks,",
  321: "which just, I hope in 100 years people will look back and go, wow.",
  322: "And we perfect most dangerously are children.",
  323: "Let me tell you what we think about children. They're hardwired for struggle",
  324: "when they get here. When you hold those perfect little babies in your hand, our job is not to",
  325: "say, look at her, she's perfect. My job is just to keep her perfect, make sure she makes",
  326: "the tennis team by fifth grade and Yale by seventh grade.",
  327: "That's not our job. Our job is to look and say, you know what, you're imperfect,",
  328: "and you're wired for struggle, but you are worthy of",
  329: "love and belonging. That's our job. Show me a generation of",
  330: "kids raised like that, and we'll end the problems I think that",
  331: "we see today. We pretend",
  332: "that what we do doesn't have an effect on people.",
  333: "We do that in our personal lives. We do",
  334: "That corporate, whether it's a bailout, an",
  335: "oil spill,",
  336: "a recall. We pretend like what we're",
  337: "doing doesn't have a huge impact on other people.",
  338: "I would say to companies, this is not our first rodeo, people.",
  339: "We just need you to be authentic and",
  340: "real, and say,",
  341: "but there's another way. And I'll leave",
  342: "you with this. This is what I have found.",
  343: "To let ourselves be seen, deeply seen,",
  344: "to love with our whole hearts, even though there's no guarantee.",
  345: "And that's really hard. And I can tell you as a parent, that's excruciatingly difficult.",
  346: "To practice gratitude and joy in those",
  347: "moments of kind of terror, when we're wondering, can I love you this much? Can I believe in this as",
  348: "passionately? Can I be this fierce about this, just to",
  349: "be able to stop, and instead of catastrophizing what might happen, to say,",
  350: "I'm just so grateful,",
  351: "because to feel this vulnerable means I'm alive.",
  352: "And the last, which I think is probably",
  353: "the most important,",
  354: "is to believe that we're enough. Because",
  355: "when we work from a place, I believe, that says I'm enough,",
  356: "then we stop screaming and start listening.",
  357: "We're kinder and gentler to the people around us, and we're kinder and gentler",
  358: "to ourselves.",
  359: "That's all I have.",
  360: "Sharing that's video on the human",
  361: "network.",
});

// ═════════════════════════════════════════════════════════════════════════
// iK6Sg-wof7Y – URL text, leave as-is
result['iK6Sg-wof7Y'] = {};

// ═════════════════════════════════════════════════════════════════════════
// ilnl_B11vZ8 – comedy road trip
applyFixes('ilnl_B11vZ8', {
  0:  "I would never put you and Manny in danger now. Come on. Trust me on this.",
  2:  "It's American music the whole way, and I don't want to hear a word.",
  3:  "Uh-huh, uh-huh. Oh, all right. Thank you. So you're not see tonight?",
  4:  "Good news, they rescheduled my massage for the morning. Bad news, it's a dude. Don't blame me. It's your mom's fault.",
  5:  "Do you know how many people died in these planes? John Denver, Patsy Cline, Ritchie violin? I've heard you sing. I think you're safe. I",
  6:  "Look, the welcome dinner starts in four hours. It's a five-hour drive. No bathroom breaks. Oh.",
  7:  "I think you're gonna want to hold on to that cup. Damn it.",
  8:  "What was that giant pothole? The dash is lighting up like a Christmas tree, tires blows.",
  9:  "Never would have happened if we were in the air. He's gonna happen in there, wouldn't be in there, would be in rock-and-roll heaven.",
});

// ═════════════════════════════════════════════════════════════════════════
// imW392e6XR0 – celebrity insult comedy tweets
applyFixes('imW392e6XR0', {
  1:  "Ashton Kutcher needs to get hit by a bus ASAP.",
  4:  "If I said it once, I've said it a hundred times: F Andy Garcia.",
  5:  "Mindy Kaling is not funny or attractive. She has an annoying voice and just plainly sucks. Why",
  6:  "does she have her own show? I feel like this is more than 140 characters.",
  7:  "David Blaine looks like his voice is putting his face to sleep.",
  8:  "John Rickles looks like Yoda.",
  9:  "Ethan Hawke seems like a guy who wasn't supposed to be a movie star, but he slipped through the",
  10: "cracks, and everyone was just like, okay.",
  11: "Matthew McConaughey is a d turd.",
});

// ═════════════════════════════════════════════════════════════════════════
// iqhTTufTsU4 – inspirational/love song, leave as-is
result['iqhTTufTsU4'] = {};

// ── write output ──────────────────────────────────────────────────────────
const outDir = 'C:/Users/hyunj/studyeng/src/data/subtitle-fixes';
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(outDir + '/fix-2.json', JSON.stringify(result, null, 2));
console.log('Written fix-2.json');

// Print summary
let totalFixes = 0;
for (const [vid, fixes] of Object.entries(result)) {
  const n = Object.keys(fixes).length;
  if (n > 0) console.log(`  ${vid}: ${n} fixes`);
  totalFixes += n;
}
console.log(`Total segments fixed: ${totalFixes}`);

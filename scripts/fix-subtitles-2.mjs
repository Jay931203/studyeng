import fs from 'fs';

const data = JSON.parse(fs.readFileSync('src/data/subtitle-fix-batches/fix-2.json', 'utf8'));
const result = {};

// Helper: capitalize first letter only
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function low(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
function addPeriod(s) { return /[.?!]$/.test(s) ? s : s + '.'; }

// eD0oskR19oE - rap lyrics, intentional style, no fixes
result['eD0oskR19oE'] = {};

// eIho2S0ZahI - TED talk with broken line wrapping and all-lowercase mid-sentence starts
{
  const v = {};
  // Seg 2: "Can start a war..." continues from seg 1 "...the only one that"
  v['2'] = 'can start a war or say i love you and yet many people';
  // Seg 3: "Have the experience..." continues from seg 2
  v['3'] = 'have the experience that when they speak';
  // Seg 4: "People don't listen to them why is that" - two sentences, question
  v['4'] = "People don't listen to them. Why is that?";
  // Seg 5: "How can we speak powerfully" - question missing ?
  v['5'] = 'How can we speak powerfully?';
  // Seg 6: "To make change in the world what i'd like to suggest..." - continuation + new sentence
  v['6'] = "to make change in the world. What i'd like to suggest there are a number of";
  // Seg 7: "Habits that we need to move away from i've assembled..." - continuation + new sentence
  v['7'] = "habits that we need to move away from. I've assembled for your pleasure here seven";
  // Seg 8: "Deadly sins of speaking i'm not pretending..." - continuation + new sentence
  v['8'] = "deadly sins of speaking. I'm not pretending this is an exhaustive";
  // Seg 9: "List but these seven..." - continuation
  v['9'] = 'list but these seven i think are pretty large';
  // Seg 10: "Habits that we can all fall into" - continuation, add period
  v['10'] = 'habits that we can all fall into.';
  // Seg 12: "Who's not present not a nice habit..." - continuation from seg 11
  v['12'] = "who's not present, not a nice habit, and we know perfectly";
  // Seg 14: "About us" - continuation, lowercase, add period
  v['14'] = 'about us.';
  // Seg 16: "Hard to listen..." - continuation
  v['16'] = "hard to listen to somebody if you know that you're being judged and";
  // Seg 17: "Found wanting" - continuation, add period
  v['17'] = 'found wanting.';
  // Seg 19: "You can fall into this my mother..." - continuation + new sentence
  v['19'] = 'you can fall into this. My mother in the last years of her life became very very';
  // Seg 20: "Negative and it's hard to listen i remember..." - continuation + new sentence
  v['20'] = "negative and it's hard to listen. I remember one day i said to her";
  // Seg 22: "Said i know isn't it dreadful" - continuation from "she"
  v['22'] = "said i know, isn't it dreadful.";
  // Seg 26: "Art of the uk it's it's our national sport we complain..." - continuation + run-ons
  v['26'] = "art of the uk. It's our national sport. We complain about the weather";
  // Seg 30: "Lightness in the world" - continuation, add period
  v['30'] = 'lightness in the world.';
  // Seg 33: "Actions and again hard..." - continuation
  v['33'] = "actions, and again hard to listen to somebody who's being like that.";
  // Seg 43: "The confusion of facts with opinions" - continuation
  v['43'] = 'the confusion of facts with opinions.';
  // Seg 44: "When those two things get conflated..." - continuation
  v['44'] = "when those two things get conflated you're listening into the wind, you know";
  // Seg 46: "Opinions as if they were true it's difficult..." - continuation + run-on
  v['46'] = "opinions as if they were true. It's difficult to listen to that. So here";
  // Seg 47: "They are seven deadly sins..." - continuation
  v['47'] = 'they are seven deadly sins of speaking. These are';
  // Seg 48: "Things i think we need to avoid" - continuation, add period
  v['48'] = 'things i think we need to avoid.';
  // Seg 50: "About this yes there is i'd like to suggest..." - continuation + run-on
  v['50'] = "about this? Yes, there is. I'd like to suggest that there are four";
  // Seg 51: "Really powerful cornerstones..." - continuation
  v['51'] = 'really powerful cornerstones, foundations that we can';
  // Seg 52: "Stand on if we want..." - continuation
  v['52'] = 'stand on if we want our speech to be powerful and';
  // Seg 53: "To make change in the world" - continuation, add period
  v['53'] = 'to make change in the world.';
  // Seg 55: "Definition as well i'm not talking..." - continuation + new sentence
  v['55'] = "definition as well. I'm not talking about the stuff that falls from the sky and hits you on";
  // Seg 56: "The head i'm talking about..." - continuation + new sentence
  v['56'] = "the head. I'm talking about this definition: to greet or acclaim";
  // Seg 57: "Enthusiastically which is i think..." - continuation
  v['57'] = 'enthusiastically, which is i think how our words will be received';
  // Seg 58: "If we stand on these four things so what" - continuation
  v['58'] = 'if we stand on these four things. So what';
  // Seg 59: "Do they stand for" - continuation, question
  v['59'] = 'do they stand for?';
  // Seg 61: "Of course being true in what you say" - continuation, add period
  v['61'] = 'of course being true in what you say.';
  // Seg 62: "Being straight and clear the a is authenticity..." - continuation + new sentence
  v['62'] = 'being straight and clear. The a is authenticity, just being';
  // Seg 63: "Yourself a friend of mine described it..." - continuation + new sentence
  v['63'] = 'yourself. A friend of mine described it as standing in your own truth, which i think';
  // Seg 64: "Is a lovely way to put it the i is integrity..." - continuation + new sentence
  v['64'] = 'is a lovely way to put it. The i is integrity, being your word,';
  // Seg 67: "Is love i don't mean romantic love" - continuation + new sentence
  v['67'] = "is love. I don't mean romantic love";
  // Seg 69: "Two reasons first of all i think..." - continuation
  v['69'] = 'two reasons. First of all, i think absolute honesty may not be what we want.';
  // Seg 71: "Morning" - continuation, add period
  v['71'] = 'morning.';
  // Seg 73: "Tempered with love of course honesty is a great thing" - two sentences
  v['73'] = 'Tempered with love, of course. Honesty is a great thing.';
  // Seg 76: "Two things" - continuation
  v['76'] = 'two things.';
  // Seg 77: "Simultaneously so hail" - continuation
  v['77'] = 'simultaneously. So, hail.';
  // Seg 79: "It's also the way..." - continuation + run-ons
  v['79'] = "it's also the way that you say it. You have an amazing toolbox. This";
  // Seg 80: "Instrument is incredible..." - continuation
  v['80'] = 'instrument is incredible and yet this is a toolbox that very few';
  // Seg 81: "People have ever opened i'd like to..." - continuation + new sentence
  v['81'] = "people have ever opened. I'd like to have a little rummage in there with you now and just pull a few";
  // Seg 82: "Tools out that you might like..." - continuation
  v['82'] = 'tools out that you might like to take away and play with,';
  // Seg 83: "Which will increase the power of your" - continuation
  v['83'] = 'which will increase the power of your';
  // Seg 84: "Speaking register for example" - continuation
  v['84'] = 'speaking. Register, for example.';
  // Seg 86: "Useful most of the time but there's a register in between i'm" - continuation + new sentence
  v['86'] = "useful most of the time. But there's a register in between. I'm";
  // Seg 87: "Not going to get very technical..." - continuation
  v['87'] = 'not going to get very technical about this. For any of you who are voice coaches,';
  // Seg 89: "The difference if i go down here..." - continuation + new sentence
  v['89'] = 'the difference. If i go down here in my throat, which is where';
  // Seg 90: "Most of us speak from most of the time but" - continuation, add period
  v['90'] = 'most of us speak from most of the time. But';
  // Seg 92: "You hear the difference we vote for" - two sentences
  v['92'] = 'You hear the difference. We vote for';
  // Seg 93: "Politicians with lower voices it's true because we" - run-on
  v['93'] = "politicians with lower voices. It's true because we";
  // Seg 95: "Depth with power and with authority" - continuation, add period
  v['95'] = 'depth with power and with authority.';
  // Seg 97: "The way your voice feels again the research shows..." - continuation + run-on
  v['97'] = 'the way your voice feels. Again, the research shows that we prefer voices';
  // Seg 101: "Because you can train go get a voice coach..." - continuation + run-on
  v['101'] = 'because you can train. Go get a voice coach, and there are amazing things you';
  // Seg 102: "Can do with breathing with posture..." - continuation
  v['102'] = 'can do with breathing, with posture and with exercises to improve the timbre';
  // Seg 103: "Of your voice then prozody i love prozadie this is the" - continuation + run-on (note: keeping original spelling per rules)
  v['103'] = 'of your voice. Then prozody. I love prozadie. This is the';
  // Seg 104: "Sing-song the meta language..." - continuation, add period
  v['104'] = 'sing-song, the meta language that we use in order to impart meaning.';
  // Seg 106: "One note are really quite hard to listen to if" - continuation
  v['106'] = 'one note are really quite hard to listen to. If';
  // Seg 107: "They don't have any prosody at all that's where..." - continuation + run-on
  v['107'] = "they don't have any prosody at all. That's where the word monotonic comes";
  // Seg 109: "Monotone also we have repetitive" - continuation + new sentence
  v['109'] = 'monotone. Also we have repetitive';
  // Seg 113: "To communicate through prosidy which i" - continuation
  v['113'] = 'to communicate through prosidy, which i';
  // Seg 114: "Think is a shame" - continuation, add period
  v['114'] = 'think is a shame.';
  // Seg 116: "Pace i can get very very excited by" - new sentence after period
  v['116'] = 'Pace. I can get very very excited by';
  // Seg 121: "There's nothing wrong with a bit of silence in a talk is there" - question
  v['121'] = "There's nothing wrong with a bit of silence in a talk, is there?";
  // Seg 124: "Of course pitch" - continuation + new topic
  v['124'] = 'of course. Pitch';
  // Seg 125: "Often goes along with pace to indicate arousal but you can do it just with pitch" - continuation, add period
  v['125'] = 'often goes along with pace to indicate arousal, but you can do it just with pitch.';
  // Seg 129: "And finally volume i can get really" - add comma
  v['129'] = 'And finally, volume. I can get really';
  // Seg 133: "By getting very quiet some people broadcast the whole time try" - run-on
  v['133'] = 'by getting very quiet. Some people broadcast the whole time. Try';
  // Seg 136: "Carelessly and inconsiderately not nice of course" - continuation, add period
  v['136'] = 'carelessly and inconsiderately. Not nice, of course.';
  // Seg 138: "Important to do it might be standing..." - continuation + new sentence
  v['138'] = 'important to do. It might be standing on a stage like this and giving a talk to';
  // Seg 139: "People it might be proposing marriage asking" - continuation + run-on
  v['139'] = 'people, it might be proposing marriage, asking';
  // Seg 141: "A wedding speech whatever it is if it's" - continuation
  v['141'] = "a wedding speech, whatever it is. If it's";
  // Seg 142: "Really important you owe it to yourself" - continuation
  v['142'] = 'really important, you owe it to yourself';
  // Seg 143: "To look at this toolbox and the engine" - continuation
  v['143'] = 'to look at this toolbox and the engine';
  // Seg 144: "That it's going to work on and no engine" - continuation
  v['144'] = "that it's going to work on. And no engine";
  // Seg 145: "Works well without being warmed up" - continuation, add period
  v['145'] = 'works well without being warmed up.';
  // Seg 148: "Six vocal warm-up exercises" - continuation
  v['148'] = 'six vocal warm-up exercises';
  // Seg 149: "That i do before every talk i ever do" - continuation, add period
  v['149'] = 'that i do before every talk i ever do.';
  // Seg 165: "Next time you speak do those in advance..." - run-on
  v['165'] = 'Next time you speak, do those in advance. Now let me just put this in context to';
  // Seg 166: "Close this is a serious point here this is" - continuation + run-on
  v['166'] = 'close. This is a serious point here. This is';
  // Seg 167: "Where we are now right we speak not very well" - continuation + run-on
  v['167'] = 'where we are now, right. We speak not very well';
  // Seg 168: "Into people who simply aren't listening..." - continuation
  v['168'] = "into people who simply aren't listening in an environment that's all about noise";
  // Seg 170: "Different phases what would the world be like if we were" - continuation + run-on
  v['170'] = 'different phases. What would the world be like if we were';
  // Seg 172: "In environments which were actually fit for purpose or to make that a bit" - continuation
  v['172'] = 'in environments which were actually fit for purpose? Or to make that a bit';
  // Seg 173: "Larger what would the world be like if we were" - continuation
  v['173'] = 'larger, what would the world be like if we were';
  // Seg 175: "Consciously for sound that would be a" - continuation + new sentence
  v['175'] = 'consciously for sound. That would be a';
  // Seg 176: "World that does sound beautiful" - continuation, add period
  v['176'] = 'world that does sound beautiful.';
  // Seg 178: "And one where understanding would be the" - continuation
  v['178'] = 'and one where understanding would be the';
  // Seg 179: "Norm and that is an idea worth spreading" - continuation, add period
  v['179'] = 'norm and that is an idea worth spreading.';
  result['eIho2S0ZahI'] = v;
}

// eiyfwZVAzGw - only seg 0: "Imagine you're holding" - no end punct but likely mid-sentence, no fix
result['eiyfwZVAzGw'] = {};

// ekzHIouo8Q4 - song lyrics, looks properly punctuated
result['ekzHIouo8Q4'] = {};

// ELZNClmKX1E - song lyrics, looks fine
result['ELZNClmKX1E'] = {};

// eNvUS-6PTbs - song lyrics
result['eNvUS-6PTbs'] = {};

// Eo-KmOd3i7s - song lyrics
result['Eo-KmOd3i7s'] = {};

// ep-ieEG06qg - dialogue
{
  const v = {};
  // Seg 0: "a 40 pound gizmo for over a month He said you're smart I like to think so And"
  // run-ons: lowercase start + multiple sentences
  v['0'] = "a 40 pound gizmo for over a month. He said you're smart. I like to think so. And";
  // Seg 1: "you want to learn this business Yes sir I want to learn this business Have you already started learning on your own Absolutely"
  v['1'] = 'you want to learn this business? Yes sir. I want to learn this business. Have you already started learning on your own? Absolutely.';
  // Seg 3: "How many times have you seen Chris Oh I don't know One too many apparently"
  v['3'] = "How many times have you seen Chris? Oh, I don't know. One too many, apparently.";
  // Seg 4: "Was he ever dressed like this No No Jacket and tie"
  v['4'] = 'Was he ever dressed like this? No. No. Jacket and tie.';
  // Seg 5: "First in your class In school"
  v['5'] = 'First in your class? In school?';
  // Seg 6: "High school Yes sir How many in the class"
  v['6'] = 'High school. Yes sir. How many in the class?';
  // Seg 7: "Twelve It was a small town"
  v['7'] = 'Twelve. It was a small town.';
  // Seg 8: "I'll say But I was also first in my radar class in the Navy And that was a class of 20"
  v['8'] = "I'll say. But I was also first in my radar class in the Navy. And that was a class of 20.";
  // Seg 9: "Can I say something" - question
  v['9'] = 'Can I say something?';
  // Seg 10: "I'm the type of person if you ask me a question and I don't know the answer"
  // Missing period at end — it continues to seg 11, likely intentional mid-sentence
  // Seg 11: "I'm going to tell you that I don't know But I bet you what I know how to find the answer"
  v['11'] = "I'm going to tell you that I don't know. But I bet you what, I know how to find the answer.";
  result['ep-ieEG06qg'] = v;
}

// eVFd46qABi0 - just "it's the", "it's", "foreign", "it's" - no real fixes
result['eVFd46qABi0'] = {};

// Exy0UATpXtY - poem/song, all lowercase, run-ons
{
  const v = {};
  // Seg 0: "doing all he can Sam Winchester so full of life running" - continuation (starts mid-sentence)
  // Seg 2: "a mission teaching his boys the art of attrition Mary Winchester" - run-on names
  // These are clearly intentional poetic run-ons. Skip.
  result['Exy0UATpXtY'] = {};
}

// fbcUl7GhCTg - song
{
  const v = {};
  // Seg 1: "there's so much that I can't see" - lowercase start (continuation from "City of stars")
  // Seg 2: "Who knows is this the start of something wonderful" - question
  v['2'] = 'Who knows? Is this the start of something wonderful';
  result['fbcUl7GhCTg'] = v;
}

// fh3_g8NJc58 - dialogue, all lowercase run-ons
{
  const v = {};
  // Seg 0: "who are you what what do you remember about last night I went out went to a"
  v['0'] = 'Who are you? What, what do you remember about last night? I went out, went to a';
  // Seg 1: "bar had a few shots in it and I blacked out you decide to drive home last night"
  v['1'] = 'bar, had a few shots in it and I blacked out. You decide to drive home last night?';
  // Seg 2: "you went through a pedestrian crossing and killed a family of three oh my god"
  v['2'] = 'You went through a pedestrian crossing and killed a family of three. Oh my god.';
  // Seg 3: "I'm obliged to tell you that you are under arrest oh my god really I'm also"
  v['3'] = "I'm obliged to tell you that you are under arrest. Oh my god. Really? I'm also";
  // Seg 4: "obliged to give you this it's a tactical UAV you get it for a three kill streak"
  v['4'] = "obliged to give you this. It's a tactical UAV. You get it for a three kill streak.";
  // Seg 5: "two more you would have gotten a predator missile and that would have been really cool"
  v['5'] = 'Two more and you would have gotten a predator missile, and that would have been really cool.';
  result['fh3_g8NJc58'] = v;
}

// FizqEuhUiB8 - dialogue
{
  const v = {};
  // Seg 0: "On your feet Face the wall" - two sentences
  v['0'] = 'On your feet. Face the wall.';
  // Seg 2: "Forward Contraband" - two words, two sentences
  v['2'] = 'Forward. Contraband.';
  // Seg 3: "Pleased to see you reading this Any favorite passages" - question
  v['3'] = 'Pleased to see you reading this. Any favorite passages?';
  result['FizqEuhUiB8'] = v;
}

// fjoO5927p80 - movie dialogue, run-ons
{
  const v = {};
  // Seg 0: "about everyone That's why her hair is so big it's full of secrets"
  v['0'] = "about everyone. That's why her hair is so big. It's full of secrets.";
  // Seg 1: "An evil takes a human form in Regina George Don't be fooled because she may seem like your typical"
  v['1'] = "An evil takes a human form in Regina George. Don't be fooled because she may seem like your typical";
  // Seg 2: "selfish backstabbing slut faced ho bag but in reality she is so much more than that She's"
  v['2'] = "selfish backstabbing slut-faced ho-bag. But in reality she is so much more than that. She's";
  // Seg 3: "the Queen Bee the star Those other two are just her little workers Regina George How do I"
  v['3'] = 'the Queen Bee, the star. Those other two are just her little workers. Regina George. How do I';
  // Seg 4: "even begin to explain Regina George Regina George is flawless She has two Fendi purses and"
  v['4'] = 'even begin to explain Regina George? Regina George is flawless. She has two Fendi purses and';
  // Seg 5: "a silver Lexus I hear her hair is insured for 10 000 I hear she does car commercials in Japan Her"
  v['5'] = 'a silver Lexus. I hear her hair is insured for 10,000. I hear she does car commercials in Japan. Her';
  // Seg 6: "favorite movie is Varsity Blues One time she met John Stamos on a plane and he told her she was pretty One time she"
  v['6'] = 'favorite movie is Varsity Blues. One time she met John Stamos on a plane and he told her she was pretty. One time she';
  // Seg 8: "It was awesome She always looks fierce She always wins Spring Fling Queen Who cares I"
  v['8'] = 'It was awesome. She always looks fierce. She always wins Spring Fling Queen. Who cares? I';
  // Seg 9: "care Every year the seniors throw this dance for the underclassmen called the Spring Fling..."
  v['9'] = 'care. Every year the seniors throw this dance for the underclassmen called the Spring Fling, and whosoever is elected Spring';
  // Seg 10: "Fling King and Queen automatically becomes head of..."
  v['10'] = 'Fling King and Queen automatically becomes head of the Student Activities Committee, and since I am an active member of the Student Activities Committee';
  result['fjoO5927p80'] = v;
}

// fLexgOxsZu0 - song, looks fine
result['fLexgOxsZu0'] = {};

// fLJsdqxnZb0 - TED talk, run-ons, broken lines
{
  const v = {};
  // Seg 0: "When I was seven years old and my sister" - fine
  // Seg 1: "Was just five years old we were playing" - continuation, lowercase
  v['1'] = 'was just five years old we were playing';
  // Seg 2: "On top of a bunk bed I was two years" - continuation, lowercase
  v['2'] = 'on top of a bunk bed. I was two years';
  // Seg 3: "Older than my sister at the time I'm two" - continuation, lowercase
  v['3'] = "older than my sister at the time. I'm two";
  // Seg 4: "Years older than her now but but at the time that meant she had to do everything" - continuation, lowercase
  v['4'] = 'years older than her now, but at the time that meant she had to do everything';
  // Seg 5: "That I wanted to do and I wanted to play war so we were up on top of our bunk" - continuation, lowercase
  v['5'] = 'that I wanted to do. And I wanted to play war. So we were up on top of our bunk';
  // Seg 6: "Beds and on one side of the bunk bed I" - continuation, lowercase
  v['6'] = 'beds. And on one side of the bunk bed I';
  // Seg 7: "Had put out all my GI Joe soldiers and" - continuation, lowercase
  v['7'] = 'had put out all my GI Joe soldiers and';
  // Seg 8: "Weaponry and on the other side we're all" - continuation, lowercase
  v['8'] = "weaponry. And on the other side we're all";
  // Seg 9: "My sisters Milo's and ponies and ready for a cavalry charge there are differing" - continuation, lowercase + run-on
  v['9'] = "my sister's Milo's and ponies, ready for a cavalry charge. There are differing";
  // Seg 10: "Accounts of what actually happened that afternoon but since my sister is not" - continuation, lowercase
  v['10'] = 'accounts of what actually happened that afternoon. But since my sister is not';
  // Seg 12: "Let me tell you the true story which is" - continuation, lowercase
  v['12'] = 'let me tell you the true story, which is';
  // Seg 13: "My sister's a little bit on the clumsy side and somehow without any help or" - continuation, lowercase
  v['13'] = "my sister's a little bit on the clumsy side. And somehow, without any help or";
  // Seg 14: "Push from her older brother at all suddenly Amy disappeared off of the top" - continuation, lowercase
  v['14'] = 'push from her older brother at all, suddenly Amy disappeared off of the top';
  // Seg 15: "Of the bunk bed and landed with this crash on the floor and i nervous Lee" - continuation, lowercase
  v['15'] = 'of the bunk bed and landed with this crash on the floor. And I nervously';
  // Seg 16: "Peered over the side of the bed to see what had befallen my fallen sister and" - continuation, lowercase
  v['16'] = 'peered over the side of the bed to see what had befallen my fallen sister and';
  // Seg 17: "Saw that she landed painfully on her hands and knees on all fours on the" - continuation, lowercase
  v['17'] = 'saw that she landed painfully on her hands and knees on all fours on the';
  // Seg 18: "Ground I was nervous because my parents" - continuation, lowercase + new sentence
  v['18'] = 'ground. I was nervous because my parents';
  // Seg 19: "Had charged me with making sure that my" - continuation, lowercase
  v['19'] = 'had charged me with making sure that my';
  // Seg 20: "Sister and I played as safely and as" - continuation, lowercase
  v['20'] = 'sister and I played as safely and as';
  // Seg 21: "Quietly as possible and seeing as how I" - continuation, lowercase
  v['21'] = 'quietly as possible. And seeing as how I';
  // Seg 22: "Had accidentally broken Amy's arm just one week before" - continuation, lowercase
  v['22'] = "had accidentally broken Amy's arm just one week before,";
  // Seg 23: "Heroically pushing her out of the way of" - continuation, lowercase
  v['23'] = 'heroically pushing her out of the way of';
  // Seg 24: "An oncoming imaginary sniper bullet for" - continuation, lowercase
  v['24'] = 'an oncoming imaginary sniper bullet —';
  // Seg 25: "Which I have yet to be thanked I was trying as hard as I could she didn't" - continuation, lowercase + run-on
  v['25'] = "which I have yet to be thanked. I was trying as hard as I could. She didn't";
  // Seg 26: "Even see it coming I was trying as hard as I could to be on my best behavior and" - continuation, lowercase + run-on
  v['26'] = "even see it coming. I was trying as hard as I could to be on my best behavior. And";
  // Seg 27: "I saw my sister's faces wail but pain and suffering and surprise threatening" - continuation, lowercase
  v['27'] = "I saw my sister's face — wail, pain and suffering and surprise threatening";
  // Seg 28: "To erupt from her mouth and threatening to wake my parents from the long winters" - continuation, lowercase
  v['28'] = 'to erupt from her mouth and threatening to wake my parents from the long winter\'s';
  // Seg 29: "Nap for which they had settled so I did the only thing my little frantic" - continuation, lowercase
  v['29'] = 'nap for which they had settled. So I did the only thing my little frantic';
  // Seg 30: "Seven-year-old brain could think to do to avert this tragedy if you have" - continuation, lowercase
  v['30'] = 'seven-year-old brain could think to do to avert this tragedy. If you have';
  // Seg 31: "Children you've seen this hundreds of times before I said Amy Amy wait don't" - continuation, lowercase + run-on
  v['31'] = "children, you've seen this hundreds of times before. I said, Amy, Amy, wait. Don't";
  // Seg 32: "Cry don't cry did you see how you landed" - continuation, lowercase + run-on
  v['32'] = "cry. Don't cry. Did you see how you landed?";
  // Seg 34: "Amy I think this means you're a unicorn" - direct address comma
  v['34'] = "Amy, I think this means you're a unicorn.";
  // Seg 35: "Now that was cheating because there's nothing in the world my sister would" - new sentence, fine
  // Seg 36: "Want more than not to be Amy the hurt five-year-old little sister but Amy the" - continuation, lowercase
  v['36'] = "want more than not to be Amy the hurt five-year-old little sister, but Amy the";
  // Seg 37: "Special unicorn of course this was an option that was open to her brain and no" - continuation, lowercase + run-on
  v['37'] = "special unicorn. Of course this was an option that was open to her brain, and no";
  // Seg 38: "Point in the past and you could see on my poor manipulated sister's face" - continuation, lowercase
  v['38'] = "point in the past. And you could see on my poor manipulated sister's face";
  // Seg 39: "Conflict as their little brain attempted to devote resources to feeling the pain" - continuation, lowercase
  v['39'] = 'conflict as her little brain attempted to devote resources to feeling the pain';
  // Seg 40: "And suffering surprise she just" - continuation, lowercase
  v['40'] = 'and suffering, surprise. She just';
  // Seg 41: "Experienced or contemplating her" - continuation, lowercase
  v['41'] = 'experienced, or contemplating her';
  // Seg 42: "Newfound identity as a unicorn and the latter one now instead of crying instead" - continuation, lowercase + run-on
  v['42'] = 'newfound identity as a unicorn. And the latter one won. Instead of crying, instead';
  // Seg 43: "Of ceasing our Plains to have waking my parents with all the negative" - continuation, lowercase
  v['43'] = 'of causing her plains to wail, waking my parents with all the negative';
  // Seg 44: "Consequences that would have been sued for me and says smile spread across her" - continuation, lowercase
  v['44'] = 'consequences that would have ensued for me, a smile spread across her';
  // Seg 45: "Face and she scrambled right back up onto the bunk bed with all the grace of a baby unicorn" - continuation, lowercase + period
  v['45'] = 'face. And she scrambled right back up onto the bunk bed with all the grace of a baby unicorn';
  // Seg 46: "With one broken Lake what we stumbled" - continuation, lowercase
  v['46'] = 'with one broken leg. What we stumbled';
  // Seg 47: "Across at this tender age which is five and seven we had no idea at the time was" - continuation, lowercase
  v['47'] = 'across at this tender age, which is five and seven, we had no idea at the time was';
  // Seg 48: "Something that was going to be at the vanguard of a scientific revolution" - continuation, lowercase
  v['48'] = 'something that was going to be at the vanguard of a scientific revolution';
  // Seg 49: "Occurring two decades later in the way that we look at the human brain what we" - continuation, lowercase
  v['49'] = 'occurring two decades later in the way that we look at the human brain. What we';
  // Seg 50: "Had stumbled across is something called positive psychology which is the reason" - continuation, lowercase
  v['50'] = 'had stumbled across is something called positive psychology, which is the reason';
  // Seg 51: "That I'm here today and the reason that I wake up every morning when I first" - continuation, lowercase
  v['51'] = "that I'm here today and the reason that I wake up every morning. When I first";
  // Seg 52: "Started talking about this research outside of academia out with companies" - continuation, lowercase
  v['52'] = 'started talking about this research outside of academia, out with companies';
  // Seg 53-55 complex technical, skip for safety
  // Seg 55: graph description — skip
  // Remaining: complex run-ons in long lecture. Focusing on clearest fixes only.
  result['fLJsdqxnZb0'] = v;
}

// FLTOiQ8gXp4 - comedy roast, run-ons
{
  const v = {};
  // Seg 0: "Sorry but he just screams It's kind of true" - run-on
  v['0'] = "Sorry, but he just screams. It's kind of true.";
  // Seg 1: "Jon Hamm is a soft boy with a dad bod Hashtag truth" - period
  v['1'] = 'Jon Hamm is a soft boy with a dad bod. Hashtag truth.';
  // Seg 2: "You Chris Rock you on grownups too" - question/statement?
  v['2'] = 'You, Chris Rock, you on grownups too?';
  // Seg 3: "Well if you lost all your money in divorce you'd be on grownups too too"
  v['3'] = "Well, if you lost all your money in divorce, you'd be on grownups too, too.";
  // Seg 4: "I'd rather plant poison ivy plants in my anus before hearing another word about Kim Kardashian Go"
  v['4'] = "I'd rather plant poison ivy plants in my anus before hearing another word about Kim Kardashian. Go";
  // Seg 5: "ahead and do that please Maisie Williams looks like a very young grandma"
  v['5'] = 'ahead and do that, please. Maisie Williams looks like a very young grandma.';
  // Seg 6: "Hashtag David Harbour Hey I'm ready to be punched in the face Bring it bag"
  v['6'] = "Hashtag David Harbour. Hey, I'm ready to be punched in the face. Bring it, bag.";
  // Seg 8: "I just cut a fart that smells so bad they added David Spade as a supporting character"
  v['8'] = 'I just cut a fart that smells so bad they added David Spade as a supporting character.';
  // Seg 9: "That's not bad I actually auditioned for that I didn't know if I got it Jake Gyllenhaal's d**k smells"
  v['9'] = "That's not bad. I actually auditioned for that. I didn't know if I got it. Jake Gyllenhaal's d**k smells";
  result['FLTOiQ8gXp4'] = v;
}

// fO4ViYDw2l8 - song, intentional style
result['fO4ViYDw2l8'] = {};

// fPwDR1Qo1GM - song, looks fine
result['fPwDR1Qo1GM'] = {};

// FrkEDe6Ljqs - song, fine
result['FrkEDe6Ljqs'] = {};

// FrLequ6dUdM - song, fine
result['FrLequ6dUdM'] = {};

// FS1Wts11oX0 - movie dialogue
{
  const v = {};
  // Seg 1: "Casita Get me up there" - two sentences
  v['1'] = 'Casita. Get me up there.';
  // Seg 2: "Antonio We gotta get out of here" - direct address
  v['2'] = 'Antonio, we gotta get out of here.';
  // Seg 4: "Antonio Antonio" - direct address repetition
  v['4'] = 'Antonio! Antonio!';
  result['FS1Wts11oX0'] = v;
}

// FTQbiNvZqaY - song (Africa by Toto), looks fine
result['FTQbiNvZqaY'] = {};

// f_kgZFdt5B0 - dialogue
{
  const v = {};
  // Seg 1: "It's like 400 here" - fine
  // Seg 2: "You got some crazy lip on you old man your life worth 400 bucks" - run-on
  v['2'] = 'You got some crazy lip on you, old man. Your life worth 400 bucks?';
  // Seg 3: "Duco time to bounce. Yeah, go go" - fine, has period
  v['3'] = 'Duco, time to bounce. Yeah, go, go.';
  // Seg 4: "Yeah, one lucky old man" - add period
  v['4'] = 'Yeah, one lucky old man.';
  result['f_kgZFdt5B0'] = v;
}

// G4hXSY1JgNQ - monologue, fine overall
{
  const v = {};
  // Seg 8: "a lot of weed. I never cared for weed. But they smell a lot of weed, and you smell a" - fine
  // Seg 9: "lot of, you smell pee, and pizza, and occasional..." - ends with ellipsis, fine
  result['G4hXSY1JgNQ'] = {};
}

// G7KNmW9a75Y - song, fine
result['G7KNmW9a75Y'] = {};

// Ghd2bkIadG4 - song
result['Ghd2bkIadG4'] = {};

// GIUhpzv47YQ - movie dialogue
{
  const v = {};
  // Seg 0: "Stay Huh Huh" - run-on
  v['0'] = 'Stay. Huh? Huh?';
  // Seg 1: "Come on Come on Murph Murph Murph come on What's his name What's his name" - run-on + direct address
  v['1'] = "Come on. Come on, Murph. Murph. Murph, come on. What's his name? What's his name?";
  // Seg 3: "Stay" - add period or !
  v['3'] = 'Stay.';
  // Seg 4: "Stay" - add period
  v['4'] = 'Stay.';
  // Seg 5: "Stay" - add period
  v['5'] = 'Stay.';
  result['GIUhpzv47YQ'] = v;
}

// gJ_cx3AmCuI - movie dialogue, run-ons
{
  const v = {};
  // Seg 0: "You've been on my payroll a long time Rone that ain't right Shut up"
  v['0'] = "You've been on my payroll a long time, Rone. That ain't right. Shut up.";
  // Seg 1: "I got one last job for you detective"
  v['1'] = 'I got one last job for you, detective.';
  // Seg 2: "You hear me Look we've been all through this Yeah Yeah and I said I can't do it"
  v['2'] = "You hear me? Look, we've been all through this. Yeah. Yeah, and I said I can't do it.";
  // Seg 3: "That's the wrong answer To the table"
  v['3'] = "That's the wrong answer. To the table.";
  // Seg 4: "I'm a detective Verone You can do anything to me The whole force is gonna be on your ass in a"
  v['4'] = "I'm a detective, Verone. You can do anything to me. The whole force is gonna be on your ass in a";
  // Seg 5: "minute Shut your mouth Fat piece of shit Stop right now"
  v['5'] = 'minute. Shut your mouth. Fat piece of shit. Stop right now.';
  // Seg 6: "All right What the hell What the hell is it Sit down"
  v['6'] = 'All right. What the hell? What the hell is it? Sit down.';
  // Seg 7: "You regret this Stop right now Once the bucket gets hot enough detective the"
  v['7'] = 'You regret this? Stop right now. Once the bucket gets hot enough, detective, the';
  // Seg 8: "rat is gonna want out"
  v['8'] = 'rat is gonna want out.';
  result['gJ_cx3AmCuI'] = v;
}

// GkD20ajVxnY - song, fine
result['GkD20ajVxnY'] = {};

// gNi_6U5Pm_o - song
{
  const v = {};
  // Seg 4: "Well, good for you, you look happy and healthy, naughty" - 'naughty' seems odd but don't change words
  result['gNi_6U5Pm_o'] = {};
}

// gO8N3L_aERg - monologue
{
  const v = {};
  // Seg 0: "Last week I give a fire safety talk" - fine (wrong tense but don't change words)
  result['gO8N3L_aERg'] = {};
}

// gOxG6HSicwk - Friends dialogue, all lowercase, run-ons
{
  const v = {};
  // Seg 0: "So dr. green how's the old boat they" - direct address missing comma
  v['0'] = "So, Dr. Green, how's the old boat? They";
  // Seg 1: "Found rust" - continuation, lowercase
  v['1'] = 'found rust.';
  // Seg 2: "You know what rust does to a boat gives" - run-on
  v['2'] = 'You know what rust does to a boat?';
  // Seg 3: "Rust is boat cancer Ross" - direct address
  v['3'] = 'Rust is boat cancer, Ross.';
  // Seg 4: "Well I'm sorry when I was a kid I lost a" - run-on
  v['4'] = "Well, I'm sorry. When I was a kid, I lost a";
  // Seg 5: "Bike to that excuse me for a moment will" - run-on
  v['5'] = 'bike to that. Excuse me for a moment. Will';
  // Seg 6: "You please I want to say good night to" - continuation, lowercase + run-on
  v['6'] = 'you please? I want to say good night to';
  // Seg 7: "The Levine's" - continuation, lowercase
  v['7'] = "the Levine's.";
  // Seg 8: "Okay oh I think your dad must have added" - run-on
  v['8'] = "Okay. Oh, I think your dad must have added";
  // Seg 9: "Wrong he only tipped like 4% yeah that's" - continuation, lowercase + run-on
  v['9'] = "wrong. He only tipped like 4%. Yeah, that's";
  // Seg 10: "Daddy that's daddy what doesn't it" - run-on
  v['10'] = "Daddy. That's Daddy. What, doesn't it";
  // Seg 11: "Bother you you're a waitress yes it bothers me Ross but you know if he was a" - run-on + direct address
  v['11'] = "bother you? You're a waitress. Yes, it bothers me, Ross. But you know, if he was a";
  // Seg 12: "Regular at the coffee house I'd be" - continuation, lowercase
  v['12'] = "regular at the coffee house, I'd be";
  // Seg 13: "Serving him sneezers so so Ross I bugged" - continuation, lowercase + direct address
  v['13'] = 'serving him sneezers. So, so, Ross, I bugged';
  // Seg 14: "Him about this a million times he's not" - continuation, lowercase + run-on
  v['14'] = "him about this a million times. He's not";
  // Seg 15: "Gonna change do really circles lasers" - continuation, lowercase
  v['15'] = "gonna change. Do, really? Circles, lasers?";
  // Seg 17: "All right kids ready wait wait wait wait" - run-on + direct address
  v['17'] = 'All right, kids, ready? Wait, wait, wait, wait.';
  // Seg 18: "I think I forgot my receipt you don't" - run-on
  v['18'] = "I think I forgot my receipt. You don't";
  // Seg 19: "Need that the carbon it's messy I mean" - continuation, lowercase + run-on
  v['19'] = "need that. The carbon, it's messy. I mean,";
  // Seg 20: "Gets on your fingers and causes the the" - continuation, lowercase
  v['20'] = 'gets on your fingers and causes the the';
  // Seg 21: "Night blindness what is this you put a" - continuation, lowercase + run-on
  v['21'] = 'night blindness. What is this? You put a';
  // Seg 22: "Twenty-dollar oh yeah that would be me I" - continuation, lowercase
  v['22'] = 'twenty dollar? Oh yeah, that would be me. I';
  // Seg 23: "Have I have a problem like I tip way too" - run-on
  v['23'] = 'have — I have a problem. Like, I tip way too';
  // Seg 24: "Much way way too much" - continuation, lowercase
  v['24'] = 'much. Way, way too much.';
  // Seg 25: "It's a sickness really yeah it is it is" - run-on
  v['25'] = "It's a sickness, really. Yeah, it is. It is.";
  // Seg 26: "We really really don't excuse me" - run-on
  v['26'] = "We really really don't. Excuse me.";
  // Seg 27: "You think I'm cheap really nothing I do" - run-on
  v['27'] = "You think I'm cheap? Really? Nothing I do";
  // Seg 28: "Means anything really" - continuation, lowercase
  v['28'] = 'means anything, really?';
  // Seg 29: "This is nice I paid $200 for then are" - run-on
  v['29'] = 'This is nice. I paid $200 for then. Are';
  // Seg 30: "You put down 20 and you come out looking like mr. bigshot" - continuation, lowercase
  v['30'] = 'you put down 20 and you come out looking like Mr. Bigshot?';
  // Seg 31: "You really want to be mr. big oh yeah" - run-on
  v['31'] = 'You really want to be Mr. Big? Oh yeah?';
  // Seg 32: "I'll tell you what you pay the whole" - run-on
  v['32'] = "I'll tell you what. You pay the whole";
  // Seg 33: "Bill mr. bigshot right well mr. bigshot" - continuation, lowercase
  v['33'] = 'bill, Mr. Bigshot. Right. Well, Mr. Bigshot';
  // Seg 34: "Is better than went head" - continuation, lowercase
  v['34'] = 'is better than, went ahead.';
  result['gOxG6HSicwk'] = v;
}

// gPoiv0sZ4s4 - song, fine
result['gPoiv0sZ4s4'] = {};

// GQMlWwIXg3M - song, fine
result['GQMlWwIXg3M'] = {};

// GVuh1lfrEwE - song, fine
result['GVuh1lfrEwE'] = {};

// GXJifYl_byU - song, fine
result['GXJifYl_byU'] = {};

// Gzi8k9nBrdU - Ted Lasso dialogue
{
  const v = {};
  // Seg 0: "What the fuck are you doing What are you talking about" - run-on
  v['0'] = 'What the fuck are you doing? What are you talking about?';
  // Seg 1: "He's out there doing really fucking nuts Yeah but I've got two players on him already Take him out"
  v['1'] = "He's out there doing really fucking nuts. Yeah, but I've got two players on him already. Take him out.";
  // Seg 2: "Are you joking Get rid of him This is remarkable Rupert Mannion demonstrating"
  v['2'] = 'Are you joking? Get rid of him. This is remarkable. Rupert Mannion demonstrating';
  // Seg 3: "with his own manager on the pitch You don't see this very often Well not since the invention of telephones at least"
  v['3'] = "with his own manager on the pitch. You don't see this very often. Well, not since the invention of telephones, at least.";
  // Seg 4: "I'm not playing the game like that You do what I say or you are done"
  v['4'] = "I'm not playing the game like that. You do what I say or you are done.";
  // Seg 5: "Fuck off Oh dear Those ugly scenes at Nelson Road Rupert"
  v['5'] = 'Fuck off. Oh dear. Those ugly scenes at Nelson Road. Rupert';
  // Seg 6: "Mannion's nuts And George Kartrick's Damn it Chris"
  v['6'] = "Mannion's nuts. And George Kartrick's. Damn it, Chris.";
  // Seg 7: "There's three bolts on the field What"
  v['7'] = "There's three bolts on the field. What?";
  // Seg 9: "OK gents let's go Please we're back George put him away"
  v['9'] = "OK, gents, let's go. Please, we're back. George, put him away.";
  result['Gzi8k9nBrdU'] = v;
}

// h7amSrgtINI - "Go there! This is-" - fine (intentional cut-off)
result['h7amSrgtINI'] = {};

// hAQELenqVgE - song medley, mixed languages, fine
result['hAQELenqVgE'] = {};

// hCuMWrfXG4E - song (Uptown Girl style), fine
{
  const v = {};
  // Seg 0: "I better rather never told her why" - fine (song)
  result['hCuMWrfXG4E'] = {};
}

// HFOJYAZRE4A - song
{
  const v = {};
  // Seg 0: "other If it were I wouldn't bother" - continuation from previous, lowercase 'other', run-on
  v['0'] = "other. If it were, I wouldn't bother.";
  // Seg 1: "Chocolate bushes chocolate trees" - run-on
  v['1'] = 'Chocolate bushes, chocolate trees,';
  // Seg 2: "chocolate flowers and chocolate bees" - continuation, fine
  // Seg 3: "Chocolate memories that a boy once saved" - fine
  // Seg 4: "before they melted away A world of your own" - run-on
  v['4'] = 'before they melted away. A world of your own.';
  result['HFOJYAZRE4A'] = v;
}

// HI4oIuRQ-0M - monologue, fine (has proper punctuation)
result['HI4oIuRQ-0M'] = {};

// hJCUJLMSEK0 - comedy tweets read aloud
{
  const v = {};
  // Seg 0: "I" - single character, fine
  // Seg 1: "Feel like if you went to lunch with Natalie Portman" - continuation
  v['1'] = 'feel like if you went to lunch with Natalie Portman';
  // Seg 2: "She would only order a hot tea with lemon and maybe some toast definitely not an entree though" - continuation, add period
  v['2'] = 'she would only order a hot tea with lemon and maybe some toast, definitely not an entree though.';
  // Seg 4: "Look at me, I'm Ryan Gosling. I have perfect bone structure and kind eyes go yourself Ryan Gosling"
  v['4'] = 'Look at me, I\'m Ryan Gosling. I have perfect bone structure and kind eyes. Go yourself, Ryan Gosling.';
  // Seg 5: "Samuel L. Jackson has resting fart face. Yes, I do" - fine, add period
  v['5'] = 'Samuel L. Jackson has resting fart face. Yes, I do.';
  // Seg 7: "Are we all just ignoring the fact that Eddie Redmayne and Felicity Jones have the same face" - question
  v['7'] = 'Are we all just ignoring the fact that Eddie Redmayne and Felicity Jones have the same face?';
  // Seg 8: "Dear Eddie Redmayne, I hate your stinking guts. You make me vomit. You're the scum between my toes. Love's Eugenia"
  v['8'] = "Dear Eddie Redmayne, I hate your stinking guts. You make me vomit. You're the scum between my toes. Love, Eugenia.";
  // Seg 9: "It's Hannah raised his arms and my dad looks at his armpit hair" - run-on
  v['9'] = "It's Hannah. He raised his arms and my dad looks at his armpit hair";
  // Seg 10: "and says you look like you have Whoopi Goldberg in a headlock" - continuation, lowercase (cont from seg 9)
  v['10'] = 'and says you look like you have Whoopi Goldberg in a headlock.';
  // Seg 11: "Really that's it Lin-Manuel Miranda looks like he's getting a 1996 NBC sitcom with his hair cut"
  v['11'] = "Really, that's it? Lin-Manuel Miranda looks like he's getting a 1996 NBC sitcom with his haircut.";
  result['hJCUJLMSEK0'] = v;
}

// hLOheGDwD_0 - song, fine
result['hLOheGDwD_0'] = {};

// hmUyEDG7Jy0 - song, fine
result['hmUyEDG7Jy0'] = {};

// HqTBW90w0_0 - song, fine
result['HqTBW90w0_0'] = {};

// hrXJe_T6VS4 - dialogue
{
  const v = {};
  // Seg 0: "Gosh Um This one's lovely" - run-on
  v['0'] = "Gosh. Um. This one's lovely.";
  // Seg 1: "That's one of ours Yes ma am From the Magok Valley Any idea where that is"
  v['1'] = "That's one of ours. Yes, ma'am. From the Magok Valley. Any idea where that is?";
  // Seg 2: "One rather thick at geography Burma" - run-on
  v['2'] = 'One rather thick at geography. Burma.';
  // Seg 3: "There's a legend ma am that long long ago the northern part of Burma was" - direct address
  v['3'] = "There's a legend, ma'am, that long, long ago the northern part of Burma was";
  // Seg 4: "inhabited only by wild animals and poisonous snakes I think I prefer this one" - run-on
  v['4'] = 'inhabited only by wild animals and poisonous snakes. I think I prefer this one.';
  // Seg 5: "Yes a lovely choice ma am If that's one of yours" - direct address
  v['5'] = "Yes, a lovely choice, ma'am. If that's one of yours,";
  // Seg 6: "what can you tell us about that apart from the price It's a 12 carat oval Ceylon sapphire" - run-on
  v['6'] = "what can you tell us about that, apart from the price? It's a 12 carat oval Ceylon sapphire,";
  // Seg 8: "surrounded by 14 diamonds set in 18 carat white gold And you like"
  v['8'] = 'surrounded by 14 diamonds set in 18 carat white gold. And you like';
  // Seg 9: "that one because It's the most expensive No" - run-on
  v['9'] = 'that one because? It\'s the most expensive? No.';
  // Seg 10: "Because it reminds me of my mother's engagement ring And the same colour as my eyes" - run-on
  v['10'] = "Because it reminds me of my mother's engagement ring. And the same colour as my eyes.";
  result['hrXJe_T6VS4'] = v;
}

// hTWKbfoikeg - Nirvana song, fine
result['hTWKbfoikeg'] = {};

// hWQy4YuIMOw - song with music notes, fine
result['hWQy4YuIMOw'] = {};

// HySlYLkFieQ - "PRETENDING SOMETHING CRAZY" - all caps, no fix
result['HySlYLkFieQ'] = {};

// Hz1Be2zNKgo - West Wing dialogue, run-ons
{
  const v = {};
  // Seg 0: "you for harassment mr. Garner should consider how seriously I take this take" - continuation + run-on
  v['0'] = 'you for harassment. Mr. Garner should consider how seriously I take this. Take';
  // Seg 1: "what he acquired a videotape of a stuffed ballot box he brought that" - continuation + run-on
  v['1'] = 'what. He acquired a videotape of a stuffed ballot box. He brought that';
  // Seg 2: "videotape to the governor-elect and he attempted to show it to him what" - continuation + run-on
  v['2'] = 'videotape to the governor-elect and he attempted to show it to him. What';
  // Seg 3: "videotape what is that that is a videotape of three men taking a ballot" - run-on
  v['3'] = 'videotape? What is that? That is a videotape of three men taking a ballot';
  // Seg 4: "box or is it a gif have you ever seen the gif of that bear falling onto a" - run-on
  v['4'] = 'box. Or is it a gif? Have you ever seen the gif of that bear falling onto a';
  // Seg 5: "trampoline and then bouncing into a pool it is so funny but I was surprised to" - run-on
  v['5'] = 'trampoline and then bouncing into a pool? It is so funny. But I was surprised to';
  // Seg 6: "find out that the pool was faked all digitally if you're suggesting that this" - run-on
  v['6'] = "find out that the pool was faked — all digitally. If you're suggesting that this";
  // Seg 7: "videotape was in any way manipulated bits per pixel makes a gif highly" - run-on
  v['7'] = 'videotape was in any way manipulated — bits per pixel makes a gif highly';
  // Seg 8: "manipulatable bull I hope you have the original because otherwise I'm gonna" - run-on
  v['8'] = "manipulatable. Bull. I hope you have the original, because otherwise I'm gonna";
  // Seg 9: "eject to the gif being admitted into court the governor is guilty how do you" - run-on
  v['9'] = 'eject to the gif being admitted into court. The governor is guilty. How do you';
  // Seg 10: "know that" - question
  v['10'] = 'know that?';
  result['Hz1Be2zNKgo'] = v;
}

// h_bUcNjmuSk - movie dialogue
{
  const v = {};
  // Seg 0: "I'm afraid you're mistaken sir Don't give me that You've been spoochin with everybody Snuffy"
  v['0'] = "I'm afraid you're mistaken, sir. Don't give me that. You've been spoochin with everybody. Snuffy,";
  // Seg 1: "Al Leo Little Mo with the gimpy leg Cheeks Boney Bob Cliff" - list, add commas
  v['1'] = 'Al, Leo, Little Mo with the gimpy leg, Cheeks, Boney Bob, Cliff.';
  // Seg 2: "No It's a lie I could go on forever baby" - run-on + direct address
  v['2'] = "No. It's a lie. I could go on forever, baby.";
  // Seg 3: "I'm terribly sorry sir but I'm afraid you're mistaken We're looking for a" - run-on + direct address
  v['3'] = "I'm terribly sorry, sir, but I'm afraid you're mistaken. We're looking for a";
  // Seg 4: "young man All right I believe you But my tommy gun don't" - run-on
  v['4'] = "young man. All right, I believe you. But my tommy gun don't";
  // Seg 5: "Get down on your knees and tell me you love me" - fine as command
  v['5'] = 'Get down on your knees and tell me you love me.';
  // Seg 7: "I love you" - fine, add period
  v['7'] = 'I love you.';
  // Seg 8: "You got it You're better than that"
  v['8'] = "You got it. You're better than that.";
  result['h_bUcNjmuSk'] = v;
}

// i9HGwRbMiVY - song, fine
result['i9HGwRbMiVY'] = {};

// IaSsii5UpT8 - song, broken lines
{
  const v = {};
  // Seg 0: "Time I've been passing time Watching trains" - run-on
  v['0'] = "Time. I've been passing time, watching trains";
  // Seg 1: "go by All of my life" - continuation, lowercase
  v['1'] = 'go by. All of my life,';
  // Seg 2: "lying on the sand Watching seagirds fly" - continuation, lowercase + run-on
  v['2'] = 'lying on the sand, watching seagirds fly,';
  // Seg 3: "Wishing there would be Someone waiting" - continuation, lowercase
  v['3'] = 'wishing there would be someone waiting';
  // Seg 4: "on for me" - continuation, lowercase, add period
  v['4'] = 'on for me.';
  // Seg 5: "Something's telling me it might be you It's" - run-on
  v['5'] = "Something's telling me it might be you. It's";
  // Seg 6: "telling me it might be you All of my life" - continuation, lowercase
  v['6'] = 'telling me it might be you. All of my life,';
  // Seg 7: "looking back As lovers go walking past" - continuation, lowercase
  v['7'] = 'looking back as lovers go walking past.';
  result['IaSsii5UpT8'] = v;
}

// iCvmsMzlF7o - TED talk (Brene Brown), all lowercase with run-ons
{
  const v = {};
  // This is a very long TED talk with systematic lowercase issues throughout.
  // Fix the clearest run-ons and capitalization.
  v['0'] = "So I'll start with this. A couple of years ago an event planner called me because I";
  v['1'] = "was going to do a speaking event, and she called and she said I'm really";
  v['2'] = 'struggling with how to write about you on the little flyer.';
  v['3'] = 'And I thought, well what\'s the struggle?';
  v['4'] = 'And she said, well I saw you speak and I';
  v['5'] = "I — I'm going to call you a researcher, I think, but I'm afraid if I call you a";
  v['6'] = "researcher no one will come because they'll think you're boring and irrelevant.";
  v['7'] = "And it's like, okay. And she said, so but the thing I liked about your talk is you";
  v['8'] = "know you're a storyteller. So I think what I'll do is just call you a";
  v['9'] = "storyteller. And of course the academic insecure part";
  v['10'] = "of me was like, you're gonna call me a what? And she said,";
  v['11'] = "I'm gonna call you a storyteller. And I";
  v['12'] = 'was like,';
  v['13'] = 'oh why not magic pixie?';
  v['14'] = "I was like I — I don't — I let me think";
  v['15'] = "about this for a second. And so I tried to call deep on my courage and I";
  v['16'] = "thought, you know, I am a storyteller. I'm a";
  v['17'] = "qualitative researcher. I collect stories, that's what I do.";
  v['18'] = 'And maybe stories are just data with a';
  v['19'] = "soul, you know. And maybe I'm just";
  v['20'] = "a storyteller. So I said, you know what? Why don't you just say I'm a researcher";
  v['22'] = "and she went, there's no such thing.";
  v['23'] = "So I'm a researcher storyteller, and I'm going to talk to you today. We're";
  v['24'] = 'talking about expanding perception. So I want to talk to you';
  v['25'] = 'and tell some stories about';
  v['26'] = 'a piece of my research that';
  v['27'] = 'fundamentally expanded my perception';
  v['28'] = 'and really actually changed the way that';
  v['29'] = 'I live and love and work and parent.';
  v['30'] = 'And this is where my story starts. When I';
  v['31'] = 'was a young researcher, doctoral student.';
  v['32'] = 'My first year, I had a research professor';
  v['33'] = "who said to us, here's the thing: if you cannot measure";
  v['35'] = 'exist. And I thought he was just sweet-';
  v['36'] = "talking me. I was like,";
  v['37'] = "really? And he's like, absolutely. So you";
  v['38'] = "have to understand that I have a bachelor's in social work, a master's";
  v['39'] = "in social work and I was getting my PhD in social work. So my entire academic";
  v['40'] = 'career';
  v['41'] = 'was surrounded by people who kind of';
  v['42'] = "believed in the life's messy,";
  v['43'] = "love it, you know. And I'm more the life's";
  v['45'] = "clean it up, organize it, and put it into";
  v['46'] = 'a bento box.';
  v['47'] = 'Um. And so to';
  v['48'] = "think that I had found my way to found a career";
  v['49'] = 'that takes me — you know, really one of the big sayings';
  v['50'] = 'in social work is lean into the discomfort of the work.';
  v['51'] = "And I'm like, you know, knock discomfort";
  v['52'] = 'upside the head and move it over';
  v['53'] = "and get all A's. That's my — that was my";
  v['54'] = 'mantra. So I was very excited about this. And so';
  v['55'] = "I thought, you know what? This is the career for me, because I am";
  v['56'] = 'interested in some messy topics, but I want to be able to make them not';
  v['57'] = 'messy.';
  v['58'] = 'I want to understand them. I want to hack';
  v['59'] = "into these things I know are important";
  v['60'] = 'and lay the code out for everyone to see.';
  v['61'] = 'So where I started was with connection. Because by the time';
  v['62'] = "you're a social worker for";
  v['63'] = '10 years, what you realize is that';
  v['64'] = "connection is why we're here. It's what";
  v['65'] = "gives purpose and meaning to our lives. This is what it's all about. It";
  v['66'] = "doesn't matter whether you talk to people who work in social justice and";
  v['67'] = 'mental health and abuse and neglect. What we know is';
  v['68'] = 'that connection —';
  v['69'] = 'the ability to feel connected —';
  v['70'] = "neurobiologically, that's how we're wired. It's why we're here.";
  v['71'] = "So I thought, you know what? I'm going to start with connection.";
  v['72'] = 'Well, you know that situation where';
  v['73'] = 'you get an evaluation from your boss and she tells you 37 things that you do';
  v['74'] = "really awesome and one thing that you can't — you know, an opportunity for growth?";
  v['75'] = "And all you can think about is that opportunity for growth, right?";
  v['76'] = 'Well, apparently this is the way my work';
  v['77'] = 'went as well. Because when you ask people about love, they tell';
  v['78'] = 'you about heartbreak. When you ask people about belonging,';
  v['79'] = "they'll tell you the most excruciating experiences of being";
  v['80'] = 'excluded. And when you ask people about connection,';
  v['81'] = 'the stories they told me were about disconnection.';
  v['82'] = 'So very quickly, really about six weeks';
  v['83'] = 'into this research, I ran into';
  v['84'] = 'this unnamed thing that absolutely';
  v['85'] = "unraveled connection in a way that I didn't understand or had never seen. And so I pulled back out of";
  v['86'] = "the research and thought I need to";
  v['87'] = 'figure out what this is.';
  v['88'] = 'And it turned out to be shame.';
  v['89'] = 'And shame is really easily understood as';
  v['90'] = 'the fear of disconnection.';
  v['91'] = 'Is there something about me that if';
  v['92'] = 'other people know it or see it,';
  v['93'] = "that I won't be worthy of connection?";
  v['94'] = "The things I can tell you about it: it's universal, we all have it. The only people";
  v['95'] = "who don't experience shame have no capacity for human";
  v['96'] = 'empathy or connection. No one wants to';
  v['97'] = 'talk about it. And the less you talk about it, the more you have it.';
  v['98'] = "What underpinned this shame — this I'm not";
  v['99'] = "good enough, which we all know that feeling — I'm not";
  v['100'] = 'blank enough, I\'m not thin enough, rich';
  v['101'] = "enough, beautiful enough, smart enough, promoted enough — um, the thing that";
  v['102'] = 'underpinned this';
  v['103'] = 'was excruciating vulnerability.';
  v['104'] = 'This idea of, in order for connection to';
  v['105'] = 'happen, we have to allow ourselves to be seen,';
  v['106'] = "really seen. And you know how I feel about vulnerability? I hate vulnerability. And";
  v['107'] = "so I thought, this is my chance to beat it";
  v['108'] = 'back with my measuring stick.';
  v['109'] = "I'm going in. I'm going to figure this";
  v['110'] = "stuff out. I'm going to spend a year. I'm going to totally deconstruct shame.";
  v['111'] = "I'm going to understand how vulnerability works. And I'm going to";
  v['112'] = 'outsmart it.';
  v['113'] = "As you know, it's not going to turn out well.";
  v['114'] = "You know this. So I could tell you a lot about shame";
  v['115'] = "but I'd have to borrow everyone else's time. But here's what I can tell you — that";
  v['116'] = 'it boils down to. And this may be one of the most';
  v['117'] = "important things that I've ever learned";
  v['118'] = 'in the decade of doing this research.';
  v['119'] = 'My one year turned into six years.';
  v['120'] = 'Thousands of stories, hundreds of long interviews,';
  v['121'] = 'focus groups. At one point people were sending me journal pages and sending me';
  v['122'] = 'their stories — thousands of pieces of data. And six';
  v['123'] = "years, and I kind of got a handle on it. I kind";
  v['124'] = 'of understood, this is what shame is. This';
  v['125'] = 'is how it works.';
  v['126'] = 'I wrote a book. I published a theory.';
  v['127'] = 'But something was not okay. And what it';
  v['128'] = 'was — is that if I roughly took the people';
  v['129'] = 'I interviewed';
  v['130'] = 'and divided them into people';
  v['131'] = 'who really have a sense of worthiness —';
  v['132'] = "that's what this comes down to, a sense of worthiness —";
  v['133'] = 'they have a strong sense of love and belonging';
  v['134'] = "and folks who struggle for it. And folks who are always";
  v['135'] = "wondering if they're good enough. There was only one variable that separated the";
  v['136'] = 'people who have a strong sense of love and belonging';
  v['137'] = 'and the people who really struggle for';
  v['138'] = 'it. And that was — the people who have a strong sense of love and belonging';
  v['139'] = 'believe they\'re worthy of love and';
  v['140'] = 'belonging.';
  v['141'] = "That's it. They believe they're worthy.";
  v['142'] = 'And to me the hard part of';
  v['143'] = "the one thing that keeps us out of connection is our fear that we're not";
  v['144'] = "worthy of connection — something that personally and";
  v['145'] = 'professionally I felt like I needed to';
  v['146'] = 'understand better.';
  v['147'] = 'So what I did is I';
  v['148'] = 'took all of the interviews where I saw worthiness, where I saw people living';
  v['149'] = 'that way,';
  v['150'] = 'and just looked at those. What do these';
  v['151'] = 'people have in common? And I have — I have a slight office supply addiction,';
  v['152'] = "but that's another talk. So I had a manila notebook, a manila";
  v['153'] = "folder, and I had a sharpie. And I was like, what am I going to call this research? And the first words that";
  v['154'] = 'came to my mind were: wholehearted. These are kind of';
  v['155'] = 'wholehearted people, living from this deep sense of worthiness. So I wrote at';
  v['156'] = 'the top of the manila folder and I started looking at the data. In';
  v['157'] = 'fact I did it first';
  v['158'] = 'in this very — in a four-day,';
  v['159'] = 'very intensive data analysis where I went back, pulled these interviews, pulled';
  v['160'] = "the stories, pulled the incidents. What's the — what's the";
  v['161'] = "theme, what's the pattern? My husband left town with the kids — um —";
  v['162'] = "because I always go into this kind of Jackson Pollock crazy thing where I'm just like";
  v['163'] = "writing and going and kind of just in my";
  v['164'] = "researcher mode. And so here's what I found.";
  v['165'] = 'What they had in common was a sense of courage.';
  v['166'] = 'And I want to separate courage and bravery for you for a minute.';
  v['167'] = "Courage — the original definition of courage, when it first came into the English language, it's from the Latin";
  v['168'] = 'word cur, meaning heart. And the original';
  v['169'] = 'definition was to tell the story of who you are with your whole heart.';
  v['170'] = 'And so these folks had very simply the —';
  v['171'] = 'they had the compassion to be kind to themselves first,';
  v['172'] = "and then to others. Because as it turns out, we can't practice compassion with";
  v['173'] = "other people if we can't treat ourselves kindly.";
  v['174'] = 'And the last was they had connection. And';
  v['175'] = 'this was the hard part.';
  v['176'] = 'As a result of authenticity, they were';
  v['177'] = 'willing to let go of who they thought they should be';
  v['178'] = 'in order to be who they were, which is —';
  v['179'] = 'you have to absolutely do that for connection.';
  v['180'] = 'The other thing that they had in common';
  v['181'] = 'was this.';
  v['182'] = 'They fully embraced vulnerability.';
  v['183'] = 'They believed';
  v['184'] = 'that what made them vulnerable made them —';
  v['185'] = 'they didn\'t talk about vulnerability being comfortable.';
  v['186'] = "Nor did they really talk about it being excruciating, as I had heard";
  v['187'] = 'earlier in the shame interviewing. They';
  v['188'] = 'just talked about it being necessary.';
  v['189'] = 'They talked about the willingness to say';
  v['190'] = 'I love you first. The willingness to';
  v['191'] = 'do something where there are no';
  v['192'] = 'guarantees.';
  v['193'] = 'The willingness to breathe through';
  v['194'] = 'waiting for the doctor to call after your mammogram.';
  v['195'] = 'The willing to invest in a relationship';
  v['196'] = "that may or may not work out. They";
  v['197'] = 'thought this was fundamental.';
  v['198'] = 'I personally thought it was betrayal.';
  v['199'] = "I could not believe I had pledged allegiance to research";
  v['200'] = "where our job — you know, the definition of research is to control, control and predict —";
  v['201'] = 'a steady phenomenon for the reason — for this explicit reason, to control and';
  v['202'] = "predict. And now my very — you know, my mission to";
  v['203'] = 'control and predict had turned up the answer that the way to';
  v['204'] = 'live is with vulnerability.';
  v['205'] = 'And to stop controlling and predicting.';
  v['206'] = 'This led to a little breakdown,';
  v['207'] = 'which actually looked more like this.';
  v['208'] = 'And it did. It led to a — I called a';
  v['209'] = "breakdown. My therapist calls it a spiritual awakening.";
  v['210'] = 'Spiritual lightning sounds better than breakdown, but I assure you it was a breakdown.';
  v['211'] = 'And I had to put my data away and go find a therapist. Let me tell you something.';
  v['212'] = "You know who you are when you call your friends and say, I think I need to see";
  v['213'] = 'somebody. Do you have any recommendations?';
  v['214'] = "Because about five of my friend's like —";
  v['215'] = "And I was like, what does that mean? And they're like, I'm just saying, you know,";
  v['216'] = "like, don't bring your measuring stick.";
  v['217'] = 'Okay. So I found a therapist.';
  v['218'] = 'My first meeting with her, Diana.';
  v['219'] = 'I brought in my list of the way the wholehearted live.';
  v['220'] = "And I sat down and she said, you know, how";
  v['221'] = "are you? And I said, I'm great. You know, I'm — I'm okay. And she";
  v['222'] = "said, what's going on? And I said — and this is a therapist who sees";
  v['223'] = "therapists, because we have to go to those because their BS";
  v['224'] = "meters are good.";
  v['225'] = "And so I said, here's the thing. I'm struggling.";
  v['226'] = "And she said, what's the struggle? And I said, well, I have a vulnerability issue.";
  v['227'] = "And you know and I know that";
  v['228'] = "vulnerability is kind of the core";
  v['229'] = 'of shame and fear and our struggle for worthiness.';
  v['230'] = "But it appears that it's also the";
  v['231'] = 'birthplace of joy,';
  v['232'] = 'of creativity, a belonging, of love.';
  v['233'] = 'And I think I have a problem. And';
  v['234'] = "I just — I need some help. And I said, but";
  v['235'] = "here's the thing:";
  v['236'] = "no family stuff, no childhood. I just —";
  v['237'] = 'I just need some strategies.';
  v['238'] = 'Thank you. Um.';
  v['239'] = 'And then I said, it\'s bad, right? She said,';
  v['240'] = "it's neither good nor bad.";
  v['241'] = 'It just is what it is. And I said, oh my';
  v['242'] = 'God, this is gonna suck. Um.';
  v['243'] = "And it did and it didn't. Um. And it took";
  v['244'] = "about a year. And you know how there are people that, like, when they realize that";
  v['245'] = 'vulnerability';
  v['246'] = 'and tenderness are important, that they';
  v['247'] = 'kind of surrender and walk into it?';
  v['248'] = "That's not me. And b, I don't even hang out with people like that.";
  v['249'] = 'For me it was a year-long street fight.';
  v['250'] = 'It was a slugfest. Vulnerability pushed. I';
  v['251'] = 'pushed back.';
  v['252'] = 'I lost the fight, but';
  v['253'] = "probably won my life back. And so then I went back into the research and spent";
  v['254'] = 'the next couple of years really trying to understand what they —';
  v['255'] = 'the wholehearted — um, what the choices they were making. And what —';
  v['256'] = 'what — what are we doing with vulnerability? Why';
  v['257'] = "do we struggle with it so much? Am I";
  v['258'] = 'alone in struggling with vulnerability?';
  v['259'] = 'No. So this is what I learned.';
  v['260'] = 'We numb vulnerability. When we\'re waiting for the call,';
  v['261'] = 'it was funny. I sent something out on Twitter and on Facebook that says:';
  v['262'] = 'how would you define vulnerability? What';
  v['263'] = 'makes you feel vulnerable? And within an';
  v['264'] = 'hour and a half I had 150 responses.';
  v['265'] = "Because I wanted to know, you know, what's out there.";
  v['266'] = 'Having to ask my husband for help';
  v['267'] = "because I'm sick and we're newly married.";
  v['268'] = 'Um. Initiating sex with my husband.';
  v['269'] = 'Initiating sex with my wife. Being turned';
  v['270'] = 'down. Asking someone out. Waiting for the';
  v['271'] = 'doctor to call back.';
  v['272'] = 'Getting laid off. Laying off people. This';
  v['273'] = 'is the world we live in.';
  v['274'] = 'We live in a vulnerable world. And one of';
  v['275'] = "the ways we deal with it is we numb vulnerability.";
  v['276'] = "And I think there's evidence. And it's";
  v['277'] = 'not the only reason this evidence exists.';
  v['278'] = "But I think that there — it's a huge cause.";
  v['279'] = 'We are the most in debt,';
  v['280'] = 'obese, addicted,';
  v['281'] = "and medicated adult cohort in U.S. history.";
  v['282'] = 'The problem is — and I learned this from';
  v['283'] = 'the research —';
  v['284'] = 'that you cannot selectively numb emotion.';
  v['285'] = "You can't say here's the bad stuff.";
  v['286'] = "Here's vulnerability. Here's grief. Here's";
  v['287'] = 'shame. Here\'s fear. Here\'s disappointment.';
  v['288'] = "I don't want to feel these. I'm going to";
  v['289'] = "have a couple of beers and a banana nut muffin.";
  v['290'] = "I don't want to feel these. And I know that's — I know that's knowing laughter. I";
  v['291'] = "I hack into your lives for a living. I know that's, oh god.";
  v['292'] = "You can't numb those hard feelings";
  v['293'] = 'without numbing the other affects, our';
  v['294'] = "emotions. You cannot selectively numb.";
  v['295'] = 'So when we numb those, we numb';
  v['296'] = 'joy. We numb gratitude.';
  v['297'] = 'We numb happiness. And then';
  v['298'] = 'we are miserable and we are looking for purpose and meaning.';
  v['299'] = 'And then we feel vulnerable. So then we have a couple of beers and a banana nut';
  v['300'] = 'muffin.';
  v['301'] = 'And it becomes this dangerous cycle. Um.';
  v['302'] = 'One of the things that I think that we';
  v['303'] = 'need to think about';
  v['304'] = "is why and how we numb. And it doesn't";
  v['305'] = 'just have to be addiction.';
  v['306'] = 'The other thing we do is we make';
  v['307'] = "everything that's uncertain certain.";
  v['308'] = 'Religion has gone from a belief in faith';
  v['309'] = "and mystery to certainty. I'm right, you're wrong. Shut up.";
  v['310'] = "That's it. Just certain.";
  v['311'] = 'The more afraid we are, the more vulnerable we are. The more';
  v['312'] = 'afraid we are. This is what politics looks like today. There\'s no discourse';
  v['313'] = "anymore. There's no conversation. There's just";
  v['314'] = 'blame. You know what blame? You know how';
  v['315'] = 'blame is described in the research?';
  v['316'] = 'A way to discharge pain and discomfort.';
  v['317'] = 'We perfect — if there\'s anyone who wants their life to look like this,';
  v['318'] = "it would be me. But it doesn't work.";
  v['319'] = "Because what we do is we take fat from our butts and put it in our cheeks,";
  v['320'] = "which — just — I hope in 100 years people will look back and go, wow.";
  v['321'] = 'And we perfect — most dangerously — our children.';
  v['322'] = "Let me tell you what we think about children. They're hardwired for struggle";
  v['323'] = 'when they get here. When you hold those perfect little babies in your hand, our job is not to';
  v['324'] = 'say, look at her, she\'s perfect. My job is just to keep her perfect. Make sure she makes';
  v['325'] = "the tennis team by fifth grade and Yale by seventh grade.";
  v['326'] = "That's not our job. Our job is to look and say, you know what? You're imperfect";
  v['327'] = 'and you\'re wired for struggle, but you are worthy of';
  v['328'] = 'love and belonging. That\'s our job. Show me a generation of';
  v['329'] = "kids raised like that and we'll end the problems I think that";
  v['330'] = 'we see today. We pretend';
  v['331'] = "that what we do doesn't have an effect on people.";
  v['332'] = 'We do that in our personal lives. We do';
  v['333'] = 'that corporate — whether it\'s a bailout, an';
  v['334'] = 'oil spill,';
  v['335'] = "a recall. We pretend like what we're";
  v['336'] = 'doing doesn\'t have a huge impact on other people.';
  v['337'] = 'I would say to companies, this is not our first rodeo, people.';
  v['338'] = 'We just need you to be authentic and';
  v['339'] = 'real and say —';
  v['340'] = "but there's another way. And I'll leave";
  v['341'] = 'you with this. This is what I have found.';
  v['342'] = 'To let ourselves be seen — deeply seen.';
  v['343'] = 'To love with our whole hearts, even though there\'s no guarantee.';
  v['344'] = "And that's really hard. And I can tell you as a parent, that's excruciatingly difficult.";
  v['345'] = 'To practice gratitude and joy in those';
  v['346'] = "moments of kind of terror, when we're wondering, can I love you this much? Can I believe in this as";
  v['347'] = "passionately? Can I be this fierce about this? Just to";
  v['348'] = "be able to stop and, instead of catastrophizing what might happen, to say";
  v['349'] = "I'm just so grateful.";
  v['350'] = 'Because to feel this vulnerable means I\'m alive.';
  v['351'] = 'And the last — which I think is probably';
  v['352'] = 'the most important —';
  v['353'] = "is to believe that we're enough. Because";
  v['354'] = 'when we work from a place I believe that says I\'m enough,';
  v['355'] = 'then we stop screaming and start listening.';
  v['356'] = "We're kinder and gentler to the people around us. And we're kinder and gentler";
  v['357'] = 'to ourselves.';
  v['358'] = "That's all I have.";
  v['359'] = 'Sharing that\'s video on the human';
  v['360'] = 'network.';
  result['iCvmsMzlF7o'] = v;
}

// iK6Sg-wof7Y - just a URL, no fix
result['iK6Sg-wof7Y'] = {};

// ilnl_B11vZ8 - movie dialogue
{
  const v = {};
  // Seg 0: "I would never put you and Manny in danger now. Come on. Trust me on this" - fine, add period
  v['0'] = 'I would never put you and Manny in danger now. Come on. Trust me on this.';
  // Seg 3: "Uh-huh, uh-huh. Oh, all right. Thank you. So you're not see tonight" - "not see tonight" seems wrong but can't change words
  // Seg 4: "Good news, they rescheduled my massage for the morning bad news. It's a dude. Don't blame me. It's your mom's fault"
  v['4'] = "Good news, they rescheduled my massage for the morning. Bad news. It's a dude. Don't blame me. It's your mom's fault.";
  // Seg 5: "Do you know how many people died in these planes John Denver Patsy Cline Ritchie violin? I've heard you sing. I think you're safe. I"
  v['5'] = "Do you know how many people died in these planes? John Denver, Patsy Cline, Ritchie violin. I've heard you sing. I think you're safe. I";
  // Seg 6: "Look, the welcome dinner starts in four hours. It's a five-hour drive. No bathroom breaks. Oh" - fine, add period
  v['6'] = "Look, the welcome dinner starts in four hours. It's a five-hour drive. No bathroom breaks. Oh.";
  // Seg 8: "What was that giant pothole the dash is lighting up like a Christmas tree tires blows"
  v['8'] = 'What was that? Giant pothole. The dash is lighting up like a Christmas tree. Tires blow.';
  // Seg 9: "Never would have happened if we were in the air. He's gonna happen in there wouldn't be in there would be in rock-and-roll heaven"
  v['9'] = "Never would have happened if we were in the air. He's gonna — happen in there — wouldn't be in there — would be in rock-and-roll heaven.";
  result['ilnl_B11vZ8'] = v;
}

// imW392e6XR0 - comedy tweets, run-ons
{
  const v = {};
  // Seg 0: "No f***ing whack Honest" - run-on
  v['0'] = 'No f***ing whack. Honest.';
  // Seg 1: "Ashton Kutcher needs to get hit by a bus ASAP" - add period
  v['1'] = 'Ashton Kutcher needs to get hit by a bus ASAP.';
  // Seg 2: "I hate Courtney Cox I f***ing hate her F***ing hoe" - run-on
  v['2'] = 'I hate Courtney Cox. I f***ing hate her. F***ing hoe.';
  // Seg 4: "If I said it once I've said it a hundred times F Andy Garcia" - run-on
  v['4'] = "If I said it once, I've said it a hundred times. F Andy Garcia.";
  // Seg 5: "Mindy Kaling is not funny or attractive She has an annoying voice and just plainly sucks Why"
  v['5'] = 'Mindy Kaling is not funny or attractive. She has an annoying voice and just plainly sucks. Why';
  // Seg 6: "does she have her own show I feel like this is more than 140 characters"
  v['6'] = 'does she have her own show? I feel like this is more than 140 characters.';
  // Seg 7: "David Blaine looks like his voice is putting his face to sleep" - add period
  v['7'] = 'David Blaine looks like his voice is putting his face to sleep.';
  // Seg 8: "John Rickles looks like Yoda" - add period
  v['8'] = 'John Rickles looks like Yoda.';
  // Seg 9: "Ethan Hawke seems like a guy who wasn't supposed to be a movie star but he slipped through the" - run-on
  v['9'] = "Ethan Hawke seems like a guy who wasn't supposed to be a movie star, but he slipped through the";
  // Seg 10: "cracks and everyone was just like Okay" - continuation, lowercase + add period
  v['10'] = 'cracks and everyone was just like, okay.';
  // Seg 11: "Matthew McConaughey is a d turd" - add period
  v['11'] = 'Matthew McConaughey is a d turd.';
  result['imW392e6XR0'] = v;
}

// iqhTTufTsU4 - song, fine
result['iqhTTufTsU4'] = {};

// Write output
fs.mkdirSync('src/data/subtitle-fixes', { recursive: true });
fs.writeFileSync('src/data/subtitle-fixes/fix-2.json', JSON.stringify(result, null, 2));
console.log('Done. Videos processed:', Object.keys(result).length);
for (const [vid, fixes] of Object.entries(result)) {
  console.log(vid + ':', Object.keys(fixes).length, 'fixes');
}

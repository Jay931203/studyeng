import fs from 'fs';

const data = JSON.parse(fs.readFileSync('C:/Users/hyunj/studyeng/src/data/subtitle-fix-batches/fix-1.json', 'utf8'));

// Build result - all videoIds included, only changed segments
const result = {};
for (const vid of Object.keys(data)) {
  result[vid] = {};
}

function fix(vid, idx, newText) {
  if (data[vid] && data[vid][idx] !== undefined && data[vid][idx] !== newText) {
    result[vid][idx] = newText;
  }
}

// ====== 8XNaPX6MKlU ======
fix('8XNaPX6MKlU', '9', "It's so true that we've been through it");

// ====== 983bBbJx0Mk ======
fix('983bBbJx0Mk', '2', "You could be everything that that I need. Tastes so sweet");
fix('983bBbJx0Mk', '3', "Every sip makes me want more, yeah. Like a last dance. Cause you got it like that");
fix('983bBbJx0Mk', '16', "Every drop, I break up. You're my soda pop");
fix('983bBbJx0Mk', '19', "Pull me up, I won't stop. You're my soda pop. My little soda pop");

// ====== A0voQFMhV6I ======
fix('A0voQFMhV6I', '0', "Just stand right there, okay. Right, right on those marks. Hello, it is indeed an");
fix('A0voQFMhV6I', '2', "series and best drama series. What? No, you cannot play Angry Birds right now. No,");
fix('A0voQFMhV6I', '3', "just just share the tablet, but fine, take turns. 30-second turns, okay.");
fix('A0voQFMhV6I', '8', "Why are you laughing? Why are you laughing?");

// ====== a3lcGnMhvsA ======
fix('a3lcGnMhvsA', '1', "Doctor Mann, listen to me. This is not about my life.");
fix('a3lcGnMhvsA', '2', "Or Cooper's life. This is about all mankind. There is a moment.");
fix('a3lcGnMhvsA', '5', "Cooper, there's no point in using our fuel to chase. Analyze the endurance of spin.");

// ====== AEB6ibtdPZc ======
fix('AEB6ibtdPZc', '0', "All that I want is to wake up fine. Tell me that I'm alright, that");
fix('AEB6ibtdPZc', '1', "I ain't gonna die. All that I want is a hole in the ground. You");
fix('AEB6ibtdPZc', '4', "and laugh, but you will cry. And I still don't know how I even survived. Hard");

// ====== AeJZe6eHBEA ======
fix('AeJZe6eHBEA', '1', "Mascara still holding on. Flying to another song. All I");
fix('AeJZe6eHBEA', '2', "do since you've been gone is stay up and stay out. Begging for the bass till");
fix('AeJZe6eHBEA', '3', "it's hitting me right. Sweating on the dance floor under the lights. To get over");
fix('AeJZe6eHBEA', '5', "I don't start to cry. DJ's working late, she's helping me try. To get over");
fix('AeJZe6eHBEA', '6', "you I'll be here all night. I don't wanna go all natural");
fix('AeJZe6eHBEA', '8', "I might go psychotic. But if I'm never better and never get back together, I'll turn the");
fix('AeJZe6eHBEA', '10', "Mascara still holding on. Flying to another song. All I");

// ====== AIUaYqSUVps ======
fix('AIUaYqSUVps', '0', "You are the popular one, the popular chick. It is what it is, now I'm popular, it's");
fix('AIUaYqSUVps', '1', "Standing on the field with your pretty pom-pom. Now you're working at the movies selling popular corn");
fix('AIUaYqSUVps', '4', "I never was a model, I never was a model. I never was a starter, but you were always popular");
fix('AIUaYqSUVps', '5', "You were singing all the songs I don't know. Now you're in the front row, cause my song is popular");

// ====== aXzVF3XeS8M ======
fix('aXzVF3XeS8M', '0', "See the lights, see the party, the ballgowns. See you make your way through the crowd");
fix('aXzVF3XeS8M', '1', "Say hello, little did I know. That you were Romeo, you were throwing pebbles");
fix('aXzVF3XeS8M', '2', "And my daddy said, stay away from Juliet. And I was crying on the staircase");
fix('aXzVF3XeS8M', '3', "Begging you, please don't go. And I said, Romeo, take me");
fix('aXzVF3XeS8M', '4', "Somewhere we can be alone. I'll be waiting, all that's left to do is run");
fix('aXzVF3XeS8M', '5', "You'll be the prince and I'll be the princess. It's a love story, baby, just say yes");
fix('aXzVF3XeS8M', '6', "So I sneak out to the garden to see you. We keep quiet cause we're dead");

// ====== b8GpG-7q0WU ======
fix('b8GpG-7q0WU', '2', "answer? No, I got her voicemail. But the recital hall scrambles the signal so");
fix('b8GpG-7q0WU', '6', "you were in front of the recital hall? Yes, I saw Ellen Witten running the track");
fix('b8GpG-7q0WU', '8', "Avenue? Yes, that's correct. But University Avenue isn't the most direct route from");

// ====== Bcn-rzACIHU ======
fix('Bcn-rzACIHU', '0', "Nothing, Jo.");
fix('Bcn-rzACIHU', '1', "We can leave. We can leave right now. I can make money. I'll sell stories. I'll do anything. I'll cook.");
fix('Bcn-rzACIHU', '2', "I'll clean. I'll work in a factory. I can make a life for us, Jo. And you should be an actress and you should have a life");
fix('Bcn-rzACIHU', '3', "on the stage. Let's just run away together. I want to get married. Why? Because");
fix('Bcn-rzACIHU', '4', "I love him. You will be bored of him in two years and we will be interesting forever.");
fix('Bcn-rzACIHU', '8', "I just hate that you're leaving me. Don't leave. Oh, Jo.");
fix('Bcn-rzACIHU', '9', "I'm not leaving.");

// ====== bCQNOdflWbQ ======
fix('bCQNOdflWbQ', '0', "Sell me this pen. It's a nice pen. You can, you can use the pen to write down thoughts");
fix('bCQNOdflWbQ', '1', "from your life so you can remember. Sell me this pen.");
fix('bCQNOdflWbQ', '2', "Well, this pen works.");

// ====== BgfB4SjXuys ======
fix('BgfB4SjXuys', '0', "Me? I can't tell you because I don't know. I had this vision the night that you");

// ====== bmz9lMP6aQU ======
fix('bmz9lMP6aQU', '0', "How much does it cost out here? Hey, I figured it out. I'm not always going to be here to help you.");
fix('bmz9lMP6aQU', '1', "What's going on, Murph? Why did you and Mom leave me? After something that's bad? Well, we didn't.");
fix('bmz9lMP6aQU', '3', "Murphy's Law doesn't mean that something bad will happen. What it means is that whatever can happen");
fix('bmz9lMP6aQU', '4', "will happen. And that sounded just fine with us.");
fix('bmz9lMP6aQU', '5', "Whoa. Get in. Get in. Let's go.");
fix('bmz9lMP6aQU', '6', "What about the flat tire?");

// ====== cg1rtWXHSKU ======
fix('cg1rtWXHSKU', '1', "You know what's in that cradle? The power to make real change. And that");
fix('cg1rtWXHSKU', '2', "terrifies you. I wouldn't call it a comfort.");
fix('cg1rtWXHSKU', '4', "We got a window. Four, three. Get in the hell.");

// ====== CkbHGH-NnkU ======
fix('CkbHGH-NnkU', '2', "Yeah, it's getting worse. It must be this. This is that. I mean, really. I mean, I");
fix('CkbHGH-NnkU', '3', "don't think anybody think relative, yeah, you know, and I don't think anyone wants");

// ====== cN33Lf-seXU ======
fix('cN33Lf-seXU', '0', "You know, out of all my older cousins, you're like my favorite cousin, so I feel like I can talk to you about anything.");
fix('cN33Lf-seXU', '2', "night that no one seemed to worry about. But maybe you heard about that. Maybe I");
fix('cN33Lf-seXU', '3', "should know about. Camilo, stop pretending");
fix('cN33Lf-seXU', '7', "Oh, Elisa, I heard her eye twitching all night.");
fix('cN33Lf-seXU', '9', "Lisa, family.");
fix('cN33Lf-seXU', '14', "I'm sure today we'll find a way to put your blessings to good use, Louisa.");
fix('cN33Lf-seXU', '15', "Dolores says you're totally freaking out. Any chance you maybe know something");
fix('cN33Lf-seXU', '23', "Dolores, do we have a date tonight?");

// ====== cnCMqr1QRQw ======
fix('cnCMqr1QRQw', '3', "Tom said, don't forget to thank your wife. I will never forget to thank my high school sweetheart and the mother of my children, Spencer and Mason.");
fix('cnCMqr1QRQw', '4', "I love you, Sarah.");
fix('cnCMqr1QRQw', '5', "And my parents who are here, Shirley and Cuba the First. And God.");
fix('cnCMqr1QRQw', '6', "I love you. Hallelujah. Thank you, Father God, for putting me through what you put me through.");

// ====== CR5Jp_ag2M8 ======
fix('CR5Jp_ag2M8', '1', "I don't either, but who gives a shit? No one's watching. What do you care? Wait, what? This is crazy. You want me to hit you? That's");
fix('CR5Jp_ag2M8', '2', "right. What, like in the face? Surprise me.");
fix('CR5Jp_ag2M8', '3', "This is so fucking stupid. I didn't.");
fix('CR5Jp_ag2M8', '4', "Motherfucker.");
fix('CR5Jp_ag2M8', '5', "You hit me in the ear. Well, Jesus, I'm sorry. Ow, Christ. By the");
fix('CR5Jp_ag2M8', '6', "ear, man. I fucked it up. No, that was perfect.");
fix('CR5Jp_ag2M8', '7', "Fuck.");
fix('CR5Jp_ag2M8', '8', "God. That really hurts.");
fix('CR5Jp_ag2M8', '9', "Christ.");

// ====== DAhFW_auT20 ======
fix('DAhFW_auT20', '8', "For the second time in the lives of most of us, we are at");
fix('DAhFW_auT20', '9', "war. Over and over again,");

// ====== DkSMrI86NWk ======
fix('DkSMrI86NWk', '0', "seats. You never even saw the money. Was like this. Hey, Chandler, thanks for");
fix('DkSMrI86NWk', '1', "showing us to our seats. You're welcome. Hey, Joey, thanks for parking the car. No");
fix('DkSMrI86NWk', '2', "problem. Hey, Chandler, I think they get it, okay?");
fix('DkSMrI86NWk', '3', "There's the man. Hey, hey, getting better. I'm gonna keep this by the way.");
fix('DkSMrI86NWk', '4', "You kept my dollar?");
fix('DkSMrI86NWk', '5', "So your first whole weekend without men? What are you guys gonna do? We're going");
fix('DkSMrI86NWk', '6', "down to Colonial Williamsburg. A woman I went to college with just became the");
fix('DkSMrI86NWk', '7', "first female blacksmith down there. Well, you know, they're a little behind the");
fix('DkSMrI86NWk', '8', "times in Colonial Williamsburg. Ross, yeah.");

// ====== donJlg14_LY ======
fix('donJlg14_LY', '1', "how your touch was so tender, it told me you cared.");
fix('donJlg14_LY', '3', "but I just couldn't see until it was gone. A");
fix('donJlg14_LY', '5', "may be too much to ask, but I swear from now on.");
fix('donJlg14_LY', '10', "This time will never end.");

// ====== dOxiSsBTHbk ======
fix('dOxiSsBTHbk', '1', "I think this is going to be all right. Yeah, yeah, this isn't so bad. All right.");
fix('dOxiSsBTHbk', '3', "Yes, very good. Yes. Ow.");
fix('dOxiSsBTHbk', '4', "Ow. Ow.");
fix('dOxiSsBTHbk', '5', "Ow.");
fix('dOxiSsBTHbk', '6', "Ow.");

// ====== eBS7QW9d100 ======
fix('eBS7QW9d100', '0', "I found his car in a ravine. Bullet holes on the side. So I'm just waiting to hear");
fix('eBS7QW9d100', '1', "how that happened. Bullet holes, that's it. Look, I don't know what it's like where you're");
fix('eBS7QW9d100', '2', "from. But here in New Mexico, you leave a soda can out, someone's taking a shot at it. That,");
fix('eBS7QW9d100', '3', "that, that's what you're on about. You don't think it's possible, a couple of yahoos with");
fix('eBS7QW9d100', '4', "guns shot up a piece of junk car? And a story? What kind of operation are you running, anyway?");
fix('eBS7QW9d100', '5', "Tell me. Cuz I think I know why you sent him to do this job. It's obvious you have no one else");
fix('eBS7QW9d100', '6', "you can trust.");

// ====== ECjYsWLgy3I ======
fix('ECjYsWLgy3I', '1', "It was me, Murph.");
fix('ECjYsWLgy3I', '2', "I was your ghost. I know.");
fix('ECjYsWLgy3I', '3', "People didn't believe me. They thought that I was doing it all myself.");
fix('ECjYsWLgy3I', '4', "But I knew who it was.");
fix('ECjYsWLgy3I', '5', "Nobody believed me. But I knew he'd come back.");
fix('ECjYsWLgy3I', '7', "Because my dad promised me.");
fix('ECjYsWLgy3I', '8', "I'm here now, Murph. I'm here.");

// Write output
const dir = 'C:/Users/hyunj/studyeng/src/data/subtitle-fixes';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(dir + '/fix-1.json', JSON.stringify(result, null, 2));
console.log('Done. Fixed segments per video:');
for (const [vid, segs] of Object.entries(result)) {
  const count = Object.keys(segs).length;
  if (count > 0) console.log('  ' + vid + ': ' + count + ' fixes');
}

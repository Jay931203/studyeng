import fs from 'fs';
const data = JSON.parse(fs.readFileSync('C:/Users/hyunj/studyeng/src/data/subtitle-fix-batches/fix-6.json', 'utf8'));
const output = {};

function fix(vid, idx, corrected) {
  const original = data[vid]?.[String(idx)];
  if (original === undefined) return;
  if (original !== corrected) {
    if (!output[vid]) output[vid] = {};
    output[vid][String(idx)] = corrected;
  }
}

// WcIcVapfqXw - song (pidgin)
fix('WcIcVapfqXw','0','Every other girl they do too much, but this girl mellow.');
fix('WcIcVapfqXw','1','Now in my divine situation I go use the tell and mellow.');
fix('WcIcVapfqXw','2','Finally I find way to talk to the girl but she no want follow.');
fix('WcIcVapfqXw','3',"When you gon' the phone phone one.");
fix('WcIcVapfqXw','4',"When you no want phone phone one.");
fix('WcIcVapfqXw','5','Then I start to feel a bum bum one.');
fix('WcIcVapfqXw','6','When she dey give me small small one.');
fix('WcIcVapfqXw','7','I know say she stop it but sit down one one.');
fix('WcIcVapfqXw','8',"When she feelin' insecure one.");
fix('WcIcVapfqXw','9','Cause her friends go dey go mellow itching one one.');
fix('WcIcVapfqXw','10','Go dey go mellow itching one one one.');

// WGU_4-5RaxU - song lyrics, need periods
fix('WGU_4-5RaxU','0',"Motionless trust, love's gone behind.");
fix('WGU_4-5RaxU','1','Worked very hard, and it was divine.');
fix('WGU_4-5RaxU','2','Things fell down, I was losing my mind.');
fix('WGU_4-5RaxU','3','Seemed nice, the real thing, but I was so blind.');
fix('WGU_4-5RaxU','4',"Motionless trust, love's gone behind.");
fix('WGU_4-5RaxU','5',"In between, what I find is pleasing, and I'm feeling fine.");
fix('WGU_4-5RaxU','6',"Love is so confusing, there's no peace of mind.");
fix('WGU_4-5RaxU','7',"If I fear I'm losing you, it's just no good.");
fix('WGU_4-5RaxU','8',"You're cheesing like a hippo.");
fix('WGU_4-5RaxU','9','Once I loved, and it was a guess.');
fix('WGU_4-5RaxU','10','But soon turned out, I had a heart attack.');

// wi5Q3rlQaMI - Friends dialogue (mid-sentence splits)
fix('wi5Q3rlQaMI','2','Like we can make a deal, anything at all.');
fix('wi5Q3rlQaMI','3','But these are the three that Monica pre-approved.');
fix('wi5Q3rlQaMI','4','Uh, well, thanks a lot for hooking me up,');
fix('wi5Q3rlQaMI','5','Rach, and I want you to know that I want');
fix('wi5Q3rlQaMI','7',"I'm Monica's maid of honor, okay, don't");
fix('wi5Q3rlQaMI','8','Well, what\'s the deal with these? These look nice. Oh, they are nice. Do we');
fix('wi5Q3rlQaMI','9','We custom make tuxedos for celebrities, and then when they\'re done with them,');
fix('wi5Q3rlQaMI','10','They just send them back. You mean like');
fix('wi5Q3rlQaMI','11','For award shows? Some of them. You mean these tuxes have been down the red');
fix('wi5Q3rlQaMI','12','Carpet with people yelling, uh, who are you wearing? You look fabulous!');
fix('wi5Q3rlQaMI','13','Wait, mine. I suggest watching a little.');
fix('wi5Q3rlQaMI','14','Okay, who wore those?');
fix('wi5Q3rlQaMI','15',"Um, well, it's uh, this one's Tom Brokaw.");
fix('wi5Q3rlQaMI','16','Not bad.');
fix('wi5Q3rlQaMI','17',"This one is uh Paul O'Neal.");
fix('wi5Q3rlQaMI','18',"Who's that?");
fix('wi5Q3rlQaMI','19','He plays for the Yankees.');
fix('wi5Q3rlQaMI','20','Seriously, ESPN?');
fix('wi5Q3rlQaMI','21','Just once in a while, have it on in the background.');
fix('wi5Q3rlQaMI','22','Oh, this one was Pierce Brosnan. Pierce');
fix('wi5Q3rlQaMI','23','Brosnan, uh-huh. Are you serious?');
fix('wi5Q3rlQaMI','24',"007. This is James Bond's tux, so I have");
fix('wi5Q3rlQaMI','25',"To get married in James Bond's tux.");
fix('wi5Q3rlQaMI','26',"It's a pretty cool tux, it's not just");
fix('wi5Q3rlQaMI','27',"That I would be England's most powerful weapon.");
fix('wi5Q3rlQaMI','28','Jet setting, heartbreaker, on her');
fix('wi5Q3rlQaMI','29',"Majesty's Secret Service.");
fix('wi5Q3rlQaMI','30','A man who fears no one, with a license to kill. Thank you.');
fix('wi5Q3rlQaMI','31','Would Monica let me wear this?');
fix('wi5Q3rlQaMI','32','We should really learn how to play the real way.');
fix('wi5Q3rlQaMI','33','I like our way. Oh, hey, chess!');
fix('wi5Q3rlQaMI','34','Nice move, yeah.');
fix('wi5Q3rlQaMI','35','Hey, hey, so Joey, I just hooked Ross and');
fix('wi5Q3rlQaMI','36',"Chandler up with some tuxedos for the wedding. Do you need one? No, I'm performing the ceremony. I'm not wearing");
fix('wi5Q3rlQaMI','37','A tux. Well, what are you gonna wear?');
fix('wi5Q3rlQaMI','38','Multi-colored robes. Oh, and maybe a hat.');
fix('wi5Q3rlQaMI','39',"Huh, does Monica know about this? I don't");
fix('wi5Q3rlQaMI','40','Think so. Can I please be there when you tell her?');
fix('wi5Q3rlQaMI','41',"Hey, oh, Rachel. Wait, do you want to go to a movie tonight? Oh, you know what, I can't, I");
fix('wi5Q3rlQaMI','42','Have to have dinner with that Melissa girl. Can I come?');
fix('wi5Q3rlQaMI','43','Just hear the noise from my video camera.');
fix('wi5Q3rlQaMI','44','Can I tell you? Well, do you want to hear');
fix('wi5Q3rlQaMI','45',"What actually happened? To Joey's lewd version. Joey's");
fix('wi5Q3rlQaMI','46','His friend from college, and I made the stupid mistake of telling Joey that one');
fix('wi5Q3rlQaMI','47','Time she and I, you know,');
fix('wi5Q3rlQaMI','48','Kissed a little bit.');
fix('wi5Q3rlQaMI','49',"Yeah, I'm sure that happened.");
fix('wi5Q3rlQaMI','50','Hey, it happened, yeah.');
fix('wi5Q3rlQaMI','51','It was senior year in college, it was');
fix('wi5Q3rlQaMI','52','After the Sigma Chi luau, and Melissa and');
fix('wi5Q3rlQaMI','53','I got very drunk and we ended up kissing');
fix('wi5Q3rlQaMI','54','For several minutes, which means she had');
fix('wi5Q3rlQaMI','55','A couple spritzers and a quick peck on');
fix('wi5Q3rlQaMI','57','Why are you taking this away from me?');
fix('wi5Q3rlQaMI','58','Why is this so hard for you to believe?');
fix('wi5Q3rlQaMI','59',"Okay, I just... I didn't know that you were");
fix('wi5Q3rlQaMI','61','Foreign.');
fix('wi5Q3rlQaMI','62',"I'm not saying that I am a lesbian, I'm");
fix('wi5Q3rlQaMI','63','Just saying that this happened. Okay, it');
fix('wi5Q3rlQaMI','64',"Just seems pretty wild and you're, you know, so");
fix('wi5Q3rlQaMI','66',"Vanilla? I'm not vanilla. I don't... I've");
fix('wi5Q3rlQaMI','67','Done crazy things. I mean,');
fix('wi5Q3rlQaMI','68','I mean, I got drunk and married in Vegas');
fix('wi5Q3rlQaMI','69',"To Ross. All right, you know what, if you don't");
fix('wi5Q3rlQaMI','70',"Want to believe me about this, why don't you just come with me to dinner tonight");
fix('wi5Q3rlQaMI','71','And she will tell you. Okay, all right.');
fix('wi5Q3rlQaMI','72',"Yeah, because I just can't picture it. No, you can't get inside my head.");

// wIuBcb2T55Q - song
fix('wIuBcb2T55Q','0',"There's really no fuss.");
fix('wIuBcb2T55Q','1',"As long as you're next to me.");
fix('wIuBcb2T55Q','2','Just the two of us.');
fix('wIuBcb2T55Q','4',"I'm down on my hands and knees, begging you please, baby.");
fix('wIuBcb2T55Q','5',"I'm down on my hands and knees, begging you please, baby.");
fix('wIuBcb2T55Q','6','Show me your love.');

// wizgxRBfVTY - Friends dialogue (Ross/Rachel break up scene, lowercase starts)
fix('wizgxRBfVTY','0',"Rachel, come on, talk to me please. I can't");
fix('wizgxRBfVTY','1','Even look at you right now.');
fix('wizgxRBfVTY','2','What? Nothing, nothing.');
fix('wizgxRBfVTY','3','You just thought everything was okay? What? What are they talking about?');
fix('wizgxRBfVTY','4','Reach out, just get away from me. It was a');
fix('wizgxRBfVTY','5','Mistake. I made a mistake, okay.');
fix('wizgxRBfVTY','6','A mistake? What were you trying to put it');
fix('wizgxRBfVTY','7','In her purse?');
fix('wizgxRBfVTY','8','Ross, you had sex with another woman!');
fix('wizgxRBfVTY','9','Oh my god. Oh god, I knew something had to');
fix('wizgxRBfVTY','10','Be wrong because my fingernails did not');
fix('wizgxRBfVTY','11','Grow at all yesterday.');
fix('wizgxRBfVTY','12','Yeah, well I guess they had a fight and he got drunk.');
fix('wizgxRBfVTY','13',"You guys knew about that and you didn't tell us? He has sex and we get hit in our");
fix('wizgxRBfVTY','14',"Heads? You know what, I want you to leave. Get");
fix('wizgxRBfVTY','15',"Out of here. No, I know, I want to stay, I");
fix('wizgxRBfVTY','16','Want to talk about this.');
fix('wizgxRBfVTY','17','Okay, all right. How was she?');
fix('wizgxRBfVTY','18','What? Was she good? Don\'t answer that.');
fix('wizgxRBfVTY','19',"Come on, Ross. You said you wanted to talk");
fix('wizgxRBfVTY','20','About it. Let\'s talk about it. How was she?');
fix('wizgxRBfVTY','21','She was awful. She was not good. Not good.');
fix('wizgxRBfVTY','22','She... she was different.');
fix('wizgxRBfVTY','23','Good different? Nobody likes change.');
fix('wizgxRBfVTY','24',"Should we do something? Yeah, never cheat on Rachel.");
fix('wizgxRBfVTY','25',"I'm sorry, okay. I'm sorry. I... I was");
fix('wizgxRBfVTY','26','Disgusted with myself, and this morning I was so... I was... I was so');
fix('wizgxRBfVTY','27','Upset, and then I got your message and I');
fix('wizgxRBfVTY','28','Was so happy, and all I wanted was to get');
fix('wizgxRBfVTY','29','Her out of my apartment as fast as... whoa,');
fix('wizgxRBfVTY','30','Whoa, whoa. Wait a minute.');
fix('wizgxRBfVTY','31','Oh my god. She was there. She was still');
fix('wizgxRBfVTY','33','Hey, the important thing is she meant, she');
fix('wizgxRBfVTY','34','Meant nothing to me, and yet she was');
fix('wizgxRBfVTY','35','Worth jeopardizing our relationship?');
fix('wizgxRBfVTY','36',"Look, I didn't think there was a relationship to jeopardize. I thought we");
fix('wizgxRBfVTY','37',"Were broken up. We were on a break that, for all I knew, could last forever. That to me is a break");
fix('wizgxRBfVTY','38',"Up. You think you're gonna get out of this on a technicality? I'm not trying to get");
fix('wizgxRBfVTY','39','Out of anything, okay. I thought our relationship was dead. Well,');
fix('wizgxRBfVTY','40','You sure had a hell of a time at the wake.');
fix('wizgxRBfVTY','41',"You know what, I don't think we should listen to this anymore. What? What are you");
fix('wizgxRBfVTY','43',"I can't go out there. Why not? I'm hungry.");
fix('wizgxRBfVTY','44',"They'll know we've been listening. God.");
fix('wizgxRBfVTY','45',"I'd have to hear about it from Gunther. Come on, like I wanted him to");
fix('wizgxRBfVTY','46',"Tell you. I ran all over the place trying to make sure that didn't happen.");
fix('wizgxRBfVTY','47','Oh, that is so sweet.');
fix('wizgxRBfVTY','48',"I think I'm falling in love with you all");
fix('wizgxRBfVTY','49','Over again.');
fix('wizgxRBfVTY','50','Bye.');

// WLex9xvQycQ - talk show dialogue
fix('WLex9xvQycQ','0',"Accents to such a small country, everybody sort of puts on different voices when they're doing little bits.");
fix('WLex9xvQycQ','2',"Somebody came out and said, oh, do you need help with your bags? And I thought they were doing a bit.");
fix('WLex9xvQycQ','3','I went, oh, I\'ve been traveling all day. I have no idea.');
fix('WLex9xvQycQ','4','Kept talking like that.');
fix('WLex9xvQycQ','5','So I had to like slowly transition out of it.');
fix('WLex9xvQycQ','6','And I know that that sounds like an exaggeration of their voice,');
fix('WLex9xvQycQ','7','But then I was back in the country several years later, and they were on TV on');
fix('WLex9xvQycQ','8','Gogglebox, because it was Steph and Dom from Gogglebox.');
fix('WLex9xvQycQ','9','Amazing!');
fix('WLex9xvQycQ','10','So they actually talk like that. That is... I never knew that that was a real hotel. Yeah. Yeah, you stay there?');
fix('WLex9xvQycQ','11','Yeah, and accidentally made fun of them to their face.');
fix('WLex9xvQycQ','12','Alan, what\'s that story you have about that? You\'re a very good friend of mine.');
fix('WLex9xvQycQ','13','She was going through a really stressful time, and a lovely aunt said');

// wwTPr4RjgAs - Friends dialogue (Eddie storyline)
fix('wwTPr4RjgAs','0','Hi, hi. I\'m looking for Eddie. Manoa? Oh,');
fix('wwTPr4RjgAs','1',"Uh, he's not here right now. I'm Chandler.");
fix('wwTPr4RjgAs','2','Can I take a message? Or... or a fish tank?');
fix('wwTPr4RjgAs','3',"Come on in. I'm Tilly. Oh, I gathered by");
fix('wwTPr4RjgAs','4','That. Oh, that he told you about me? Oh,');
fix('wwTPr4RjgAs','5','Yeah, your name came up in a conversation.');
fix('wwTPr4RjgAs','6','That terrified me to my very soul. He\'s');
fix('wwTPr4RjgAs','7','Kind of intense, huh?');
fix('wwTPr4RjgAs','8','Yes. Hey, can I ask you, is Eddie a little...');
fix('wwTPr4RjgAs','9','A little what? A bit country? Come on in,');
fix('wwTPr4RjgAs','10','Here, you roomie!');
fix('wwTPr4RjgAs','11','Whoa, Tilly! Eddie, I just came by to drop');
fix('wwTPr4RjgAs','12','Off your tank. Very thoughtful of you.');
fix('wwTPr4RjgAs','13',"It's very thoughtful. Okay, then I'm gonna");
fix('wwTPr4RjgAs','14','Go. Bye-bye. Bye-bye. So we get in the fish?');
fix('wwTPr4RjgAs','15','You went sex with it, did\'nt you?');
fix('wwTPr4RjgAs','16',"Eddie, I didn't sleep with your ex-girlfriend. That's very interesting.");
fix('wwTPr4RjgAs','17','You know, cuz that\'s exactly what someone');
fix('wwTPr4RjgAs','18','Who slept with her would say. This is');
fix('wwTPr4RjgAs','19',"Crazy. She came over for like two minutes, dropped off the fish tank, and left. End");
fix('wwTPr4RjgAs','20','Of story.');
fix('wwTPr4RjgAs','21','Where\'s Buddy? Buddy? There was no fish');
fix('wwTPr4RjgAs','22',"When she dropped it off. Your balls! This");
fix('wwTPr4RjgAs','23','Is... this is unbelievable. You sleep with');
fix('wwTPr4RjgAs','24','My ex-girlfriend, then you insult my intelligence by lying about it, and then');
fix('wwTPr4RjgAs','25','You kill my fish? My Buddy? I didn\'t kill');
fix('wwTPr4RjgAs','26','Your fish. Look, Eddie, would you look at');
fix('wwTPr4RjgAs','27',"What I'm doing here? Now that can't be smart.");
fix('wwTPr4RjgAs','28',"So we're just gonna take this guy, right?");
fix('wwTPr4RjgAs','29','Can jello.');
fix('wwTPr4RjgAs','30','You.');

// wXhTHyIgQ_U - song (Post Malone style)
fix('wXhTHyIgQ_U','0','Oh, oh, oh, oh, oh, oh, oh, oh.');
fix('wXhTHyIgQ_U','1','We couldn\'t turn around till we were upside down.');
fix('wXhTHyIgQ_U','2',"I'll be the bad guy now, but no, I ain't too proud.");
fix('wXhTHyIgQ_U','3',"I couldn't be there, keep it without time.");
fix('wXhTHyIgQ_U','4',"You don't believe it, we do this every time.");
fix('wXhTHyIgQ_U','5',"Seasons change and our love went cold, feed the flag cause we can't let it go.");
fix('wXhTHyIgQ_U','6','Run away, but we\'re running in circles. Run away, run away.');
fix('wXhTHyIgQ_U','7',"I dare you to do so, I'm waiting on you.");

// x7NB4AjQ96A - song lyrics (already good, need periods)
fix('x7NB4AjQ96A','0','And I put breakfast at your table.');
fix('x7NB4AjQ96A','1','And make sure that your coffee has its sugar and cream.');
fix('x7NB4AjQ96A','2','Your eggs are over easy.');
fix('x7NB4AjQ96A','3','Your toast unlikely.');
fix('x7NB4AjQ96A','4',"All that's missing is your morning kiss");
fix('x7NB4AjQ96A','5','That used to greet me.');
fix('x7NB4AjQ96A','6','Now you say the juice is sour.');
fix('x7NB4AjQ96A','7','It used to be so sweet.');
fix('x7NB4AjQ96A','8',"And I can't help but to wonder");
fix('x7NB4AjQ96A','9',"If you're talking about me.");
fix('x7NB4AjQ96A','10','We don\'t talk the way we used to talk,');
fix('x7NB4AjQ96A','11',"It's hurting so deep.");
fix('x7NB4AjQ96A','12',"I've got my pride, I will not cry,");
fix('x7NB4AjQ96A','13',"But it's making me weak.");
fix('x7NB4AjQ96A','14',"I bet you're superwoman,");
fix('x7NB4AjQ96A','15',"I'm not the kind of girl that you can love.");

// xGiBiHocSZM - song lyrics (already have punctuation, need periods at end)
fix('xGiBiHocSZM','0','Bring it up now, drop girl, you can be my new thang.');
fix('xGiBiHocSZM','1','Get sexy girl, get sexy. Get sexy girl, get sexy.');
fix('xGiBiHocSZM','2','Get sexy girl, get sexy.');
fix('xGiBiHocSZM','3',"I heard it's your birthday. Grab a drink if you thirsty.");
fix('xGiBiHocSZM','4','I can see that you need a O.G. I can do you the best and the worst way.');
fix('xGiBiHocSZM','5','Pop it like a go-go, drop it like a low-low.');
fix('xGiBiHocSZM','6',"It's the GoPro, so I can watch that back HD slow-mo.");
fix('xGiBiHocSZM','7',"I don't care if it's the first date, I'll take you back to my place.");
fix('xGiBiHocSZM','8',"We can skip first base, cause a player like me tryna slide into home plate.");
fix('xGiBiHocSZM','9','Clap, clap, make it clap, lights on, lights off, make it clap.');
fix('xGiBiHocSZM','10',"Yeah, make it clap. My name ain't Santa but she sittin' on my lap.");

// xhM7Mh9T_XE - Clueless dialogue (lowercase starts)
fix('xhM7Mh9T_XE','0','Or are you just trying to stay warm in front of the refrigerator?');
fix('xhM7Mh9T_XE','1','Ow! Oh wow, you\'re feeling out there. Oh wow, your face is catching up with your mouth. I work by Dad\'s');
fix('xhM7Mh9T_XE','2','Office. He is not your dad. Why don\'t you torture your new family? Hey, just because my mother marries someone else doesn\'t mean he\'s my');
fix('xhM7Mh9T_XE','3',"Father. Actually, Kato, that's exactly what it means. I hope you're not thinking of staying here. I sure want to. I'm");
fix('xhM7Mh9T_XE','4',"Sure you do. I got a place in Westwood near school. Shouldn't you go to school on the East Coast? I hear girls at NYU aren't at all");
fix('xhM7Mh9T_XE','5',"Particular. You're funny. What's your problem, Beba?");
fix('xhM7Mh9T_XE','6','Infantry pure infiltrating machine gun fire. You just got here and already you\'re playing couch commando. Hey, in some parts');
fix('xhM7Mh9T_XE','7','Of the universe, maybe not in contempo casual, but in some parts it\'s considered cool to know what\'s going on in the world. Thank');
fix('xhM7Mh9T_XE','8','You, Josh. I so need lessons from you on how to be cool. Tell me that part about Kenny G again.');
fix('xhM7Mh9T_XE','9','Come on, you chuckleheads, get in here.');
fix('xhM7Mh9T_XE','10','Josh, are you still growing? You look taller than you did at Easter. I think so.');

// Xk6RLMp5WMw - Good Wife-style legal drama
fix('Xk6RLMp5WMw','0','Have to throw in something extra, then let\'s haggle.');
fix('Xk6RLMp5WMw','1','Alicia, there you are. Carla Browning. Hello, Mrs. Florek. I think I\'m a fan.');
fix('Xk6RLMp5WMw','2','Thank you. I think... chocolate raisins? No, thank you. It\'s funny, most divorce');
fix('Xk6RLMp5WMw','3','Lawyers have Kleenex. Yes, I find it harder for my clients to cry when their');
fix('Xk6RLMp5WMw','4','Mouths are filled with M&Ms. Have you been to many divorce attorneys,');
fix('Xk6RLMp5WMw','5','Miss Browning? A few. My husband and I think of a series of relapses: him');
fix('Xk6RLMp5WMw','6','Swearing to change, me forgiving him, forgetting, both of us repeating. I think');
fix('Xk6RLMp5WMw','8',"Point me in the direction of the settlement conference. I moved out about");
fix('Xk6RLMp5WMk','9','A week ago and he\'s been calling at all hours.');

// xMPr1pIzF0k - Game of Thrones
fix('xMPr1pIzF0k','0','You seem quite knowledgeable about the Unsullied. Did you spend much time in Essos? Five years.');
fix('xMPr1pIzF0k','1','May I ask why? It is a big and beautiful world.');
fix('xMPr1pIzF0k','2','Most of us live and die in the same corner where we were born and never get to see any of it.');
fix('xMPr1pIzF0k','3',"I don't want to be most of us. Most of us aren't princes.");
fix('xMPr1pIzF0k','4','You are from Essos. Where? Lys.');
fix('xMPr1pIzF0k','5',"I have an ear for accents. I've lost my accent entirely. I have an ear for that as well.");
fix('xMPr1pIzF0k','6',"How did you get here? It's a long story. One you don't like telling people.");
fix('xMPr1pIzF0k','7','People I trust. My paramour Eladia, she would find you very interesting. You should come to the brothel and');
fix('xMPr1pIzF0k','8','Meet her. We\'ve brought our own wine. Not this? Will they serve here?');

// XqSYC_vwhDg - Groundhog Day (mostly correct, minor fixes)
fix('XqSYC_vwhDg','0','You. Not a chance. Ned! Ryerson! Needle nose Ned, Ned the head, come on buddy, Case');
fix('XqSYC_vwhDg','8','Stand here and talk with you, but I\'m not going to. Hey, that\'s alright, I\'ll walk with you. You know, whenever I see an opportunity now, I');
fix('XqSYC_vwhDg','9','Charge it like a bull. Ned the Bull, that\'s me now.');

// xRLDup3Agkg - legal TV show
fix('xRLDup3Agkg','0','I said the words you just there quoted, and this was on the same program you');
fix('xRLDup3Agkg','2','The answer is yes. The answer to what is yes? Yes, that\'s the same program where I called');
fix('xRLDup3Agkg','3','The president of the United States a terrorist, and yes, Emily, I could see');
fix('xRLDup3Agkg','4','There are black people on the jury. Thank you, Mr. Roscoe. So, to the best of');
fix('xRLDup3Agkg','5','Your knowledge, do the Chicago police consider Mrs. Willans a suspect in the');
fix('xRLDup3Agkg','6','Disappearance of her daughter? Isn\'t the PC term "person of interest"? Let me just');
fix('xRLDup3Agkg','7','Keep this real simple for you. Knock once for yes, twice for no. Isn\'t anyone');
fix('xRLDup3Agkg','8','Gonna object? Okay, actually I don\'t want anyone knocking in my court. Mr. Roscoe,');
fix('xRLDup3Agkg','9','When you publicly accused Cheryl Willans of murder, what evidence did you have');
fix('xRLDup3Agkg','10','That the prosecutors didn\'t? The prosecutor has to convince the jury. I\'m');
fix('xRLDup3Agkg','11','A commentator, I only have to convince myself. And so, once you convince');
fix('xRLDup3Agkg','12','Yourself, it\'s a fact.');

// xs3_hNYAVRw - legal drama
fix('xs3_hNYAVRw','0','Sperm donor who also happens to be harassing the parents in his quest for');
fix('xs3_hNYAVRw','1','Visitation. Well, yeah, but I mean, without this man\'s sperm, the child in question');
fix('xs3_hNYAVRw','2',"Wouldn't exist. Now you're thinking like a lawyer.");
fix('xs3_hNYAVRw','3','Yes, Ms. Woods. Although Mr. Huntington makes an excellent point, I have to');
fix('xs3_hNYAVRw','4','Wonder if the defendant kept a thorough record of every sperm emission made');
fix('xs3_hNYAVRw','5','Throughout his life. Interesting. Why do you ask? Well, unless the defendant');
fix('xs3_hNYAVRw','6','Attempted to contact every single one-night stand to determine if a child');
fix('xs3_hNYAVRw','7','Resulted in those unions, he has no parental claim over this child');
fix('xs3_hNYAVRw','8','Whatsoever. Why now? Why this sperm? I see your point. And for that matter, all');
fix('xs3_hNYAVRw','9','Masturbatory emissions where his sperm was clearly not seeking an egg could be');
fix('xs3_hNYAVRw','10','Termed reckless abandonment. I believe you\'ve just won your case.');

// XsiiIa6bs9I - Napoleon Dynamite
fix('XsiiIa6bs9I','0',"Nobody's gonna go out with me.");
fix('XsiiIa6bs9I','1','Have you asked anybody yet? No, but who would? I don\'t even have any good skills.');
fix('XsiiIa6bs9I','2','What do you mean? You know, like...');
fix('XsiiIa6bs9I','3','Nunchuck skills, bow hunting skills, computer hacking skills.');
fix('XsiiIa6bs9I','4','Girls only want boyfriends who have great skills.');

// XTXfcFe4Tbc - awards show
fix('XTXfcFe4Tbc','0','To Royal Harry? No.');
fix('XTXfcFe4Tbc','1','Royal Phil, at this Royal Palace place. Sorry.');
fix('XTXfcFe4Tbc','2','I was just told backstage that no one\'s getting a massive gift bag tonight.');
fix('XTXfcFe4Tbc','3','Yeah, instead you\'re all getting a');
fix('XTXfcFe4Tbc','4','Gifting bag. So');
fix('XTXfcFe4Tbc','5','Maybe it is me who\'ll win best original score at the after party tonight.');
fix('XTXfcFe4Tbc','6','Now, as Graham was saying, tonight it\'s all about sustainability.');
fix('XTXfcFe4Tbc','7','So I made this dress by sewing');

// XtYRC00IoUs - Dead Poets Society style
fix('XtYRC00IoUs','0','To woo women. Today we\'re going to be talking about William Shakespeare.');
fix('XtYRC00IoUs','1','Oh God, I know. A lot of you look forward to this about as much as you look forward to root canal work.');
fix('XtYRC00IoUs','2','We\'re going to talk about Shakespeare as someone who writes something very interesting. Now, many of you have seen Shakespeare done very');
fix('XtYRC00IoUs','3','Much like this. "Oh, Titus, bring your friend hither."');
fix('XtYRC00IoUs','4','But if any of you have seen Mr. Marlon Brando, no, Shakespeare can be different. France,');
fix('XtYRC00IoUs','5','Romans, countrymen, let me rest.');
fix('XtYRC00IoUs','6','You can also imagine, maybe, John Wayne as Macbeth going, "Well, is this a dagger I see before');
fix('XtYRC00IoUs','7','Me?" Dogs, sir?');
fix('XtYRC00IoUs','8','Oh, not just now. I do enjoy a good dog once in a while, sir.');
fix('XtYRC00IoUs','9','You can have yourself a three-course meal from one dog. Start with your canine crudités.');
fix('XtYRC00IoUs','10','Go to your five-dog flambé for main course.');

// XxoN6dFwawM - interview/panel
fix('XxoN6dFwawM','0',"I don't know.");
fix('XxoN6dFwawM','1','The UK thing.');
fix('XxoN6dFwawM','2','But they... they... they wrote the bump in. Yeah, when I first went to meet the director and I just');
fix('XxoN6dFwawM','3',"Found out I was pregnant. And I thought, I can't lie. It's gonna become obvious, and so I said I was pregnant, and");
fix('XxoN6dFwawM','4','Susanna went, oh! Okay. So she said, I must talk to the');
fix('XxoN6dFwawM','5','Producers. And so');
fix('XxoN6dFwawM','6',"Lucky she's not here, because then I can tell you it's really good.");
fix('XxoN6dFwawM','7','And then, and I was going, and if you remember Fargo, Frances McDormand was pregnant. It really added to it. I think it would help,');
fix('XxoN6dFwawM','8',"Sort of fingers crossed. And they went away and came back and said, yeah, okay, we can do pregnant. Yeah. Yeah, we're");
fix('XxoN6dFwawM','9',"Riding in. So, I don't carry a bag in front of yourself, or so big there was, there'd");
fix('XxoN6dFwawM','10','Have been no hiding it. Also, I was waddling quite a lot, and Susanna once said');

// XXYlFuWEuKI - song (The Weeknd)
fix('XXYlFuWEuKI','0',"I'll make you cry when I run away. You");
fix('XXYlFuWEuKI','1',"Could've asked me why I broke your heart. You could've told me that you");
fix('XXYlFuWEuKI','2',"Fell apart. But you won't bless me like I wasn't there. And just");
fix('XXYlFuWEuKI','3',"Pretended like you didn't care. I don't know why I");
fix('XXYlFuWEuKI','5',"I'll make you cry when I run away. Take");
fix('XXYlFuWEuKI','6','Me back, cause I wanna stay. Save your tears for another');
fix('XXYlFuWEuKI','7','Day. Save your tears for another day.');

// x_Dephm0Z9I - wedding speech comedy
fix('x_Dephm0Z9I','0','Post-divorce properties. And let me just explain the context. The defendant, when');
fix('x_Dephm0Z9I','1','Tim asked me to do his best man speech, my immediate reaction was, how much are');
fix('x_Dephm0Z9I','2','You gonna pay me, you little shit? I don\'t write for free. You know, these were the');
fix('x_Dephm0Z9I','3','Girls available to him at that time. Hello, girls. And this is how far he got');
fix('x_Dephm0Z9I','4','With each of them. Let me explain the code: five, blowjob; eight, full penetrative.');
fix('x_Dephm0Z9I','5','And so, a toast to the man with the worst haircut but the best bride in the room.');
fix('x_Dephm0Z9I','6','Ladies and gentlemen, Tim and Mary. I wish I\'d said I love you. You did, dad. It was');
fix('x_Dephm0Z9I','7','Implied. I\'m not sure implied is good enough for a wedding day. Yeah, no, don\'t');
fix('x_Dephm0Z9I','8','Do it. It\'s fine. I\'m sorry. I\'m so happy with it as it was.');

// y6baRWhZ9sE - song (Can't Take My Eyes Off You)
fix('y6baRWhZ9sE','0',"You're just too good to be true.");
fix('y6baRWhZ9sE','1',"Can't take my eyes off of you.");
fix('y6baRWhZ9sE','2',"You'd be like heaven to touch.");
fix('y6baRWhZ9sE','3','I wanna hold you so much.');
fix('y6baRWhZ9sE','4','At long last love has arrived.');
fix('y6baRWhZ9sE','5',"And I thank God I'm alive.");
fix('y6baRWhZ9sE','6',"You're just too good to be true.");
fix('y6baRWhZ9sE','7',"Can't take my eyes off of you.");
fix('y6baRWhZ9sE','8','I love you baby.');
fix('y6baRWhZ9sE','9',"And if it's quite alright,");
fix('y6baRWhZ9sE','10','I need you baby.');
fix('y6baRWhZ9sE','11','You on the lonely night.');
fix('y6baRWhZ9sE','12','I love you baby.');
fix('y6baRWhZ9sE','13','Trust in me when I say.');

// Y6bbMQXQ180 - TED talk (already well punctuated)
fix('Y6bbMQXQ180','3',"She said, what leads to success? And I felt really badly because I couldn't");
fix('Y6bbMQXQ180','4',"Give her a good answer. So I get off the plane and I come to TED. And I think, jeez, I'm");
fix('Y6bbMQXQ180','5',"In the middle of a room of successful people. So why don't I ask them what helped them succeed");
fix('Y6bbMQXQ180','6','And pass it on to kids? So here we are, seven years, 500 interviews later, and I\'m going');
fix('Y6bbMQXQ180','7','To tell you what really leads to success and makes TEDsters tick. And the first thing is');

// YcpMVsvK8pk - song (mid-sentence split)
fix('YcpMVsvK8pk','0',"I can't");
fix('YcpMVsvK8pk','1','Believe it ends this');
fix('YcpMVsvK8pk','2','Way. Thought you\'d always stay. Now I gotta wonder what');
fix('YcpMVsvK8pk','3',"I've changed. Think I have to go walking all alone. Hate");
fix('YcpMVsvK8pk','4','To see it all go down the drain. Wanted to be with you,');
fix('YcpMVsvK8pk','5','Wanted to make it through. But did you?');
fix('YcpMVsvK8pk','6','I swear I knew.');
fix('YcpMVsvK8pk','7','Now that it\'s over, you blame it all on me. I know I should be better.');

// YGViIjOCAoY - TV show (lowercase starts)
fix('YGViIjOCAoY','0',"Dangerous combination. Why don't you come in? Make yourself comfortable.");
fix('YGViIjOCAoY','1',"If you're a little... woman. We'll be down any minute. Great.");
fix('YGViIjOCAoY','2','Thanks a lot, buddy. Thanks.');
fix('YGViIjOCAoY','3',"Hey, my brother, you won't let her tip him like that?");
fix('YGViIjOCAoY','4','Man, what did she do when y\'all eat out?');
fix('YGViIjOCAoY','5','Everybody, this is Frank. Frank, this is everybody. Come on, honey, I\'ll show you to your room.');

// yIieWnzBOJA - hot sauce challenge
fix('yIieWnzBOJA','0','All right, so whoa, going right in.');
fix('yIieWnzBOJA','1',"It hasn't kicked in yet. Maybe it won't.");
fix('yIieWnzBOJA','2','Mmm, I think this is where it starts to... oh, yeah, that is where you turn the corner though.');
fix('yIieWnzBOJA','3','Yeah, it\'s hot right? A different... yeah, it does a different vibe altogether.');
fix('yIieWnzBOJA','4','Yeah, unusual that the first thing it hits from here is your eyeball. I might ask you to spoon me in a second.');
fix('yIieWnzBOJA','5','Whatever you need, whatever you need to get through it. Oh!');
fix('yIieWnzBOJA','6','Wow, that comes in strong.');
fix('yIieWnzBOJA','7','They all have their pitfalls, and it grows and it grows and it grows.');
fix('yIieWnzBOJA','9','That\'s hot. Oh!');
fix('yIieWnzBOJA','11','Totally different level shit. I\'m literally crying. No, I know, it\'s fine.');
fix('yIieWnzBOJA','12',"That's the point of this right now.");
fix('yIieWnzBOJA','13',"I'm like gushing.");

// YkgkThdzX-8 - Imagine (John Lennon) - fragment
fix('YkgkThdzX-8','0',"Imagine there's no heaven.");
fix('YkgkThdzX-8','1',"And there's no heaven for me.");

// yn5oqtmzGMk - already has period
// "what's going on there." - needs capitalization
fix('yn5oqtmzGMk','0',"What's going on there.");

// yRadWIDAtRI - Home Alone
fix('yRadWIDAtRI','0','Going on a trip? Where you going, kid?');
fix('yRadWIDAtRI','1','Knock, knock, knock. Knock, knock, knock.');
fix('yRadWIDAtRI','2','Okay, that\'s $122.50.');
fix('yRadWIDAtRI','3',"Not for me, kid. I don't live here. Oh, you're just around for the holidays?");
fix('yRadWIDAtRI','4','I guess you could say that. Hey, pizza\'s here!');
fix('yRadWIDAtRI','5',"That's $122.50. It's my brother's house. He'll take care of it.");
fix('yRadWIDAtRI','6','Hey, listen, uh,');
fix('yRadWIDAtRI','7','Hi. Hi. Are you Mr. McAllister? Yeah. The Mr. McAllister who lives here? Yes. Oh, good, because');
fix('yRadWIDAtRI','8','Somebody owes me $122.50. I\'d like a word with you, sir. Am I under arrest or something? No, no, no, no, no.');
fix('yRadWIDAtRI','9','It\'s Christmas time. There\'s always a lot of burglaries around the holidays. So we\'re just checking the neighborhood to see if everyone\'s taking');
fix('yRadWIDAtRI','10','The proper precautions, that\'s all. Oh yeah? Well, we have automatic timers for our lights, locks for our doors.');
fix('yRadWIDAtRI','11','That\'s about as well as anybody can do these days, right? Did you get some eggnog or something like that?');

// yrB-TU5PuAQ - legal drama
fix('yrB-TU5PuAQ','0','I imagine that you worked on one right after the other, it appears.');
fix('yrB-TU5PuAQ','1','So in both cases the DNA matched the same culprit, Manny Lyons. Is that correct? It is. So, let');
fix('yrB-TU5PuAQ','2','Let me follow the logic here. Manny Lyons,');
fix('yrB-TU5PuAQ','3','Who never set foot in Chicago. Objection, not in evidence. I will sustain that.');
fix('yrB-TU5PuAQ','4',"Isn't it true, Dr. Gertzman, the only connection between Manny Lyons and Christy Barbosa is that you worked on both cases? Objection, argumentative.");
fix('yrB-TU5PuAQ','5','Mrs. Clark, this is not a debating society. Sustained.');
fix('yrB-TU5PuAQ','6','Dr. Gertzman, would you say that the standard of a commercial lab is relaxed? No. And');
fix('yrB-TU5PuAQ','7',"Your Honor, may I answer her earlier question? Personal privilege. If you'd like.");
fix('yrB-TU5PuAQ','8','We handle an immense backlog of untested rape kits from crime labs all across the country.');
fix('yrB-TU5PuAQ','9',"We do so with speed and professionalism. Yet, isn't it true, sir, that your lab almost lost its accreditation in");
fix('yrB-TU5PuAQ','10','2005 when you cross-contaminated?');

// YSvomXlbTUM - Billy Joel song
fix('YSvomXlbTUM','0',"It's all about soul, it's all about");
fix('YSvomXlbTUM','1',"Faith and a deeper devotion. It's all about faith. It's all about soul, cause");
fix('YSvomXlbTUM','2',"Under love is a stronger emotion. She's gotta be strong,");
fix('YSvomXlbTUM','3','Cause so many things getting out of control. She\'ll drive her');
fix('YSvomXlbTUM','4',"Away. Why does she stay? It's all about soul.");

// yXnk3n-qNrI - movie scene
fix('yXnk3n-qNrI','0',"Okay, it's working. Let's go.");
fix('yXnk3n-qNrI','1','Where are you going, X.T.?');
fix('yXnk3n-qNrI','2','You see her? Yeah, I see her.');
fix('yXnk3n-qNrI','3','Your life burns faster.');

// YX_OxBfsvbk - TED talk (words start with caps due to split, each is mid-sentence fragment)
// These are mid-sentence splits so the leading cap is already there.
// Main fixes: add periods where sentences end, fix internal punctuation
fix('YX_OxBfsvbk','0','I have the answer to a question that');
fix('YX_OxBfsvbk','1',"We've all asked. The question is, why is");
fix('YX_OxBfsvbk','2','It that the letter X represents the');
fix('YX_OxBfsvbk','3',"Unknown? Now, I... I know we learned that in");
fix('YX_OxBfsvbk','4','Math class, but now it\'s everywhere in');
fix('YX_OxBfsvbk','6','Project X, TED');
fix('YX_OxBfsvbk','7','X. Where\'d that come from? About six years');
fix('YX_OxBfsvbk','8','Ago, I decided that I would learn Arabic,');
fix('YX_OxBfsvbk','10','Logical language. To write a word or a');
fix('YX_OxBfsvbk','11','Phrase or a sentence in Arabic is like');
fix('YX_OxBfsvbk','13','Is extremely precise and carries a lot');
fix('YX_OxBfsvbk','14',"Of information. That's one of the reasons");
fix('YX_OxBfsvbk','16','As Western science and mathematics and');
fix('YX_OxBfsvbk','18','First few centuries of the Common Era by');
fix('YX_OxBfsvbk','20','Uh, this includes the little system in');
fix('YX_OxBfsvbk','21','Arabic called Al-Jabra, and Al-Jabra');
fix('YX_OxBfsvbk','22','Roughly translates to the system for');
fix('YX_OxBfsvbk','23','Reconciling disparate parts. Al-Jabra');
fix('YX_OxBfsvbk','24','Finally came into English as "algebra." One');
fix('YX_OxBfsvbk','25','Example among many: the Arabic text');
fix('YX_OxBfsvbk','29','Century. And when they arrived, there was');
fix('YX_OxBfsvbk','33','Problems. One problem is, there are');
fix('YX_OxBfsvbk','34',"Some sounds in Arabic that just don't");
fix('YX_OxBfsvbk','36',"That one. Also, those very sounds tend not");
fix('YX_OxBfsvbk','40',"Here's one of the culprits. This is the");
fix('YX_OxBfsvbk','42',"Think of as sh, sh. It's also the very");
fix('YX_OxBfsvbk','43','First letter of the word shun, which');
fix('YX_OxBfsvbk','44','Means something, just like the English');
fix('YX_OxBfsvbk','46','Thing. Now, in Arabic, we can make this');
fix('YX_OxBfsvbk','47','Definite by adding the definite article');
fix('YX_OxBfsvbk','48',"Al, so this is Al-shun, the unknown thing.");
fix('YX_OxBfsvbk','50','Throughout early mathematics, such as');
fix('YX_OxBfsvbk','51','Proofs. The problem for the medieval');
fix('YX_OxBfsvbk','53',"Translating this material is that the");
fix('YX_OxBfsvbk','54','Letter Shen and the word shun can\'t be');
fix('YX_OxBfsvbk','56',"Doesn't have that sh, that sound. So by");
fix('YX_OxBfsvbk','58',"They borrowed the ck sound, the C sound");
fix('YX_OxBfsvbk','61','Kai. Later, when this material was');
fix('YX_OxBfsvbk','63','Language, which is to say Latin, they');
fix('YX_OxBfsvbk','64','Simply replaced the Greek Kai with the');
fix('YX_OxBfsvbk','65','Latin X. And once that happened, once this');
fix('YX_OxBfsvbk','67','Basis for mathematics textbooks for');
fix('YX_OxBfsvbk','68','Almost 600 years. But now we have the');
fix('YX_OxBfsvbk','69','Answer to our question. Why is it that X');
fix('YX_OxBfsvbk','70',"Is the unknown? X is the unknown because");
fix('YX_OxBfsvbk','71',"You can't say sh in");
fix('YX_OxBfsvbk','72','Spanish. And I thought that was worth');
fix('YX_OxBfsvbk','73','Sharing.');

// yy9PuYMU29g - song lyrics
fix('yy9PuYMU29g','0',"And I'm gonna love you.");
fix('yy9PuYMU29g','1','Birds will fly south when the winter comes.');
fix('yy9PuYMU29g','2',"Snow's gonna fall and rivers gonna run.");
fix('yy9PuYMU29g','3',"April's gonna rain and flowers gonna bloom.");
fix('yy9PuYMU29g','4',"And I'm gonna love you");
fix('yy9PuYMU29g','5','So good that it almost hurts.');
fix('yy9PuYMU29g','6','Steady and true as a Bible verse.');
fix('yy9PuYMU29g','7','My heart skips just thinking of you.');
fix('yy9PuYMU29g','8',"Go on and bet it all, baby, we can't lose.");
fix('yy9PuYMU29g','9',"Earth's gonna shake every now and then.");
fix('yy9PuYMU29g','10','Some runaway roads are gonna dead end.');

// Z-RMCM0NxaY - song fragments
fix('Z-RMCM0NxaY','0','Give it to');
fix('Z-RMCM0NxaY','1','Me.');
fix('Z-RMCM0NxaY','2','You took everything from me.');
fix('Z-RMCM0NxaY','3','You will.');
fix('Z-RMCM0NxaY','4','I got it.');

// z6mEmsQJZ90 - Forrest Gump
fix('z6mEmsQJZ90','0','They decided the best way for me to fight the communists was to play ping-pong. So I was in the');
fix('z6mEmsQJZ90','1','Special services, traveling around the country, cheering up all them wounded veterans and showing');
fix('z6mEmsQJZ90','2','Them how to play ping-pong. I was so good that some years later the army decided that I should');
fix('z6mEmsQJZ90','3','Be on the All-America ping-pong team. We were the first Americans to visit the land of China in like');
fix('z6mEmsQJZ90','4','A million years or something like that. Somebody said world peace was in our hands, but all I did');
fix('z6mEmsQJZ90','5','Was play ping-pong. When I got home I was a national celebrity, famous or even in cat and kangaroo.');
fix('z6mEmsQJZ90','6','Uh, here he is, Forrest Gump, right here!');
fix('z6mEmsQJZ90','7','Forrest Gump, John Lennon. Welcome home. You had quite a trip. Can you, uh, tell us, um,');
fix('z6mEmsQJZ90','8','What was China like? In the land of China...');

// ZB600rRlPO8 - song (Crush)
fix('ZB600rRlPO8','0','Something about the secrecy of us.');
fix('ZB600rRlPO8','1','Then it hits me like reality.');
fix('ZB600rRlPO8','2','I can lose them to a fantasy.');
fix('ZB600rRlPO8','3',"It ain't heartbreak, but it still hurts enough.");
fix('ZB600rRlPO8','4',"Oh baby, I'm crushed. It won't ever be enough.");
fix('ZB600rRlPO8','5',"Somebody call an ambulance. It won't ever be enough. It won't ever be enough.");
fix('ZB600rRlPO8','6','Crush. It\'s been a while');
fix('ZB600rRlPO8','7','Since I hit you back.');
fix('ZB600rRlPO8','8','Me and him, we had a chat.');
fix('ZB600rRlPO8','9',"And I think it's best I don't reply.");
fix('ZB600rRlPO8','10','Cause it has been a while.');
fix('ZB600rRlPO8','11',"But I can't let you go.");
fix('ZB600rRlPO8','12',"And I should've let you know.");
fix('ZB600rRlPO8','13',"But I'm typing it right now.");
fix('ZB600rRlPO8','14',"Got me wondering if it's destiny.");
fix('ZB600rRlPO8','15','Or am I just being messy?');
fix('ZB600rRlPO8','16',"All I know is I'm loving the rush.");
fix('ZB600rRlPO8','17','Then it hits me like reality.');
fix('ZB600rRlPO8','18','I can lose them to a fantasy.');
fix('ZB600rRlPO8','19',"It ain't heartbreak, but it still hurts enough. Oh baby.");

// zCHOdyX5HGo - Irish folk song
fix('zCHOdyX5HGo','0','When I was young, I spent some time crossing with my uncle Mike.');
fix('zCHOdyX5HGo','1','And I must have travelled a hundred miles on the crossbar of his bike.');
fix('zCHOdyX5HGo','2',"And as we'd rattle along the lane, Mike, he'd start to sing.");
fix('zCHOdyX5HGo','3','A song without a single word, as the cycle bell would ring, he\'d go:');
fix('zCHOdyX5HGo','5',"Sometimes when he'd be lonely then, he'd often say to me,");
fix('zCHOdyX5HGo','6',"Turn down the wireless and I'll tell you how things used to be.");
fix('zCHOdyX5HGo','7','We had no television then, CD or stereo.');
fix('zCHOdyX5HGo','8','And if you required some music, well, you had to make your own, like this:');

// ZEWGyyLiqY4 - country song
fix('ZEWGyyLiqY4','0','Country we pray for rain and thank him when it\'s falling, cuz it brings a grain');
fix('ZEWGyyLiqY4','1',"And a little bit of money, we put it back in the plate. I guess that's why they");
fix('ZEWGyyLiqY4','2',"Call it God's country.");
fix('ZEWGyyLiqY4','3','I saw the light in the sunrise, sitting back in the 40 on the muddy riverside,');
fix('ZEWGyyLiqY4','4','Getting baptized in holy water and shine, with the dogs running.');
fix('ZEWGyyLiqY4','5','Say bye to the sound of a pin found, Dixie whistled in the wind, that\'ll get you');
fix('ZEWGyyLiqY4','6',"Heaven-bound. The devil went down to Georgia, but he didn't stick around. This");
fix('ZEWGyyLiqY4','7',"Is God's country. We turn the dirt and work until the week's done. We take a");
fix('ZEWGyyLiqY4','8',"Break and break bread on Sunday, then do it all again, cuz we're proud to be from");
fix('ZEWGyyLiqY4','9',"God's country.");

// ZFoLxzVw1Js - Queen song
fix('ZFoLxzVw1Js','0',"Where's Tim? Who's packing? Ready, Freddie?");
fix('ZFoLxzVw1Js','1',"Let's do it.");
fix('ZFoLxzVw1Js','2','Keep yourself alive.');
fix('ZFoLxzVw1Js','3','I was told that many times, amongst troubles in my way. Might you grow a little wiser,');
fix('ZFoLxzVw1Js','4','A little better every day? But if I rode a million rivers, I\'d cross a million lines.');

// ZI_hOP_K6MY - Seinfeld (George as architect)
fix('ZI_hOP_K6MY','0',"If I see her, what do I say that I'm doing here in the building? You came to");
fix('ZI_hOP_K6MY','1',"See me. I work in the building. What do you do? I'm an architect. Oh, I'm an");
fix('ZI_hOP_K6MY','2','Architect. Any buildings in New York? Have you seen the new addition to the');
fix('ZI_hOP_K6MY','3','Guggenheim? You did that? Yep, yep. It didn\'t take very long either. What about');
fix('ZI_hOP_K6MY','4','Architect Steven? He\'s into architecture. Hey, just like you pretend to be. Let me');
fix('ZI_hOP_K6MY','5',"Be the architect. I can do it. Look, why couldn't you make me an architect? You");
fix('ZI_hOP_K6MY','6','Know, I always wanted to pretend that I was an architect. I\'m an architect.');
fix('ZI_hOP_K6MY','7','What do you design? Railroads? I thought engineers do that. They can. You, very');
fix('ZI_hOP_K6MY','8',"Knowledgeable. I'm... I'm also an architect. You're an architect? I'm not. I can't.");

// Zi_XLOBDo_Y - Billie Jean (MJ)
fix('Zi_XLOBDo_Y','0','She was more like a beauty queen from a movie scene.');
fix('Zi_XLOBDo_Y','1',"I said, don't mind, but what do you mean I am the one");
fix('Zi_XLOBDo_Y','2','Who will dance on the floor in the round?');
fix('Zi_XLOBDo_Y','3','She said, I am the one');
fix('Zi_XLOBDo_Y','4','Who will dance on the floor in the round.');
fix('Zi_XLOBDo_Y','5','She told me her name was Billie Jean.');
fix('Zi_XLOBDo_Y','6','She caused a scene, then her heavy hair turned into ice.');
fix('Zi_XLOBDo_Y','7','She dreamed of being the one');
fix('Zi_XLOBDo_Y','8','Who will dance on the floor in the round.');
fix('Zi_XLOBDo_Y','9','People always told me, be careful what you do.');
fix('Zi_XLOBDo_Y','10',"Don't go around breaking young girls' hearts.");
fix('Zi_XLOBDo_Y','11','And mother always told me, be careful who you love.');
fix('Zi_XLOBDo_Y','12','Be careful what you do, until the love becomes true.');
fix('Zi_XLOBDo_Y','13','Billie Jean is not my love.');

// zPcgt4Z9pos - 10 Things I Hate About You
fix('zPcgt4Z9pos','0','Last night. Do I know you? You see that girl? Yeah. That\'s Kat Stratford. I want you to');
fix('zPcgt4Z9pos','1','Go out with her. Yeah, sure, Sparky. Look, I can\'t take out her sister until Kat starts');
fix('zPcgt4Z9pos','2',"Dating. You see, their dad's whacked out. He's got this, this rule where the girls are...");
fix('zPcgt4Z9pos','3',"That's a touching story. It really is. Not my problem. Would you be willing to make it");
fix('zPcgt4Z9pos','4','Your problem if I provide generous compensation? You\'re going to pay me to take out some chick?');
fix('zPcgt4Z9pos','5','How much? 20 bucks. Fine, 30. Well, let\'s think about this. If we go to the movies,');
fix('zPcgt4Z9pos','6',"That's 15 bucks.");

// Zq-6d8Hgchw - Juno
fix('Zq-6d8Hgchw','0',"That I was searching for on the first take. No, I'm going to go to Women Now, just because they help out women. Now");
fix('Zq-6d8Hgchw','1',"It's not. It's actually... it's really complicated.");
fix('Zq-6d8Hgchw','2',"Okay. And I don't feel like talking about it in my fragile state.");
fix('Zq-6d8Hgchw','3','My mom uses color-safe bleach. Go, Carol!');
fix('Zq-6d8Hgchw','4','Because they were talking about in health class how pregnancy, it can often lead to an infant.');
fix('Zq-6d8Hgchw','5','Typically, yeah, yeah. All I see is pork swords. I think you definitely bring something to the table. Charisma. Who\'s');
fix('Zq-6d8Hgchw','6',"Ready for some Chromamagnificence? And I'm like, thanks a heap, Coyote Ugly. This cactus gram stings even worse than");
fix('Zq-6d8Hgchw','7','Your abandonment. I would never barf in your urn, Brenda. I am a Kraken from');
fix('Zq-6d8Hgchw','8','The sea.');
fix('Zq-6d8Hgchw','9','Hey, I\'m here for the big show. I was thinking more like graphic designer, mid-thirties, you');
fix('Zq-6d8Hgchw','10','Know, with a cool Asian girlfriend who dresses awesome and rocks out on the bass guitar. But I don\'t want to be too particular. Like,');
fix('Zq-6d8Hgchw','11',"It would be friggin\' sweet if no one hit me.");

// Zspzm01_Q20 - crime drama
fix('Zspzm01_Q20','0',"I ain't going to him. Okay, I'm not fucking Schwoz. I don't do fucking pickups. All right, listen to me.");
fix('Zspzm01_Q20','1',"I'm at some place that I fucking say, and you tell that fucking piece of shit, he comes correct.");
fix('Zspzm01_Q20','2',"He comes in all fucking loopy and fucked up. I swear to God, my man, that douchebag's teeth...");
fix('Zspzm01_Q20','3','I put the money on that fucking table.');
fix('Zspzm01_Q20','4','You know what, your fucking pill deal? I got five more just like you.');
fix('Zspzm01_Q20','5','Know what else? You dress like shit. So');
fix('Zspzm01_Q20','6','Fuck you.');
fix('Zspzm01_Q20','7','Put the fucking car in park, you fucking idiot!');

// ZsvR6XAl1os - country song
fix('ZsvR6XAl1os','0',"She's a hot little number in her pick-up truck, daddy's sweet money done jacked it up.");
fix('ZsvR6XAl1os','1',"She's a party all-nighter from South Carolina, a bad mamma-damma from down in Alabama.");
fix('ZsvR6XAl1os','2',"She's a ragin' Cajun lunatic from Brunswick, juicy Georgia peach with a thick southern drawl.");
fix('ZsvR6XAl1os','3',"Sexy swingin', won't, brother, she don't. Country, she's from her cowboy boots to her down-home roots.");
fix('ZsvR6XAl1os','4',"She's country, from the song she plays to the prayer she prays, that's the way she was born and raised.");
fix('ZsvR6XAl1os','5',"She ain't afraid to stay. Country, brother, she's country.");
fix('ZsvR6XAl1os','6','A hill raisin\' sugar when the sun goes down, mama taught her how to rip up the tale.');
fix('ZsvR6XAl1os','7','Honey drippin\' honey from the heart.');

// ZTf7DDb6KL0 - Sherlock Holmes
fix('ZTf7DDb6KL0','0',"Don't snivel, Mrs. Hudson. It'll do nothing to impede the flight of a bullet.");
fix('ZTf7DDb6KL0','1','What a tender world that would be.');
fix('ZTf7DDb6KL0','2',"I believe you have something that we want, Mr. Holmes. Why don't you ask for it?");
fix('ZTf7DDb6KL0','3',"I've been asking this one. She doesn't seem to know anything.");
fix('ZTf7DDb6KL0','4',"But you know what I'm asking for, don't you, Mr. Holmes?");
fix('ZTf7DDb6KL0','5','I believe I do.');
fix('ZTf7DDb6KL0','6',"First, get rid of your boys. Why? I dislike being outnumbered. It makes for too much stupid in the room.");
fix('ZTf7DDb6KL0','7','You two, go to the car.');

// ZTLAx3VDX7g - musical fragment (no fix needed, just a scat phrase)
// "Ba-da-ba-da-ba-da-ba-da" - already correct as a lyric fragment, no period needed for scat

// ZvXjl20nB6Q - song (Linkin Park)
fix('ZvXjl20nB6Q','0',"In this farewell, there's no blood, there's no alibi.");
fix('ZvXjl20nB6Q','1',"Cause I've drawn regret from the truth of a thousand lies.");
fix('ZvXjl20nB6Q','2','So let mercy come.');

// _35vuv4htIw - action movie
fix('_35vuv4htIw','0','Oh God.');
fix('_35vuv4htIw','1','Oh my God! Oh my God! Boy, am I glad to see you! Hey, you got my back? Yeah!');
fix('_35vuv4htIw','2','Lucky strap. Want me to carry it? No.');
fix('_35vuv4htIw','3','Need to find a gap here.');
fix('_35vuv4htIw','4','How did you know we were here? The phone. That stupid jingle from the store. I heard it. My phone? Yeah,');
fix('_35vuv4htIw','5','Your satellite phone. Where is it? I don\'t have it. When did you use it last?');
fix('_35vuv4htIw','6','Uh, on the plane. I got a call on the plane. And? What? What?');
fix('_35vuv4htIw','7','I loaned it to Nash. He must have had it when he...');
fix('_35vuv4htIw','8','Oh my God!');

// _hkoMopfRJU - rap lyrics (already have good punctuation throughout, mostly need periods)
fix('_hkoMopfRJU','0',"Throw me a 60 if I go to Magic or Honest, I'm just bein' honest.");
fix('_hkoMopfRJU','1',"I keep a stick or a blicky in case it get sticky, I'm just bein' honest.");
fix('_hkoMopfRJU','2',"She know that I'm with it, I'm havin' this chicken, it's trickin', I'm just bein' honest.");
fix('_hkoMopfRJU','3','Who really get it, be honest. Hey, posture be given, be honest.');
fix('_hkoMopfRJU','4',"She rare like a pet, I got rats in the back and these bitches be hooked like ponies.");
fix('_hkoMopfRJU','5',"I up in my rank cause I got niggas spank niggas, shh, duffer just on em.");
fix('_hkoMopfRJU','6',"I think these niggas forgot where I came from, cause I got matches to match it with late fronts.");
fix('_hkoMopfRJU','7',"I pull up Porsche, I think I'm J-Bone, bitch, I got truncheons, this shit look like crayon.");
fix('_hkoMopfRJU','8',"Turn into smoke, it's no buy gun, no buy gun, niggas be buyin', they buyin' like Tyson.");
fix('_hkoMopfRJU','9',"Niggas got sticks, got glocks, we ain't fightin', ain't start up a war, then they start up a riot.");
fix('_hkoMopfRJU','10',"Shoot at the club and then shoot at your partner, then shoot at your block and then shoot at your house.");
fix('_hkoMopfRJU','11',"Feelin' like Bobby, this my pariah, girl, if I catch a opp, cut his tongue out his mouth.");
fix('_hkoMopfRJU','12',"I go to the side of here, they sendin' jet in to me and they hear the words come out my mouth.");
fix('_hkoMopfRJU','13',"Gold on my thang, bitch, I'm from the south. Fuck around in downtown, they get you some clout.");
fix('_hkoMopfRJU','14','Let the bodies hit the floor.');

// _qu4ZBCU6Fc - Home Alone (Kevin's diary / bathroom routine)
fix('_qu4ZBCU6Fc','0',"Cause I'll be happy, Christmas, once again.");
fix('_qu4ZBCU6Fc','1','I took a shower washing every body part with actual soap,');
fix('_qu4ZBCU6Fc','2','Including all the major crevices, including in between my toes and in my belly button,');
fix('_qu4ZBCU6Fc','3','Which I never did before but sort of enjoyed.');
fix('_qu4ZBCU6Fc','4',"I washed my hair with the Don't Formula shampoo and used cream rinse for that just-washed shine.");
fix('_qu4ZBCU6Fc','5',"I can't seem to find my toothbrush, so I'll pick one up when I go out today.");
fix('_qu4ZBCU6Fc','6',"Other than that, I'm in good shape.");

// _R8GtrKtrZ4 - Insurance office drama (mid-sentence splits)
fix('_R8GtrKtrZ4','0','Denied. You\'re denying my');
fix('_R8GtrKtrZ4','1','Claim? I don\'t understand. I have full');
fix('_R8GtrKtrZ4','2',"Coverage. I'm sorry, Mrs. Hinson, but our");
fix('_R8GtrKtrZ4','3','Liability is spelled out in paragraph 17.');
fix('_R8GtrKtrZ4','4','States clearly... I pay for this! Excuse me.');
fix('_R8GtrKtrZ4','5','Claims B par... I\'m calling to celebrate a');
fix('_R8GtrKtrZ4','6','Momentous occasion. We are now officially');
fix('_R8GtrKtrZ4','7','Moved in! Yeah, well, that\'s great, honey.');
fix('_R8GtrKtrZ4','8',"And the last three years don't count.");
fix('_R8GtrKtrZ4','9','Because, because I finally unpacked the');
fix('_R8GtrKtrZ4','10',"Last box. Now it's official! Ha! Why do we");
fix('_R8GtrKtrZ4','11','Have so much junk? Listen, honey, I\'ve got');
fix('_R8GtrKtrZ4','12',"It. Quiet. Say no more. Go save the world, one policy at a time, honey. Oh, I've got to");
fix('_R8GtrKtrZ4','13','Go pick up the kitchen... sch... see you');
fix('_R8GtrKtrZ4','14','Tonight. Bye, honey. Excuse me, where were');
fix('_R8GtrKtrZ4','15',"We? I'm on a fixed income, and if you");
fix('_R8GtrKtrZ4','16',"Can't help me, I don't know what I'll");
fix('_R8GtrKtrZ4','17','Do. All right, listen closely. I\'d like to');
fix('_R8GtrKtrZ4','18',"Help you, but I can't. I'd like to tell");
fix('_R8GtrKtrZ4','19','You to take a copy of your policy to');
fix('_R8GtrKtrZ4','20','Norma Wilcox. Norma Wilcox, W-I-L-C-O-X, on');
fix('_R8GtrKtrZ4','21','The third floor. But I can\'t. I also do');
fix('_R8GtrKtrZ4','22','Not advise you to fill out and file a WS');
fix('_R8GtrKtrZ4','23',"2475 form with our legal department on the second floor. I would not expect");
fix('_R8GtrKtrZ4','24','Someone to get back to you quickly to');
fix('_R8GtrKtrZ4','25',"Resolve the matter. I'd like to help, but");
fix('_R8GtrKtrZ4','26',"There's nothing I can do. Oh, thank you.");
fix('_R8GtrKtrZ4','27',"Man... I'm sorry, ma'am. I know you're upset. Pretend to be");
fix('_R8GtrKtrZ4','29','You authorize payment on the Walker');
fix('_R8GtrKtrZ4','30',"Policy? Someone broke into their house. Mr. Huff, their policy clearly covers... I don't");
fix('_R8GtrKtrZ4','31',"Want to know about their coverage, Bob. Don't tell me about their coverage. Tell");
fix('_R8GtrKtrZ4','32',"Me how you're keeping insur-care in the black. Tell me how that's possible with");
fix('_R8GtrKtrZ4','33','You writing checks to every Harry Hardlock and Sally Story that gives you a phone');
fix('_R8GtrKtrZ4','34','Call.');

// _RchONkTtQ0 - same insurance scene
fix('_RchONkTtQ0','0',"I'm calling to celebrate a momentous occasion. We are now officially moved in.");
fix('_RchONkTtQ0','1',"Yeah, well, that's great, honey. And the last three years don't count because");
fix('_RchONkTtQ0','2',"Because I finally unpacked the last box. Now it's official.");
fix('_RchONkTtQ0','5',"School. See you tonight. Bye, honey. Excuse me, where were we? I'm on a fixed income, and if you can't help me, I don't know what I'll do.");
fix('_RchONkTtQ0','6',"All right, listen closely. I'd like to help you, but I can't. I'd like to tell");
fix('_RchONkTtQ0','7','You to take a copy of your policy to Norma Wilcox. Norma Wilcox, W-I-L-C-O-X,');
fix('_RchONkTtQ0','8','On the third floor. But I can\'t. I also do not advise you to fill out and file a');
fix('_RchONkTtQ0','9','WS 2475 form with our legal department on the second floor. I would not.');

// UF8uR6Z6KLc - Steve Jobs Stanford commencement (mid-sentence splits)
fix('UF8uR6Z6KLc','0','This program is brought to you by');
fix('UF8uR6Z6KLc','1','Stanford University. Please visit us at stanford.edu.');
fix('UF8uR6Z6KLc','3',"You. I'm, uh, honored to be with you today");
fix('UF8uR6Z6KLc','4','For your commencement from one of the finest universities in the');
fix('UF8uR6Z6KLc','5','World. Truth be');
fix('UF8uR6Z6KLc','6','Told, uh, I never graduated from');
fix('UF8uR6Z6KLc','7','College, and, uh, this is the closest I\'ve');
fix('UF8uR6Z6KLc','8','Ever gotten to a college graduation. Today I want to tell you');
fix('UF8uR6Z6KLc','9','Three stories from my life. That\'s it. No');
fix('UF8uR6Z6KLc','10','Big deal. Just three.');
fix('UF8uR6Z6KLc','11','Stories. The first story is about');
fix('UF8uR6Z6KLc','12','Connecting the dots.');
fix('UF8uR6Z6KLc','13','I dropped out of Reed College after the');
fix('UF8uR6Z6KLc','14','First six months, but then stayed around as a drop-in for another 18 months or so');
fix('UF8uR6Z6KLc','15','Before I really');
fix('UF8uR6Z6KLc','16','Quit. So why\'d I drop');
fix('UF8uR6Z6KLc','17','Out? It started before I was');
fix('UF8uR6Z6KLc','18','Born. My biological mother was a young,');
fix('UF8uR6Z6KLc','19','Unwed graduate student, and she decided');
fix('UF8uR6Z6KLc','20','To put me up for');
fix('UF8uR6Z6KLc','21','Adoption. She felt very strongly that I');
fix('UF8uR6Z6KLc','22','Should be adopted by college graduates.');
fix('UF8uR6Z6KLc','23','So everything was all set for me to be');
fix('UF8uR6Z6KLc','24','Adopted at birth by a lawyer and his');
fix('UF8uR6Z6KLc','25',"Wife, except that when I popped out, they decided at the last minute that they");
fix('UF8uR6Z6KLc','26',"Really wanted a girl. So my parents, who were on a waiting");
fix('UF8uR6Z6KLc','27','List, got a call in the middle of the');
fix('UF8uR6Z6KLc','28',"Night asking, we've got an unexpected");
fix('UF8uR6Z6KLc','29','Baby boy, do you want him? They said of');
fix('UF8uR6Z6KLc','30','Course. My biological mother found out');
fix('UF8uR6Z6KLc','31','Later that my mother had never graduated');
fix('UF8uR6Z6KLc','32','From college, and that my father had');
fix('UF8uR6Z6KLc','33','Never graduated from high school. She');
fix('UF8uR6Z6KLc','34','Refused to sign the final adoption');
fix('UF8uR6Z6KLc','35','Papers. She only relented a few months');
fix('UF8uR6Z6KLc','36','Later, when my parents promised that I');
fix('UF8uR6Z6KLc','37','Would go to college. This was the start');
fix('UF8uR6Z6KLc','38','In my');
fix('UF8uR6Z6KLc','39','Life. And 17 years later I did go to');
fix('UF8uR6Z6KLc','40','College. But I naively chose a college');
fix('UF8uR6Z6KLc','41','That was almost as expensive as');
fix('UF8uR6Z6KLc','42','Stanford, and all of my working-class');
fix('UF8uR6Z6KLc','43','Parents\' savings were being spent on my');
fix('UF8uR6Z6KLc','44','College tuition. After six months, I');
fix('UF8uR6Z6KLc','45','Couldn\'t see the value in it. I had no idea what I wanted to do with');
fix('UF8uR6Z6KLc','46','My life, and no idea how college was');
fix('UF8uR6Z6KLc','47','Going to help me figure it out. And here');
fix('UF8uR6Z6KLc','48','I was, spending all the money my parents');
fix('UF8uR6Z6KLc','49','Had saved their entire');
fix('UF8uR6Z6KLc','50','Life. So I decided to drop out and trust');
fix('UF8uR6Z6KLc','51','That it would all work out okay. It was');
fix('UF8uR6Z6KLc','52','Pretty scary at the time, but looking back, it was one of the best decisions I');
fix('UF8uR6Z6KLc','53','Ever made.');
fix('UF8uR6Z6KLc','54','The minute I dropped out, I could');
fix('UF8uR6Z6KLc','55','Stop taking the required classes that');
fix('UF8uR6Z6KLc','56',"Didn't interest me and begin dropping in");
fix('UF8uR6Z6KLc','57','On the ones that looked far more');
fix('UF8uR6Z6KLc','58',"Interesting. It wasn't all romantic. I");
fix('UF8uR6Z6KLc','59',"Didn't have a dorm room, so I slept on");
fix('UF8uR6Z6KLc','60','The floor in friends\' rooms. I returned');
fix('UF8uR6Z6KLc','61','Coke bottles for the 5-cent deposits to');
fix('UF8uR6Z6KLc','62','Buy food with, and I would walk the seven');
fix('UF8uR6Z6KLc','63','Miles across town every Sunday night to');
fix('UF8uR6Z6KLc','64','Get one good meal a week at the Hare');
fix('UF8uR6Z6KLc','65','Krishna Temple. I loved it, and much of');
fix('UF8uR6Z6KLc','66','What I stumbled into by following my');
fix('UF8uR6Z6KLc','67','Curiosity and intuition turned out to be');
fix('UF8uR6Z6KLc','68','Priceless later on. Let me give you one');
fix('UF8uR6Z6KLc','69','Example. Reed College at that time');
fix('UF8uR6Z6KLc','70','Offered perhaps the best calligraphy');
fix('UF8uR6Z6KLc','71','Instruction in the country. Throughout');
fix('UF8uR6Z6KLc','72','The campus, every poster, every label on');
fix('UF8uR6Z6KLc','73','Every drawer was beautifully hand-lettered.');
fix('UF8uR6Z6KLc','74','Because I had dropped out and');
fix('UF8uR6Z6KLc','75',"Didn't have to take the normal classes, I");
fix('UF8uR6Z6KLc','76','Decided to take a calligraphy class to');
fix('UF8uR6Z6KLc','77','Learn how to do this. I learned about');
fix('UF8uR6Z6KLc','78','Serif and sans-serif typefaces, about');
fix('UF8uR6Z6KLc','79','Varying the amount of space between different letter combinations, about what');
fix('UF8uR6Z6KLc','80','Makes great typography.');
fix('UF8uR6Z6KLc','81','Great. It was beautiful, historical,');
fix('UF8uR6Z6KLc','82','Artistically subtle in a way that');
fix('UF8uR6Z6KLc','83','Science can\'t capture, and I found it');

// 221F55VPp2M - Friends (Joey/Chandler shopping scene)
fix('221F55VPp2M','0','You know what we should all do?');
fix('221F55VPp2M','1','Sure, and you know which one we should');
fix('221F55VPp2M','3','The 1996 Tony Award winner?');
fix('221F55VPp2M','4','Do you happen to know the name of that');
fix('221F55VPp2M','5',"One? I don't know. Um,");
fix('221F55VPp2M','6','Greece? No.');
fix('221F55VPp2M','7','Rent? Yes, Rent!');
fix('221F55VPp2M','8','Okay, so when do you want to go? What? Oh,');
fix('221F55VPp2M','9',"I'm sorry, I can't. I'm busy.");
fix('221F55VPp2M','10','Hey, man, it is so hard to shop for girls.');
fix('221F55VPp2M','11','Oh yes it is. At Office Max?');
fix('221F55VPp2M','12','What did you get here?');
fix('221F55VPp2M','13',"A pen. It's two gifts in one. It's a pen");
fix('221F55VPp2M','14',"That's also a clock. Huh?");
fix('221F55VPp2M','15',"You can't give her that. Why not? Because");
fix('221F55VPp2M','16',"She's not 11.");
fix('221F55VPp2M','17',"And it's not the seventh night of Hanukkah.");
fix('221F55VPp2M','18',"Okay, honey, what he means by that is, while this is a very nice gift,");
fix('221F55VPp2M','19','Maybe it\'s just not something a');
fix('221F55VPp2M','20','Boyfriend gives. Sure it');
fix('221F55VPp2M','21',"Is. She needs a pen for work. She's");
fix('221F55VPp2M','22',"Writing. She turns it over. Whoa, it's time for my date with Joey!");
fix('221F55VPp2M','23',"All right, look, look. What? What did you get for Angelo del Vecchio for her");
fix('221F55VPp2M','24',"Birthday? She didn't have a birthday while we were going out for three years.");
fix('221F55VPp2M','25',"Look, it's too late and I've got an audition.");
fix('221F55VPp2M','26',"I can't shop anymore.");
fix('221F55VPp2M','27','I will go out and I will try to find');
fix('221F55VPp2M','28','Something for her. Okay?');
fix('221F55VPp2M','29','Thanks, man. And oh, while you\'re at it,');
fix('221F55VPp2M','30','Could you get her a card? Would you like me to write her a little');
fix('221F55VPp2M','31','Poem as well?');
fix('221F55VPp2M','32','Or just get a card that has a poem');
fix('221F55VPp2M','33','Already in it.');

// _kS7F4VpJa0 - Spanish/English song (preserve Spanish as-is, fix English parts)
fix('_kS7F4VpJa0','0','Think I gotta find that again.');
fix('_kS7F4VpJa0','1',"But I understand, I said I've been");
fix('_kS7F4VpJa0','2',"Can't forget about that place we went.");
fix('_kS7F4VpJa0','3','Right, if you put that in my head.');
fix('_kS7F4VpJa0','4','Do you still pop off, do you dance?');
fix('_kS7F4VpJa0','5',"Do you still drop some? No, you can't.");
fix('_kS7F4VpJa0','6','I got a lot, but I still chance.');
fix('_kS7F4VpJa0','7','Yeah, yeah, yeah, yeah.');

// YVLHaqeJzEk - R&B song
fix('YVLHaqeJzEk','0',"I ain't holla, but I ain't gon' switch it, baby.");
fix('YVLHaqeJzEk','1',"I'ma let you catch up with your game.");
fix('YVLHaqeJzEk','2',"Run faster, don't let him lose you.");
fix('YVLHaqeJzEk','3',"Cause I ain't gon' bless you");
fix('YVLHaqeJzEk','4','Unless you feel a little desperate.');
fix('YVLHaqeJzEk','5','Send a text message, girl.');
fix('YVLHaqeJzEk','6','Stop, wait a minute.');
fix('YVLHaqeJzEk','7','The way you move that girl,');
fix('YVLHaqeJzEk','8','You done got my heart all in it.');
fix('YVLHaqeJzEk','9','And I just wanna be with you tonight. Girl, please.');
fix('YVLHaqeJzEk','10',"I'ma play it, yeah, it's true.");
fix('YVLHaqeJzEk','11','But I changed the game for you.');
fix('YVLHaqeJzEk','12','I wanna see what it do.');
fix('YVLHaqeJzEk','13','Can I be free?');
fix('YVLHaqeJzEk','14','This is how I feel.');
fix('YVLHaqeJzEk','15',"I'm in need of love.");
fix('YVLHaqeJzEk','16',"So let's dip a bite of you.");
fix('YVLHaqeJzEk','17',"Ooh, you're just my type.");
fix('YVLHaqeJzEk','18',"Everything's so right.");
fix('YVLHaqeJzEk','19','And I just wanna chill.');
fix('YVLHaqeJzEk','20',"So let's dip a bite of you.");
fix('YVLHaqeJzEk','21',"Let's dip a bite of you.");
fix('YVLHaqeJzEk','22','Ah, ah, ah, ah, ah, ah, ah.');
fix('YVLHaqeJzEk','23',"She's fine too.");
fix('YVLHaqeJzEk','24','But I want you.');

// 7K3KdgDcdYc - documentary (already well punctuated, check for issues)
// Most segments already have correct punctuation.
// seg 23: "causing the ice to melt." - correct as-is (already has period)
// All look correct already for 7K3KdgDcdYc

// Remove the bad key fix from Xk6RLMp5WMk (typo)
delete output['Xk6RLMp5WMk'];
// Fix segment 9 properly for Xk6RLMp5WMw
fix('Xk6RLMp5WMw','9',"A week ago, and he's been calling at all hours.");

// Save output
const outputDir = 'C:/Users/hyunj/studyeng/src/data/subtitle-fixes';
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputDir + '/fix-6.json', JSON.stringify(output, null, 2), 'utf8');
console.log('Done. Videos with changes:', Object.keys(output).length);
for (const [vid, segs] of Object.entries(output)) {
  console.log(vid + ': ' + Object.keys(segs).length + ' changes');
}
NODESCRIPT

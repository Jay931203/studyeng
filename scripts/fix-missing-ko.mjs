#!/usr/bin/env node
/**
 * Fix missing Korean translations for non-reseg files with >50% missing ko.
 * Rules: casual -> 반말, formal -> 존댓말, effects/music -> ko=""
 * NO API calls - all translations hardcoded.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const TRANSCRIPTS_DIR = join(process.cwd(), 'public', 'transcripts');

// ─── Translation map ────────────────────────────────────────────────────
// Key: exact en text (trimmed), Value: ko translation

const translations = {
  // === 19y3QLqjPzY.json (Finding Nemo) ===
  "Oh! Oh! Oh!": "오! 오! 오!",
  "Oh! Oh!": "오! 오!",

  // === 40WusvEYAYE.json (Eminem rap) ===
  "you": "",
  "Summer lma do my lma you assuming I'm a human what I gotta do to get it through to you": "여름이야 내 거라고 넌 내가 인간이라고 생각하는 거야 어떻게 해야 네가 알아듣겠어",
  "I'm superhuman innovative and I made it rubble so that anything you say is because shang it off on me": "나는 초인적이고 혁신적이야 다 부숴버렸으니까 네가 뭘 말하든 나한테 튕겨나가",
  "And it'll never stay more than never demonstrating how to give a motherfucking audience a feeling like it's levitating never fading": "절대 안 사라져 관객들한테 공중에 뜬 느낌을 주는 법을 보여주는 거지 절대 안 꺼져",
  "And I know the haters are forever waiting for the day that they can say I fell off to be celebrating cuz I know the way": "그리고 알아 헤이터들이 영원히 내가 망했다고 축하할 날만 기다리고 있다는 거 왜냐면 난 길을 알거든",

  // === A35gds8NBws.json (hesitation markers) ===
  "%HESITATION": "",

  // === bMquuQRFxgo.json ===
  "🎵": "",

  // === bUxJaDfnATU.json (Chomsky documentary - formal) ===
  "and economics. Has it ever occurred to you it could be a system of propaganda designed": "그리고 경제학이요. 그것이 세상을 상상하는 방식을 제한하기 위해 설계된 선전 시스템일 수 있다는 생각을 해보신 적 있나요?",
  "to limit how you imagine the world? Well, that's the view of Noam Chomsky, who's been": "그게 바로 노엄 촘스키의 관점입니다. 그는 지난 30년간",
  "teaching here in Boston for the past 30 years. Described as America's leading dissident,": "보스턴에서 가르쳐왔습니다. 미국의 대표적인 반체제 인사로 불리는데",
  "it isn't exactly the Gulag archipelago. As a working journalist myself,": "굴라그 군도 같은 건 아니죠. 저도 현직 언론인으로서",

  // === BvNSnnxUvv4.json (countdown) ===
  "Five.": "다섯.",
  "Two.": "둘.",
  "One.": "하나.",

  // === CNZE3O0UgtQ.json (Downton Abbey - formal/존댓말) ===
  "Ah, Ethel.": "아, 에셀.",
  "Why would I persuade your father otherwise when I agree with him?": "아버지와 같은 생각인데 왜 제가 달리 설득하겠어요?",
  "How can you say that when you keep telling me to find something to do?": "뭔가 할 일을 찾으라고 계속 말씀하시면서 어떻게 그런 말씀을 하세요?",
  "I meant run a local charity or paint watercolors or something.": "지역 자선단체를 운영하거나 수채화를 그리거나 그런 걸 말한 거예요.",
  "Well, I'm going to London to see the editor tomorrow.": "글쎄요, 내일 런던에 가서 편집장을 만날 거예요.",
  "And if I like him, then I'm going to say yes.": "그리고 마음에 들면 승낙할 거예요.",
  "I don't want to fall out with Papa, but I don't want to be invisible either.": "아빠와 사이가 나빠지고 싶지 않지만 투명인간이 되고 싶지도 않아요.",
  "I've had enough of it. Very well.": "이제 충분해요. 좋아요.",
  "I'm coming up tonight. I'll see what I can do.": "오늘 밤에 올라갈게요. 제가 뭘 할 수 있는지 볼게요.",
  "But I want a favor in return. Mm.": "하지만 대가로 부탁 하나 할게요. 음.",
  "Ethel, what's the matter? I had rather a nasty encounter in the village, that's all.": "에셀, 무슨 일이에요? 마을에서 좀 불쾌한 일이 있었어요, 그게 다예요.",
  "What sort of encounter? Mrs. Bakewell refused to serve me.": "어떤 일이었어요? 베이크웰 부인이 저한테 물건을 안 팔겠다고 했어요.",
  "In the end, her husband did, but it wasn't very nice.": "결국 남편분이 해주셨는데, 기분 좋지는 않았어요.",
  "We shall take our business elsewhere. There's no need for that, ma'am.": "다른 데서 사겠습니다. 그러실 필요 없어요, 마님.",
  "I'm used to it. You shouldn't have to be.": "저는 익숙해요. 익숙해지시면 안 돼요.",
  "I don't understand. You've placed an advertisement in a magazine": "이해가 안 돼요. 잡지에 광고를 내셨다니",
  "to find a job for my housekeeper. I knew you'd be against it.": "제 가정부의 일자리를 찾으시려고요. 반대하실 줄 알았어요.",
  "Well, how would you feel if I found other work for your cook or butler?": "글쎄요, 제가 당신의 요리사나 집사에게 다른 일을 구해주면 어떻겠어요?",
  "Granny feels that for Ethel's sake, she should move elsewhere.": "할머니는 에셀을 위해서 다른 곳으로 옮겨야 한다고 생각하세요.",
  "Oh, nonsense. She couldn't give tuppence about Ethel or anyone like her.": "말도 안 돼요. 에셀이나 그런 사람들한테 관심도 없으실 텐데.",
  "You've been reading those communist newspapers again.": "또 그 공산주의 신문 읽으신 거죠.",
  "Mrs. Hughes, you've always taken an interest in Ethel. Do you think I'm wrong?": "휴즈 부인, 항상 에셀에게 관심을 가져주셨죠. 제가 틀렸다고 생각하세요?",
  "No. While Ethel is in this village, she is doomed to be lonely.": "아니요. 에셀이 이 마을에 있는 한, 외로울 수밖에 없어요.",
  "But if, as her leadership suggests, she can get a job far away from here?": "하지만 부인께서 제안하시듯이 여기서 멀리 떨어진 곳에서 일자리를 구할 수 있다면요?",
  "She's not a bad cook now, and with a respectable reference, which, of course, you can give her.": "지금은 나쁘지 않은 요리사예요, 그리고 훌륭한 추천서가 있으면요, 물론 당신이 써주실 수 있죠.",
  "I can't get over how you've planned all this without a word to me.": "저한테 한마디 상의도 없이 이 모든 걸 계획하셨다니 믿을 수가 없어요.",
  "Well, I knew you wouldn't agree. I know how you hate facing facts.": "글쎄요, 동의하지 않으실 줄 알았어요. 현실을 직시하는 걸 싫어하시잖아요.",
  "I resent that. I'm sorry, but I do.": "그건 억울해요. 미안하지만 그래요.",
  "Mrs. Crawley, I hope you don't see me as an intolerant person.": "크롤리 부인, 저를 편협한 사람으로 보지 않으시길 바랍니다.",
  "No, because I agree with her ladyship.": "아니요, 저도 부인의 의견에 동의하거든요.",
  "In a new place where she can start again, Ethel has far more chance of happiness": "다시 시작할 수 있는 새로운 곳에서 에셀이 행복할 가능성이 훨씬 높아요",
  "than in re-enacting her own version of the Scarlet Letter in Downton.": "다운튼에서 자기만의 주홍글씨를 재현하는 것보다요.",
  "What is the Scarlet Letter? A novel by Nathaniel Hawthorne.": "주홍글씨가 뭐예요? 너새니얼 호손의 소설이에요.",
  "That sounds most unsuitable.": "아주 부적절하게 들리네요.",
  "I'll talk to Ethel.": "에셀과 이야기해볼게요.",
  "I beg pardon, ma'am. I was miles away. That's all right.": "실례합니다, 마님. 멍하니 있었어요. 괜찮아요.",
  "I just wanted to let you know that I was back. Would you like some tea?": "돌아왔다고 알려드리려고요. 차 드실래요?",
  "No, thank you. I'm going straight to bed.": "아니요, 괜찮아요. 바로 잠자리에 들 거예요.",
  "Ethel, are you happy?": "에셀, 행복하세요?",
  "Well, I suppose I'm happy compared to what I was before.": "글쎄요, 전에 비하면 행복한 것 같아요.",
  "You see, I never mind.": "있잖아요, 저는 상관없어요.",
  "How is Lady Fletcher? Incredibly busy.": "플레처 부인은 어떠세요? 믿을 수 없이 바쁘세요.",
  "Daddy works harder than a slave, and so she has to manage everything else by herself.": "아빠가 노예보다 더 열심히 일하셔서, 다른 모든 걸 혼자 관리하셔야 해요.",
  "I doubt he works harder than a slave.": "노예보다 더 열심히 일하시는 건 아닐 텐데요.",
  "Cousin Isabel is very literal. Now, I have something for you.": "이자벨 사촌은 너무 직설적이에요. 자, 드릴 게 있어요.",
  "Shall I pour, ma'am? No, thank you. I'll do it.": "제가 따를까요, 마님? 아니요, 괜찮아요. 제가 할게요.",
  "These are the first answers to the advertisement.": "이것들이 광고에 대한 첫 번째 답변들이에요.",
  "Cousin Violet is trying to find a new job for my cook.": "바이올렛 사촌이 제 요리사에게 새 일자리를 찾아주려고 해요.",
  "That sounds rather inconvenient.": "좀 불편하게 들리네요.",
  "Cousin Violet has never let a matter of convenience stand in the way of a principle.": "바이올렛 사촌은 편의 문제가 원칙을 방해하게 둔 적이 없어요.",
  "Has the kettle sinned to the pot? Oh.": "냄비가 솥을 나무라는 격인가요? 오.",
  "Lady Grantham, the Dowager, that is, has been concerned that your history here has left you lonely.": "그랜섬 부인, 그러니까 대부인께서 여기서의 과거가 당신을 외롭게 만들었을까 걱정하세요.",
  "She's kind to concern herself. It's not just that.": "걱정해주시다니 친절하시네요. 그것만이 아니에요.",
  "She believes that you've made this house a local topic of unwelcome conversation.": "이 집이 마을에서 달갑지 않은 화제거리가 되었다고 생각하세요.",
  "Ah. So she's placed an advertisement for you,": "아. 그래서 당신을 위해 광고를 내셨고,",
  "and she's got some replies.": "답변이 몇 개 왔어요.",
  "The point is, you would go to your new position with references from me and from Mrs. Hughes,": "중요한 건, 저와 휴즈 부인의 추천서를 가지고 새 자리로 가시게 되는 거예요,",
  "and you would not have to refer to your earlier life.": "그리고 이전의 삶을 언급할 필요가 없어요.",
  "In effect, you'd be washed clean.": "사실상 깨끗이 새 출발하는 거죠.",
  "I've been through those replies to a ladyship's advertisement, and I don't think there's one where": "부인의 광고에 대한 답변들을 살펴봤는데, 여기보다 더 행복할 곳은",
  "I should be happier than here. That's very flattering.": "없을 것 같아요. 과분한 말씀이에요.",
  "There was a nice letter from a Mrs. Watson, but it was near Cheadle.": "왓슨 부인이라는 분한테서 좋은 편지가 왔는데, 치들 근처였어요.",
  "Cheadle's very close to where Mr. and Mrs. Bryant live. Oh, I see.": "치들은 브라이언트 부부가 사시는 곳에서 아주 가까워요. 아, 그렇군요.",
  "And you feel that would defeat the purpose if the goal is to leave your past behind you?": "과거를 뒤로하는 게 목적이라면 의미가 없다고 느끼시는 거죠?",
  "Don't you, ma'am? Yes, I'm afraid I do.": "그렇지 않으세요, 마님? 네, 유감이지만 그래요.",
  "It's a pity if it was the only one that was appealing.": "그게 유일하게 마음에 드는 곳이었다면 안타깝네요.",
  "So it looks as if I'll be staying on.": "그러면 저는 계속 여기 있게 될 것 같아요.",
  "I'm sorry if it makes trouble between you and the dowager.": "부인과 대부인 사이에 문제가 되면 죄송해요.",
  "Oh, don't worry about that. If you'd gone, she'd have found some other bone for us to fight over.": "걱정 마세요. 당신이 갔어도 우리가 싸울 다른 이유를 찾으셨을 거예요.",
  "Tell me, has there been any progress with Ethel? No.": "에셀 건은 진전이 있었나요? 아니요.",
  "I'm sorry to disappoint you, but she doesn't want to go. Not while you're here.": "실망시켜 드려 죄송하지만, 가고 싶어하지 않아요. 당신이 여기 계시는 한요.",
  "One of them was right? One? A Mrs. Watson.": "그중 하나가 괜찮았다고요? 하나요? 왓슨 부인이라는 분이요.",
  "But the house was near where the Bryants live. And to be honest, I suspect that was the reason.": "하지만 그 집이 브라이언트 부부 근처였어요. 솔직히 그게 이유였을 거라고 짐작해요.",
  "A chance to see little Charlie from time to time.": "어린 찰리를 가끔 볼 수 있는 기회요.",
  "Well, I can't blame her for that. Of course not.": "그건 탓할 수 없죠. 물론이에요.",
  "But the Bryants would be bound to find out, which would only lead to more heartbreak.": "하지만 브라이언트 부부가 알게 될 테고, 그러면 더 큰 상처만 될 거예요.",
  "Will that be all, ma'am? There is one thing.": "그게 다인가요, 마님? 한 가지 더 있어요.",
  "There was a letter delivered by hand this afternoon.": "오늘 오후에 직접 전달된 편지가 있었어요.",
  "It's from the dowager. She wants us to call on her in the morning.": "대부인한테서 온 거예요. 아침에 방문해달라고 하세요.",
  "But why would she want me? No doubt we'll find out in the morning.": "근데 왜 저를요? 아침이면 알게 되겠죠.",
  "Oh, you didn't expect to find me here.": "오, 저를 여기서 만날 줄 몰랐죠.",
  "No. I thought the only person who could tell us": "네. 브라이언트 부부가 에셀이 근처에서 일하는 것에",
  "with any accuracy the Bryants' response to Ethel's working": "어떻게 반응할지 정확히 말해줄 수 있는 건",
  "nearby were the Bryants themselves.": "브라이언트 부부 본인뿐이라고 생각했어요.",
  "Lady Grantham wrote to me explaining your wish.": "그랜섬 부인이 편지로 당신의 바람을 설명해주셨어요.",
  "Well, it was only that Mrs. Watson had answered the advertisement.": "글쎄요, 왓슨 부인이 광고에 답변했을 뿐이에요.",
  "I know the circumstances, just as I know that you would like to see how Charlie's getting on.": "저도 사정을 알아요, 당신이 찰리가 어떻게 지내는지 보고 싶어하신다는 것도요.",
  "As it happens, I've been uncomfortable about keeping a mother from her son.": "사실 저도 어머니를 아들에게서 떼어놓는 게 불편했어요.",
  "And although I would not want to confuse him until he's much older, if then.": "그리고 훨씬 나이가 들기 전까지는 혼란스럽게 하고 싶지 않지만요.",
  "You wouldn't have to confuse him. I've already worked it out.": "혼란스럽게 할 필요 없어요. 이미 방법을 생각해뒀어요.",
  "I'm his old nanny who was employed by you when he was first born.": "저는 찰리가 태어났을 때 고용됐던 옛날 유모예요.",
  "But what about when he talks about you to Mr. Bryant?": "하지만 찰리가 브라이언트 씨한테 당신 얘기를 하면요?",
  "You will please leave Mr. Bryant to me.": "브라이언트 씨는 제게 맡겨주세요.",
  "Now, Ethel, you must write to Mrs. Watson today and get it settled.": "자, 에셀, 오늘 왓슨 부인에게 편지를 쓰고 정리하세요.",
  "And I'll be able to see Charlie. It won't be easy.": "그러면 찰리를 볼 수 있겠네요. 쉽지 않을 거예요.",
  "It'll be easier than not seeing him.": "안 보는 것보다는 쉬울 거예요.",
  "Very much easier.": "훨씬 쉬울 거예요.",
  "I'm glad everything's settled with Ethel. But I trust you can find another cook without too much difficulty.": "에셀 문제가 해결되어 다행이에요. 하지만 다른 요리사를 큰 어려움 없이 구하실 수 있겠죠.",
  "Preferably one with a blameless record,": "가능하면 흠잡을 데 없는 경력의 사람으로요,",
  "so my house ceases to be a topic of gossip, which is really what this is all about.": "그래서 제 집이 더 이상 험담거리가 되지 않도록요, 사실 이게 핵심이잖아요.",
  "If Ethel wants to be part of her son's life, even a little part, who are we to stand in her way?": "에셀이 아들의 삶에 함께하고 싶다면, 아주 작은 부분이라도, 우리가 뭐라고 막겠어요?",
  "Of course, if you had had to sell Charlie to the butcher to be chopped up as stew to achieve the same ends,": "물론 같은 목적을 달성하기 위해 찰리를 정육점에 팔아 스튜로 만들어야 했다면,",
  "you would have done so. But happily, it was not needed.": "그렇게 하셨겠죠. 하지만 다행히도 그럴 필요는 없었어요.",

  // === cysGnqhnLFM.json (casual) ===
  "to dress up like sluts, you know? Yeah. Okay everyone, I think we can begin. I've got everyone's": "야하게 차려입는 거 말이야, 알지? 그래. 좋아 여러분, 시작할 수 있을 것 같아요. 모두의",
  "personalized cookie tombstones, por tradicion, and in a few minutes we're going to start": "맞춤형 쿠키 묘비를 준비했어요, 전통에 따라, 그리고 몇 분 뒤에 시작할 거예요",
  "the dance of the dead. La danza de los muertos. You don't have to keep doing that. Party on.": "죽은 자의 춤을. 라 단자 데 로스 무에르토스. 그거 계속 안 해도 돼. 파티 계속해.",

  // === DhFLdbrPfEU.json (TV show, casual/informal) ===
  "It's building up now. It's only going to increase as the rounds go on.": "점점 고조되고 있어요. 라운드가 진행될수록 더 커질 거예요.",
  "It's time for a break now. But, Emi, how do you know it's time for a break?": "이제 쉬는 시간이에요. 근데 에미, 쉬는 시간인 줄 어떻게 알았어?",
  "Because you literally just told me.": "방금 말해줬잖아요.",
  "She said literally weirdly, but it is time for a break. See you in five.": "리터럴리를 좀 이상하게 말했는데, 어쨌든 쉬는 시간이에요. 5분 뒤에 봐요.",
  "APPLAUSE Literally. Can I get a little... Can I get a small duff thing?": "박수 리터럴리. 좀 작은... 작은 음악 좀 틀어줄 수 있어요?",
  "It's just a short break. A little dusty?": "잠깐 쉬는 시간이에요. 좀 먼지나는?",
  "Um... All right, hang on one sec. It's upbeat, right? Yeah.": "음... 좋아요, 잠깐만요. 경쾌한 거죠? 네.",
  "If you want to play along at home, then good news.": "집에서 같이 참여하고 싶으시면 좋은 소식이에요.",
  "If you want to win, all you have to do is text 07700 900 999": "이기고 싶으시면 07700 900 999로 문자 보내시면 돼요",
  "and tell us, where did our question setter, Emi, say she's from?": "그리고 알려주세요, 출제자 에미가 어디 출신이라고 했죠?",
  "Text will be charged at £1. Good luck.": "문자 요금은 1파운드입니다. 행운을 빌어요.",
  "Yeah, got it, thank you. OK, stand by, everyone.": "네, 알겠어요, 감사합니다. 좋아요, 대기해주세요, 여러분.",
  "Come back there, we'll take a pause in a second. This ad break isn't real, it's bullshit.": "돌아와요, 잠깐 멈출게요. 이 광고 시간은 진짜가 아니에요, 헛소리예요.",
  "We'll be asking them questions about it after the real ad break, which happens now.": "진짜 광고 후에 그것에 대해 질문할 거예요, 지금 시작합니다.",

  // === dSjylGyrstk.json (exclamations) ===
  "Woah! 🎵": "",
  "Woah, woah, woah, woah!": "와, 와, 와, 와!",
  "Woah!": "와!",

  // === G9tr1X2GmkM.json (comedy show, casual) ===
  "That seems fair. Well, Matt is a friend of mine.": "공정한 것 같네요. 맷은 제 친구예요.",
  "He's a funny boy. He's very nice. He's very easy on the eye.": "재밌는 친구예요. 아주 착해요. 눈이 즐거운 사람이죠.",
  "..it's all wicked away, the moisture, has it? LAUGHTER": "...수분이 다 날아갔나요? 웃음",
  "I don't know what to suggest, madam. Maybe...": "뭘 제안해야 할지 모르겠어요, 부인. 아마...",
  "..spit on your fingers?": "...손가락에 침 뱉으세요?",
  "Huck two. Spit on that thing, yeah.": "하크 투. 그거에 침 뱉어, 그래.",
  "Yes. Yes. There's a slut down here that has advice.": "네. 네. 여기 아래에 조언 있는 사람이 있어요.",
  "LAUGHTER": "",

  // === hf_8DwOyLx8.json (sports commentary, casual) ===
  "He's taken your mark! He's taken your mark!": "네 자리를 뺏었어! 네 자리를 뺏었다고!",
  "Can't be stopped though, he's taken your mark!": "막을 수 없어, 네 자리를 뺏었어!",
  "He's definitely taken the road up with you,": "확실히 너랑 같이 올라갔어,",
  "and I'll be blind since the sex offender!": "그리고 나는 눈이 멀었나 봐!",
  "Sex offender, they should know that!": "범죄자야, 그걸 알아야 해!",
  "If I'm there, they should know that!": "내가 거기 있으면, 알아야 해!",
  "We all fall hard in the lead,": "우리 모두 선두에서 세게 넘어져,",
  "they can't even find the lead!": "선두를 찾지도 못해!",
  "Take your red pistol for good fun,": "빨간 권총 들고 재미있게 놀아,",
  "take your red pistol for good fun!": "빨간 권총 들고 재미있게 놀아!",

  // === ibNWxv71UiY.json (Disney song) ===
  "I know you, I walked with you once upon a dream.": "당신을 알아요, 꿈속에서 한 번 함께 걸었죠.",
  "I know you, the gleam in your eyes is so familiar a gleam.": "당신을 알아요, 눈 속의 빛이 너무나 익숙한 빛이에요.",
  "And I know it's true that visions are seldom all they seem.": "그리고 환상이 보이는 것과 다르다는 걸 알아요.",

  // === iNytCLBEwAw.json (non-English) ===
  "facebook.com": "",
  "wali meh ya": "",
  "sakar piye": "",

  // === IYfmcyyg-Uw.json (rap/music) ===
  "Come shake somethin'.": "",
  "But her and time out...": "",
  "See I'm baddy...": "",
  "I don't know how to dance but can lean": "",
  "And make the ghetto bitches put they hands on they knees": "",
  "Make the ghetto bitches put their hands on they knees": "",
  "Make the ghetto bitches put their hands on they knees": "",

  "And make the ghetto bitches put their hands on they knees": "",

  // === j23C_HIVR5k.json (comedy song) ===
  "Oh, Heather's hot, Heather's hot, we'll go all the way.": "오, 헤더는 핫해, 헤더는 핫해, 끝까지 갈 거야.",
  "I wish I could see her naked and down on all fours.": "그녀가 벗고 네 발로 기는 걸 보고 싶어.",
  "Ted has a little sister, gets hotter every day.": "테드의 여동생이 있는데, 날마다 점점 더 예뻐져.",
  "And if I ever meet her with her boobies, I will play.": "그녀를 만나면 가슴을 가지고 놀 거야.",
  "Everybody, sister, sister, sister.": "다 같이, 시스터, 시스터, 시스터.",
  "What? I can celebrate Hanukkah, too.": "뭐? 나도 하누카 축하할 수 있어.",

  // === Jz9rhNH-A8c.json ===
  "Afford afford": "",
  "Afford afford": "",
  "You": "",

  // === kTT8V0Dl_Q4.json (Sting song - music, ko="") ===
  // All music entries get empty ko
  "Sting! Shaggy!": "스팅! 섀기!",

  // === m8jrFbNFRrM.json ===
  "Oh": "",

  // === mt2qCjL6-n4.json ===
  // Need to check content

  // === nEUzQ7yL9A0.json (exclamations) ===
  "ah": "",
  "woohoo": "",
  "uh uh": "",

  // === Pk6ijWVFOtk.json (song lyrics) ===
  "Get lost, come loose, and lose your way.": "",
  "There ain't no fun in holding back, babe.": "",
  "You gotta enjoy the thrill of living dangerously.": "",
  "You've got a long way to go. Keep things safe, you'll never know.": "",
  "The rules are ours to break.": "",
  "Come on, babe. It's time to get lost.": "",
  "Take a look around.": "",
  "Not right and left, but up and down. Close on the edge, it's all about living bold and free.": "",
  "Expand your mind to see, and put your trust in me.": "",
  "Because you've got potential to travel the distance.": "",
  "I've been existential and lost to existence.": "",
  "And there is no map to your destination.": "",

  // === QCFbeMA2CVw.json (sound effects) ===
  "La da da da da da da.": "",
  "Ah.": "",
  "Ooh.": "",
  "Da da da da da da.": "",
  "Boing.": "",

  // === r5jid6j12h8.json (sound effects/gibberish) ===
  "Ohhoho!": "",
  "AAAGHillo!": "",
  "LE9 conquered Hehe, Hhe, heh.": "",
  "Dead kid.": "",
  "AAAAGHHH! ARGH! OOF! AGH abord!": "",
  "AAghh!": "",

  // === sYSvdXTCd50.json (sound effects) ===
  "Ha-ha-ha!": "",
  "Ha-ha-ha! Hop! Windmill!": "",
  "Okay! Huh?": "",
  "Ha-ha-ha! Okay!": "",
  "Ha-ha-ha! Ha-ha-ha!": "",
  "Ha-ha-ha-ha! Ha-ha-ha! Pomelo?": "",
  "Ahhh!": "",
  "Ha-ha-ha-ha!": "",

  // === TiJBxtM5iKw.json (song - How to Train Your Dragon) ===
  "We go where no one goes": "",
  "We slow for no one": "",
  "Ready? Oh, look in the sky": "",
  "My makeup's on Yeah!": "",

  // === UDSTgx1jgzY.json ===
  "I": "",

  // === WGt7h2TQBCE.json (Chinese lyrics + exclamations) ===
  "Ah!": "",
  "莫忘莫忘多么荒 希望她朋友看不亮": "",
  "希望希望通希望 去年的烦恼和姑娘": "",
  "莫慌莫慌都莫慌 今年的姑娘更漂亮": "",

  // === xDNzz8yAH7I.json (educational - formal) ===
  "Second, some of Jefferson's most memorable words and phrases were borrowed and tweaked from other writers.": "둘째, 제퍼슨의 가장 유명한 단어와 문구 중 일부는 다른 작가들에게서 빌려와 수정한 것입니다.",
  "Lastly, Jefferson had originally included a passage on the evils of slavery, but it was cut from the final draft,": "마지막으로, 제퍼슨은 원래 노예제의 악에 대한 구절을 포함시켰지만 최종 초안에서 삭제되었는데,",
  "in part because Congress wanted no mention of slavery in the nation's founding document.": "부분적으로는 의회가 건국 문서에 노예제 언급을 원하지 않았기 때문입니다.",
  "This remains an important reminder that the Revolution did not guarantee liberty and equality for all.": "이것은 혁명이 모든 사람에게 자유와 평등을 보장하지 않았다는 중요한 교훈으로 남아 있습니다.",
  "Thank you for watching!": "시청해주셔서 감사합니다!",

  // === xURDJ-IW5YM.json (Hallelujah - song) ===
  "I heard there was a secret chord": "",
  "That David played and it pleased the Lord": "",
  "But you don't really care for music, do ya?": "",
  "It goes like this, the fourth, the fifth": "",
  "The minor fall, the major lift": "",
  "The baffled king composing Hallelujah": "",
  "Hallelujah Hallelujah": "",
  "Hallelujah": "",
  "Baby, I've been here before": "",
  "I know this room, I've walked this floor": "",

  // === yg8116aeD7E.json (Coco song - Spanish+English) ===
  "ay mi amor Where should I put my shoes, ay mi amor,": "아이 미 아모르 신발을 어디에 놓을까, 아이 미 아모르,",
  "ay mi amor You say put them on your head, ay mi amor,": "아이 미 아모르 머리 위에 올려놓으래, 아이 미 아모르,",
  "ay mi amor You make me un poco loco, un poquititito loco": "아이 미 아모르 넌 나를 좀 미치게 해, 아주 조금 미치게 해",
  "The way you keep me guessing, I'm nodding and I'm yessing": "네가 계속 헷갈리게 하잖아, 나는 고개 끄덕이고 네네 하고",
  "Ouch, ouch, it's such a blessing That I'm only un poco loco": "아야, 아야, 다행이야 나는 그냥 조금 미친 거니까",
  "The way that you make me is just un poco crazy It's a sense that you're not making": "네가 나를 만드는 방식은 그냥 조금 미친 거야 네가 만들지 않는 느낌이야",
  "The liberties you're taking is like a misunderstanding You're just un poco loco": "네가 부리는 자유는 마치 오해 같아 넌 그냥 조금 미친 거야",

  // === yzSXlqu2FVs.json ===
  // Need to check content

  // === Z1iRJuQVkqU.json (stand-up comedy, casual) ===
  "No problem. That's a lot of tattoos.": "문제없어. 문신이 정말 많네.",
  "What do they say? Do great tattoos.": "뭐라고 써있어? 대단한 문신을 해라.",
  "LAUGHTER What's your name? Jessica.": "웃음 이름이 뭐야? 제시카.",
  "Hi, Jessica. You look as if you don't know the difference between good and bad attention.": "안녕, 제시카. 좋은 관심과 나쁜 관심의 차이를 모르는 것 같네.",
  "What do you do, Jessica? I'm a make-up artist.": "뭐 하는 사람이야, 제시카? 메이크업 아티스트예요.",
  "You're a make-up artist. Of course you are.": "메이크업 아티스트구나. 당연하지.",
  "LAUGHTER Oh, I'm the only one that noticed.": "웃음 오, 내가 유일하게 알아챈 거야.",
  "She has enormous titties. What do you want from me? LAUGHTER So sorry, Jessica.": "가슴이 엄청 크잖아. 뭘 원하는 거야? 웃음 미안, 제시카.",
  "To be great is to be misunderstood. Very good. I like it.": "위대하다는 것은 오해받는다는 것이다. 아주 좋아. 마음에 들어.",
  "Thanks.": "고마워.",

  // === z9kcsfYj8Y0.json (Chomsky - formal) ===
  "So back in the 1960s, you couldn't tell a moderate Republican from a moderate Democrat. They're almost interchangeable. I voted for Republicans back in the 60s. It's inconceivable now. Starting in the 1960s, both parties underwent a change.": "1960년대에는 온건 공화당원과 온건 민주당원을 구별할 수 없었어요. 거의 바꿔놓을 수 있을 정도였죠. 저도 60년대에는 공화당에 투표했어요. 지금은 상상도 못 할 일이죠. 1960년대부터 양당 모두 변화를 겪었습니다.",
  "This was part of larger factors taking place in the global economy. The Republicans simply went off the rails. By now, they're not a political party in any ordinary sense.": "이것은 세계 경제에서 일어나는 더 큰 요인들의 일부였습니다. 공화당은 그냥 탈선했어요. 지금쯤이면 보통 의미의 정당이 아닙니다.",

  // === ZNBiiCPRSx0.json (sound effects/slang) ===
  "Shish! Shish! Shish!": "",
  "You know what it is, I've been running this pool up in the ghost.": "",
  "We can peek a boo-hoo!": "",
  "Vroom! Vroom!": "",
  "On a shin-chak-pak-tong!": "",
  "Pop! Pop! Pop!": "",
  "Pen to the metal!": "",
  "Click! Click! Click!": "",
  "Pull em all to the sky!": "",
  "High! High! High! High!": "",

  // === _6uKZWnJLCM.json (physics - formal) ===
  "ever built. It's the first in the world. It's been built by scientists, physicists, and": "지금까지 만들어진 것 중 가장 대단합니다. 세계 최초예요. 과학자, 물리학자들이 만들었고",
  "the speed of light. At that speed, they go around that 27 kilometers 11,000 times a second.": "빛의 속도요. 그 속도로 27킬로미터를 초당 11,000번 돕니다.",
  "And we collide them with another beam of protons going in the opposite direction. We collide": "그리고 반대 방향으로 가는 또 다른 양성자 빔과 충돌시킵니다. 충돌시키는 곳은",
  "them inside giant detectors. They're essentially digital cameras.": "거대한 검출기 안입니다. 기본적으로 디지털 카메라예요.",

  // === _g4Fm88uWhg.json (fragments) ===
  "The first time I": "",
  "The first time": "",

  // === 9Jd_X1zenj0.json (Incredibles - casual) ===
  "Myself in the prosaic day-to-day-to-day. Fascinating.": "평범한 일상 속의 나 자신. 흥미롭군.",
  "Are you seeing this, Robert? Oh, my God.": "이거 보고 있어, 로버트? 세상에.",
  "The flame retardant is blackberry lavender, darling. Effective, edible, and delicious.": "방염제는 블랙베리 라벤더야, 자기. 효과적이고 먹을 수 있고 맛있어.",
  "Oh, what do you know? That is useful.": "오, 이런. 그거 유용하네.",
  "Although I have doubtlessly exceeded your expectations for a single night's work, the suit and device contain a few more features we need to discuss.": "한밤의 작업치고는 분명 기대를 초과했겠지만, 슈트와 장치에는 더 논의할 기능이 몇 가지 있어.",
  "Ready? Laser eyes. Stop. Wow!": "준비됐어? 레이저 눈. 멈춰. 와!",
  "That's not at all. Watch this. Blaster ready? Pew, pew, pew, pew, pew, pew, pew, pew, pew, pew.": "그건 아무것도 아니야. 이것 봐. 블래스터 준비? 퓨, 퓨, 퓨, 퓨, 퓨, 퓨, 퓨, 퓨, 퓨, 퓨.",
  "That is crazy cool. Hey, I'm just demonstrating. No firing the baby around the house, you understand?": "미쳤다 멋있어. 야, 그냥 시연하는 거야. 집에서 아기한테 발사하면 안 돼, 알았지?",
  "This is potentially dangerous. And we're trying to teach him to control his powers, okay?": "이건 잠재적으로 위험해. 그리고 우리는 걔한테 힘을 제어하는 걸 가르치려는 거야, 알았지?",
  "Stop. See the screen? He vanished. That's really cool.": "멈춰. 화면 보여? 사라졌어. 진짜 멋지다.",
  "Okay, good. Use the thing. See that? That's the current readout. Click it. See the readout? Dimension 4.": "좋아. 그거 써. 보여? 그게 현재 수치야. 클릭해. 수치 보여? 4차원.",
  "See the shape? That's the room. See where he is in relation? So where is he? There!": "형태 보여? 그게 방이야. 위치 보여? 그래서 어디 있어? 거기!",
  "Okay, come out, num-num cookie. Yay!": "좋아, 나와, 냠냠 쿠키. 야호!",
  "Holy cow! I know he's on fire. Just put him out!": "세상에! 불붙은 거 알아. 그냥 꺼!",
  "They're coming! Is it okay to give him that?": "오고 있어! 그거 줘도 괜찮아?",
  "I wasn't hearing any better, ID. No!": "더 잘 안 들렸어. 안 돼!",
  "Come on, Jack-Jack, we have to go. Cookie, num-num?": "자, 잭잭, 가야 해. 쿠키, 냠냠?",
  "Come on! I see him! He's getting away! I'm back!": "어서! 보인다! 도망가고 있어! 돌아왔다!",
  "Darn it!": "젠장!",

  // === AiX-WvMNDPc.json (Frozen - formal/존댓말 for queen scenes) ===
  "Oh, there she is.": "오, 저기 있다.",
  "Elsa! I mean, Queen. Me again. May I present Prince Hans of the Southern Isles.": "엘사! 아니, 여왕님. 또 저예요. 서던 아일스의 한스 왕자를 소개할게요.",
  "Your Majesty. We would like your blessing of our marriage.": "폐하. 저희 결혼을 축복해주세요.",
  "Marriage? I'm sorry, I'm confused. Well, we haven't worked out all the details ourselves.": "결혼이요? 죄송한데, 혼란스러워요. 글쎄, 우리도 세부 사항을 다 정하지는 않았어요.",
  "What did I ever do to you? Enough, Anna. No, why? Why do you shut me out?": "내가 뭘 잘못했는데? 그만, 안나. 아니, 왜? 왜 나를 밀어내는 거야?",
  "Why do you shut the world out? What are you so afraid of? I said enough.": "왜 세상을 차단하는 거야? 뭐가 그렇게 무서운 거야? 그만하라고 했어.",
  "Sorcery. I knew there was something dubious going on here. Elsa.": "마법이야. 여기서 뭔가 수상한 일이 벌어지고 있는 줄 알았어. 엘사.",
  "Yes, it is her. Queen Elsa. Our beautiful queen.": "네, 맞아요. 엘사 여왕님. 우리의 아름다운 여왕님.",
  "Your Majesty, are you all right? Stop her.": "폐하, 괜찮으세요? 막아.",
  "Please, just stay away from me. Stay away. Monster.": "제발, 그냥 나한테서 떨어져. 떨어져. 괴물.",
  "Monster. Elsa.": "괴물. 엘사.",
  "Elsa. Wait, please.": "엘사. 잠깐만, 제발.",
  "Elsa, stop. Anna. No.": "엘사, 멈춰. 안나. 안 돼.",

  // === g2IF5NG2vU4.json (Toy Story - casual) ===
  "Buzz Lightyear to Star Command. Come in, Star Command. Star Command, come in.": "버즈 라이트이어가 스타 커맨드에게. 응답하라, 스타 커맨드. 스타 커맨드, 응답하라.",
  "Hello? Oh yeah! Did I frighten you?": "여보세요? 오 그래! 놀랐어?",
  "My ship has crash landed here by mistake. Yes, it is a mistake because you see the bed here is my spot.": "내 우주선이 실수로 여기 불시착했어. 맞아, 실수야 왜냐면 이 침대가 내 자리거든.",
  "I need to repair my turbo boosters. Do people still use fossil fuels or have you discovered crystallic fusion? Well, let's see.": "터보 부스터를 수리해야 해. 사람들이 아직 화석 연료를 쓰나? 아니면 결정 융합을 발견했나? 글쎄, 보자.",
  "We got double A's. Watch yourself! Who goes there? Don't shoot! It's okay, friends.": "더블A 건전지가 있어. 조심해! 거기 누구야? 쏘지 마! 괜찮아, 친구들.",
  "Do you know these Yes, they're Andy's toys. All right, everyone, you're clear to come up.": "이들을 아세요? 네, 앤디의 장난감들이에요. 좋아, 다들, 올라와도 돼.",
  "I am Buzz Lightyear. I come in peace. Oh, I'm so glad you're not a dinosaur.": "나는 버즈 라이트이어야. 평화롭게 왔어. 오, 공룡이 아니라서 정말 다행이야.",
  "Thank you. Now, thank you all for your kind welcome. Say, what's that button do?": "고마워. 자, 따뜻한 환영에 모두 감사해. 그런데 저 버튼은 뭐야?",
  "I'll show you. Buzz Lightyear to the rescue. Hey, Woody's got something like that.": "보여줄게. 버즈 라이트이어 출동. 야, 우디도 비슷한 거 있잖아.",
  "His is a pull strength. Only it sounds like a car ran over it. Oh, yeah, but not like this one. This is a quality sound system.": "우디 건 끈을 당기는 거야. 근데 차에 깔린 것 같은 소리가 나. 아, 그래, 하지만 이건 달라. 이건 고급 음향 시스템이야.",
  "Probably all copper wiring, huh? So, where are you from? Singapore? Hong Kong? Well, no.": "아마 전부 구리 배선이겠지? 그래서 어디서 왔어? 싱가포르? 홍콩? 글쎄, 아니.",
  "Actually, I'm stationed up in the Gamma Quadrant of Sector 4.": "사실 나는 섹터 4의 감마 구역에 배치되어 있어.",

  // === ZrX1XKtShSI.json (Frozen song - "For the First Time in Forever") ===
  "The window is open, so's that door. I didn't know they did that anymore.": "창문이 열려있고, 문도 열려있어. 더 이상 안 하는 줄 알았는데.",
  "Who knew we owned 8,000 salad plates? For years I've roamed these empty halls.": "우리가 샐러드 접시를 8,000개나 가지고 있는 줄 누가 알았겠어? 몇 년 동안 이 빈 복도를 돌아다녔어.",
  "Why have a ballroom with no balls? Finally they're opening up the gates.": "무도회가 없는 무도회장은 왜 있는 거야? 드디어 문을 여는 거야.",
  "They'll be actual, real-life people. It'll be totally strange. But wow, am I so ready for this change.": "진짜, 실제 사람들이 올 거야. 완전 이상하겠지만. 와, 이 변화가 너무 기다려져.",
  "I suddenly see him standing there, a beautiful stranger, tall and fair.": "갑자기 저기 서있는 그가 보여, 키 크고 잘생긴 아름다운 낯선 사람.",
  "I wanna stuff some chocolate in my face. But then we laugh and talk all evening, which is totally bizarre.": "초콜릿을 입에 마구 쑤셔넣고 싶어. 하지만 저녁 내내 웃고 이야기하는 건 완전 이상해.",
  "Nothing like the life I've led so far.": "지금까지 살아온 삶과는 완전히 달라.",
  "For the first time in forever, there'll be magic, there'll be fun.": "태어나서 처음으로, 마법이 있을 거야, 재미가 있을 거야.",
  "For the first time in forever, I could be noticed by someone.": "태어나서 처음으로, 누군가가 나를 알아봐줄 수 있어.",
  "And I know it is totally crazy to dream I'd find romance.": "로맨스를 찾을 거라고 꿈꾸는 게 완전 미친 거라는 걸 알아.",
  "But for the first time in forever, at least I've got a chance.": "하지만 태어나서 처음으로, 적어도 기회가 있어.",
  "Don't let them in. Don't let them see.": "들어오게 하지 마. 보게 하지 마.",
  "Be the good girl you always have to be. Conceal, don't feel.": "항상 되어야 하는 착한 소녀가 돼. 숨겨, 느끼지 마.",
  "Put on a show. Make one wrong move and everyone will know.": "쇼를 해. 한 번만 실수하면 모두가 알게 돼.",
  "But it's only for today. It's only for today. Don't wait. It's agony to wait.": "하지만 오늘 하루만이야. 오늘 하루만이야. 기다리지 마. 기다리는 건 고통이야.",
  "Tell the guards to open up the gate.": "경비원에게 문을 열라고 해.",
  "For the first time in forever, I'm getting what I'm dreaming of.": "태어나서 처음으로, 꿈꾸던 걸 얻게 돼.",
  "Be the good girl you always have to be.": "항상 되어야 하는 착한 소녀가 돼.",
  "Conceal, don't feel. Don't let them know. I know it all ends tomorrow, so it has to be today.": "숨겨, 느끼지 마. 알게 하지 마. 내일이면 다 끝나는 거 알아, 그래서 오늘이어야 해.",
  "Cause for the first time in forever, for the first time in forever, nothing's in my way.": "태어나서 처음으로, 태어나서 처음으로, 아무것도 방해할 수 없어.",
  "For the first time in forever, for the first time in forever, nothing's in my way.": "태어나서 처음으로, 태어나서 처음으로, 아무것도 방해할 수 없어.",
};

// ─── Music pattern: lines starting with ♪ or containing only music symbols ─────
function isMusicOrEffect(en) {
  if (!en || !en.trim()) return true;
  const t = en.trim();
  if (/^[♪♫🎵🎶\s-]+$/.test(t)) return true;
  if (/^-?♪/.test(t)) return true;  // starts with ♪
  if (/♪[^♪]*♪/.test(t)) return true; // has ♪ bookends
  if (/^♪/.test(t)) return true;
  return false;
}

// ─── Main ───────────────────────────────────────────────────────────────

function main() {
  console.log('=== Fix Missing Korean Translations ===\n');

  let resegFiles = new Set();
  try {
    const out = execSync('git ls-tree --name-only bad95bf1 public/transcripts/', {
      encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe']
    });
    out.trim().split('\n').forEach(p => resegFiles.add(p.replace('public/transcripts/', '')));
  } catch (e) {}

  const files = readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.json'));
  let filesFixed = 0;
  let entriesFixed = 0;
  let entriesUnfixed = 0;
  const unfixedEntries = [];

  for (const f of files) {
    if (resegFiles.has(f)) continue;
    try {
      const data = JSON.parse(readFileSync(join(TRANSCRIPTS_DIR, f), 'utf-8'));
      if (!Array.isArray(data)) continue;
      const withEn = data.filter(d => d.en && d.en.trim());
      const missingKo = withEn.filter(d => !d.ko || !d.ko.trim());
      const rate = withEn.length > 0 ? missingKo.length / withEn.length : 0;
      if (rate <= 0.5) continue;

      let changed = false;
      for (const entry of data) {
        if (entry.ko && entry.ko.trim()) continue;
        if (!entry.en || !entry.en.trim()) continue;

        const en = entry.en.trim();

        // Check direct translation map
        if (translations[en] !== undefined) {
          entry.ko = translations[en];
          entriesFixed++;
          changed = true;
          continue;
        }

        // Music/effects
        if (isMusicOrEffect(en)) {
          entry.ko = '';
          entriesFixed++;
          changed = true;
          continue;
        }

        // Very short utterances (interjections, single words)
        if (en.split(/\s+/).length <= 2 && /^[A-Z!?.\s'a-z]+$/.test(en)) {
          // Simple interjections
          const lower = en.toLowerCase().replace(/[!?.]/g, '').trim();
          const shortMap = {
            'oh': '오', 'ah': '아', 'uh': '어', 'um': '음', 'hmm': '흠',
            'wow': '와', 'hey': '헤이', 'yes': '네', 'no': '아니',
            'yeah': '그래', 'okay': '좋아', 'ok': '좋아', 'right': '맞아',
            'well': '글쎄', 'so': '그래서', 'please': '제발', 'thanks': '고마워',
            'sorry': '미안', 'hi': '안녕', 'hello': '안녕', 'bye': '잘가',
            'what': '뭐', 'why': '왜', 'how': '어떻게', 'five': '다섯',
            'two': '둘', 'one': '하나', 'i': '', 'you': '',
          };
          if (shortMap[lower] !== undefined) {
            entry.ko = shortMap[lower];
            entriesFixed++;
            changed = true;
            continue;
          }
        }

        // Still unfixed
        entriesUnfixed++;
        unfixedEntries.push({ file: f, en });
      }

      if (changed) {
        writeFileSync(join(TRANSCRIPTS_DIR, f), JSON.stringify(data, null, 2));
        filesFixed++;
      }
    } catch (e) {
      console.error(`Error processing ${f}: ${e.message}`);
    }
  }

  console.log(`Files processed: ${filesFixed}`);
  console.log(`Entries fixed: ${entriesFixed}`);
  console.log(`Entries still unfixed: ${entriesUnfixed}`);

  if (unfixedEntries.length > 0) {
    console.log('\nStill unfixed:');
    for (const e of unfixedEntries) {
      console.log(`  ${e.file}: "${e.en}"`);
    }
  }
}

main();

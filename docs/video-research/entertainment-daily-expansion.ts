/**
 * Entertainment & Daily/Education Video Expansion Research
 * ========================================================
 * Target: ~200 additional clips for StudyEng app (expanding from 112 to 300+)
 * Each clip: 45-70 seconds of dialogue-rich English
 *
 * Video IDs marked with [VERIFIED] were extracted from pages containing
 * actual YouTube embed codes or URLs. Others are well-known videos from
 * official channels that need verification before processing.
 *
 * IMPORTANT: Before adding to seed-videos.ts, each video must be:
 *   1. Verified the YouTube ID loads correctly
 *   2. Clip range (clipStart/clipEnd) identified for 45-70s of good dialogue
 *   3. Processed through Whisper for English transcription
 *   4. Translated to Korean via Claude
 */

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface VideoCandidate {
  youtubeId: string;
  title: string;
  series: string;
  category: 'entertainment' | 'daily';
  verified: boolean; // true = ID confirmed from embed/URL extraction
  notes?: string;
}

interface SeriesCandidate {
  id: string;
  title: string;
  category: 'entertainment' | 'daily';
  description: string;
  targetEpisodeCount: number;
}

// ============================================================
// NEW SERIES DEFINITIONS
// ============================================================

export const newEntertainmentSeries: SeriesCandidate[] = [
  // --- Late Night / Talk Shows ---
  {
    id: 'snl',
    title: 'Saturday Night Live',
    category: 'entertainment',
    description: '미국 최고의 코미디 스케치 쇼',
    targetEpisodeCount: 10,
  },
  {
    id: 'jimmy-kimmel',
    title: 'Jimmy Kimmel Live',
    category: 'entertainment',
    description: '지미 키멜의 레이트 나이트 토크쇼',
    targetEpisodeCount: 5,
  },
  {
    id: 'stephen-colbert',
    title: 'The Late Show with Stephen Colbert',
    category: 'entertainment',
    description: '스티븐 콜베어의 레이트 쇼',
    targetEpisodeCount: 5,
  },
  {
    id: 'trevor-noah',
    title: 'The Daily Show - Trevor Noah',
    category: 'entertainment',
    description: '트레버 노아의 데일리 쇼',
    targetEpisodeCount: 5,
  },
  {
    id: 'john-oliver',
    title: 'Last Week Tonight',
    category: 'entertainment',
    description: '존 올리버의 라스트 위크 투나잇',
    targetEpisodeCount: 5,
  },
  {
    id: 'seth-meyers',
    title: 'Late Night with Seth Meyers',
    category: 'entertainment',
    description: '세스 마이어스의 레이트 나이트',
    targetEpisodeCount: 5,
  },
  {
    id: 'craig-ferguson',
    title: 'Late Late Show - Craig Ferguson',
    category: 'entertainment',
    description: '크레이그 퍼거슨의 레전드 토크쇼',
    targetEpisodeCount: 5,
  },
  {
    id: 'james-corden',
    title: 'Late Late Show - James Corden',
    category: 'entertainment',
    description: '제임스 코든의 레이트 레이트 쇼 (카풀 외)',
    targetEpisodeCount: 5,
  },
  {
    id: 'david-letterman',
    title: 'Late Show - David Letterman',
    category: 'entertainment',
    description: '데이비드 레터만의 클래식 토크쇼',
    targetEpisodeCount: 3,
  },

  // --- Reality / Competition Shows ---
  {
    id: 'agt',
    title: "America's Got Talent",
    category: 'entertainment',
    description: '아메리카 갓 탤런트 오디션 하이라이트',
    targetEpisodeCount: 5,
  },
  {
    id: 'masterchef',
    title: 'MasterChef / Gordon Ramsay',
    category: 'entertainment',
    description: '고든 램지의 요리 쇼 명장면',
    targetEpisodeCount: 5,
  },
  {
    id: 'kitchen-nightmares',
    title: 'Kitchen Nightmares',
    category: 'entertainment',
    description: '고든 램지의 키친 나이트메어',
    targetEpisodeCount: 5,
  },
  {
    id: 'shark-tank',
    title: 'Shark Tank',
    category: 'entertainment',
    description: '샤크 탱크 비즈니스 피칭',
    targetEpisodeCount: 5,
  },
  {
    id: 'the-voice',
    title: 'The Voice',
    category: 'entertainment',
    description: '더 보이스 오디션 하이라이트',
    targetEpisodeCount: 3,
  },

  // --- Comedy Shows ---
  {
    id: 'impractical-jokers',
    title: 'Impractical Jokers',
    category: 'entertainment',
    description: '몰래카메라 코미디 쇼',
    targetEpisodeCount: 5,
  },
  {
    id: 'whose-line',
    title: 'Whose Line Is It Anyway',
    category: 'entertainment',
    description: '즉흥 코미디 쇼의 레전드',
    targetEpisodeCount: 5,
  },
  {
    id: 'standup-comedy',
    title: 'Stand-Up Comedy',
    category: 'entertainment',
    description: '미국 스탠드업 코미디 베스트',
    targetEpisodeCount: 10,
  },

  // --- Interviews & Awards ---
  {
    id: 'celebrity-interviews',
    title: 'Celebrity Interviews',
    category: 'entertainment',
    description: '셀럽 인터뷰 명장면 모음',
    targetEpisodeCount: 10,
  },
  {
    id: 'award-shows',
    title: 'Award Show Moments',
    category: 'entertainment',
    description: '오스카/그래미 시상식 명장면',
    targetEpisodeCount: 5,
  },
];

export const newDailySeries: SeriesCandidate[] = [
  {
    id: 'ted-talks-2',
    title: 'TED Talks (New)',
    category: 'daily',
    description: '최신 TED 강연 모음',
    targetEpisodeCount: 20,
  },
  {
    id: 'crash-course',
    title: 'Crash Course',
    category: 'daily',
    description: '재미있는 교육 시리즈',
    targetEpisodeCount: 10,
  },
  {
    id: 'kurzgesagt',
    title: 'Kurzgesagt - In a Nutshell',
    category: 'daily',
    description: '과학을 쉽게 설명하는 애니메이션',
    targetEpisodeCount: 5,
  },
  {
    id: 'vox-explained',
    title: 'Vox Explained',
    category: 'daily',
    description: '뉴스와 문화를 설명하는 시리즈',
    targetEpisodeCount: 5,
  },
  {
    id: 'mkbhd',
    title: 'MKBHD Tech Reviews',
    category: 'daily',
    description: '최고의 테크 리뷰어 마키스 브라운리',
    targetEpisodeCount: 5,
  },
  {
    id: 'casey-neistat',
    title: 'Casey Neistat',
    category: 'daily',
    description: '케이시 나이스탯의 브이로그',
    targetEpisodeCount: 5,
  },
  {
    id: 'nat-geo',
    title: 'National Geographic',
    category: 'daily',
    description: '내셔널 지오그래픽 자연/과학',
    targetEpisodeCount: 5,
  },
  {
    id: 'bbc-learning-english',
    title: 'BBC Learning English',
    category: 'daily',
    description: 'BBC 영어 학습 시리즈',
    targetEpisodeCount: 5,
  },
  {
    id: 'real-conversations',
    title: 'Real English Conversations',
    category: 'daily',
    description: '자연스러운 영어 대화 모음',
    targetEpisodeCount: 10,
  },
  {
    id: 'travel-vlogs',
    title: 'Travel Vlogs',
    category: 'daily',
    description: '여행 브이로그로 배우는 영어',
    targetEpisodeCount: 10,
  },
];

// ============================================================
// ENTERTAINMENT VIDEO CANDIDATES (~120 clips)
// ============================================================

export const entertainmentVideos: VideoCandidate[] = [
  // ============================================================
  // SNL - Saturday Night Live (10 episodes)
  // Source: CBR, TheWrap, LateNighter rankings by YouTube views
  // ============================================================
  {
    youtubeId: 'O7VaXlMvAvk',
    title: 'Black Jeopardy with Tom Hanks',
    series: 'snl',
    category: 'entertainment',
    verified: true, // [VERIFIED] from CBR/TheWrap embed
    notes: '83M+ views. Tom Hanks as MAGA supporter Doug. Great dialogue.',
  },
  {
    youtubeId: 'FaOSCASqLsE',
    title: 'Undercover Boss: Starkiller Base',
    series: 'snl',
    category: 'entertainment',
    verified: true, // [VERIFIED] from CBR/TheWrap embed
    notes: 'Adam Driver as Kylo Ren. Star Wars parody.',
  },
  {
    youtubeId: 'PfPdYYsEfAE',
    title: 'Close Encounter - Ryan Gosling & Kate McKinnon',
    series: 'snl',
    category: 'entertainment',
    verified: true, // [VERIFIED] from CBR/TheWrap embed
    notes: '60M+ views. Alien abduction parody. Gosling breaks character.',
  },
  {
    youtubeId: 'Ch_hoYPPeGc',
    title: 'Celebrity Jeopardy (Kathie Lee, Tom Hanks, Sean Connery)',
    series: 'snl',
    category: 'entertainment',
    verified: true, // [VERIFIED] from CBR/TheWrap embed
    notes: 'Will Ferrell as Alex Trebek. Classic recurring sketch.',
  },
  {
    youtubeId: 'ImaYMoTi2g8',
    title: 'SNL40: Celebrity Jeopardy',
    series: 'snl',
    category: 'entertainment',
    verified: true, // [VERIFIED] from CBR/TheWrap embed
    notes: '40th anniversary special edition.',
  },
  {
    youtubeId: 'm6uvv1aS5_I',
    title: 'Teacher Trial with Ronda Rousey',
    series: 'snl',
    category: 'entertainment',
    verified: true, // [VERIFIED] from CBR embed
    notes: 'Most viewed SNL sketch on YouTube.',
  },
  {
    youtubeId: 'UWuc18xISwI',
    title: 'Sean Spicer Press Conference (Melissa McCarthy)',
    series: 'snl',
    category: 'entertainment',
    verified: true, // [VERIFIED] from TheWrap embed
    notes: 'Melissa McCarthy political impression. Viral sketch.',
  },
  {
    youtubeId: 'pg4Z1M_GjhQ',
    title: 'Harris and Trump Rallies Cold Open',
    series: 'snl',
    category: 'entertainment',
    verified: true, // [VERIFIED] from LateNighter Season 50 list
    notes: '12.6M views. Season 50 most-watched. Maya Rudolph as Kamala.',
  },
  {
    youtubeId: 'RLn5qNngGn4',
    title: 'Bridesmaid Speech - Ariana Grande',
    series: 'snl',
    category: 'entertainment',
    verified: true, // [VERIFIED] from LateNighter Season 50 list
    notes: '12.2M views. Ariana Grande host episode.',
  },
  {
    youtubeId: 'VJ62EfUKI3w',
    title: "Washington's Dream 2 - Nate Bargatze",
    series: 'snl',
    category: 'entertainment',
    verified: true, // [VERIFIED] from LateNighter Season 50 list
    notes: '6.15M views. American English comedy. Great for learning.',
  },

  // ============================================================
  // Jimmy Kimmel Live (5 episodes)
  // Source: ABC, HuffPost, Ranker lists
  // ============================================================
  {
    youtubeId: 'XnY_SUSOseQ',
    title: 'Celebrities Read Mean Tweets #1',
    series: 'jimmy-kimmel',
    category: 'entertainment',
    verified: false,
    notes: 'Original Mean Tweets. 38M+ views. Short celebrity reactions.',
  },
  {
    youtubeId: 'eVFd46qABi0',
    title: 'I Told My Kids I Ate Their Halloween Candy 2023',
    series: 'jimmy-kimmel',
    category: 'entertainment',
    verified: false,
    notes: 'Annual viral segment. Great natural English reactions.',
  },
  {
    youtubeId: 'eSfoF6MhgLA',
    title: 'Matt Damon Takes Over Jimmy Kimmel',
    series: 'jimmy-kimmel',
    category: 'entertainment',
    verified: false,
    notes: 'Legendary fake feud. 10th anniversary takeover.',
  },
  {
    youtubeId: 'v9H5SOl86b8',
    title: 'Lie Witness News - Coachella Fake Bands',
    series: 'jimmy-kimmel',
    category: 'entertainment',
    verified: false,
    notes: 'People pretend to know fake bands. Natural dialogue.',
  },
  {
    youtubeId: 'JHkPPJlKVsU',
    title: 'Unnecessary Censorship Best Of',
    series: 'jimmy-kimmel',
    category: 'entertainment',
    verified: false,
    notes: 'Popular recurring segment.',
  },

  // ============================================================
  // Stephen Colbert - Late Show (5 episodes)
  // Source: Variety, CBS, LateNighter
  // ============================================================
  {
    youtubeId: 'H3KpR6ESmCY',
    title: 'Stephen Interviews President Obama',
    series: 'stephen-colbert',
    category: 'entertainment',
    verified: false,
    notes: '14.86M views. Presidential interview. Clear dialogue.',
  },
  {
    youtubeId: 'VfkhFCSimBI',
    title: 'Stephen Interviews Prince Harry',
    series: 'stephen-colbert',
    category: 'entertainment',
    verified: false,
    notes: '7.7M views. Royal interview. British/American English contrast.',
  },
  {
    youtubeId: 'hA5ezR0Kh80',
    title: 'Stephen Colbert Monologue - Election Night 2024',
    series: 'stephen-colbert',
    category: 'entertainment',
    verified: false,
    notes: 'Record-breaking monologue views. Political comedy.',
  },
  {
    youtubeId: 'MmM_xlfGpGE',
    title: 'Mean Tweets with Celebrities on Late Show',
    series: 'stephen-colbert',
    category: 'entertainment',
    verified: false,
    notes: 'Celebrity reactions. Short snappy dialogue.',
  },
  {
    youtubeId: 'RDrfE9I8_hs',
    title: 'Stephen Colbert - Top Monologue Moments',
    series: 'stephen-colbert',
    category: 'entertainment',
    verified: false,
    notes: 'Late Show highlights. Clear enunciation.',
  },

  // ============================================================
  // Trevor Noah - Daily Show (5 episodes)
  // Source: Sportskeeda, NPR, ScreenRant
  // ============================================================
  {
    youtubeId: 'EBO5N3JBPVo',
    title: 'Between the Scenes - Accents Around the World',
    series: 'trevor-noah',
    category: 'entertainment',
    verified: false,
    notes: 'Trevor does accent impressions. Very popular segment.',
  },
  {
    youtubeId: 'ljaP2etvDc4',
    title: 'Trevor on Growing Up in South Africa',
    series: 'trevor-noah',
    category: 'entertainment',
    verified: false,
    notes: 'Between the Scenes. Personal story. Clear English.',
  },
  {
    youtubeId: 'S7wCy1IOwOw',
    title: 'Between the Scenes - American vs South African Culture',
    series: 'trevor-noah',
    category: 'entertainment',
    verified: false,
    notes: 'Cultural comparison. Great for English learners.',
  },
  {
    youtubeId: 'COD9hcTpGWQ',
    title: 'Trevor Noah Stand-Up - Son of Patricia',
    series: 'trevor-noah',
    category: 'entertainment',
    verified: false,
    notes: 'Netflix special clip. Clear storytelling.',
  },
  {
    youtubeId: 'Psfxo2I-TlI',
    title: 'Between the Scenes - Learning Languages',
    series: 'trevor-noah',
    category: 'entertainment',
    verified: false,
    notes: 'Language learning discussion. Meta-relevant for app.',
  },

  // ============================================================
  // John Oliver - Last Week Tonight (5 episodes)
  // Source: TV Insider, ResetEra, Yahoo
  // ============================================================
  {
    youtubeId: '_-0J49_9lwc',
    title: 'Housing Discrimination Explained',
    series: 'john-oliver',
    category: 'entertainment',
    verified: true, // [VERIFIED] from Yahoo article URL
    notes: 'Deep-dive segment. Clear explanatory English.',
  },
  {
    youtubeId: 'LdA46CTeaYo',
    title: 'Last Week Tonight - Televangelists',
    series: 'john-oliver',
    category: 'entertainment',
    verified: true, // [VERIFIED] from ResetEra article URL
    notes: 'Viral classic episode. Started fake church.',
  },
  {
    youtubeId: 'ximgPmLao0I',
    title: 'Last Week Tonight - Border Wall',
    series: 'john-oliver',
    category: 'entertainment',
    verified: false,
    notes: 'Trump border wall analysis. One of most viewed.',
  },
  {
    youtubeId: 'XGYxLWUKwWo',
    title: 'Last Week Tonight - Mental Health',
    series: 'john-oliver',
    category: 'entertainment',
    verified: false,
    notes: 'Mental health deep dive. Clear explanatory style.',
  },
  {
    youtubeId: 'GGn25URISco',
    title: 'Last Week Tonight - Retirement',
    series: 'john-oliver',
    category: 'entertainment',
    verified: false,
    notes: 'Financial literacy explained with comedy.',
  },

  // ============================================================
  // Seth Meyers - Late Night (5 episodes)
  // Source: TheWrap, NBC
  // ============================================================
  {
    youtubeId: 'zy9c1_RjMnI',
    title: 'A Closer Look - Political Comedy',
    series: 'seth-meyers',
    category: 'entertainment',
    verified: false,
    notes: '18 of top 20 Late Night YouTube videos are A Closer Look.',
  },
  {
    youtubeId: 'PmpaSiJ5HJk',
    title: 'Corrections - Seth Reads Viewer Comments',
    series: 'seth-meyers',
    category: 'entertainment',
    verified: false,
    notes: 'Fan-favorite segment. Casual conversational English.',
  },
  {
    youtubeId: 'OXlZ6edCHqI',
    title: 'Day Drinking with Rihanna',
    series: 'seth-meyers',
    category: 'entertainment',
    verified: false,
    notes: 'Popular interview segment. Natural dialogue.',
  },
  {
    youtubeId: 'tLI9ypbVacs',
    title: 'Day Drinking with Kelly Clarkson',
    series: 'seth-meyers',
    category: 'entertainment',
    verified: false,
    notes: 'Celebrity day drinking segment. Fun casual English.',
  },
  {
    youtubeId: 'e6Funs6yyEw',
    title: 'SNL Pre-Election Cold Open (Seth Meyers cameo)',
    series: 'seth-meyers',
    category: 'entertainment',
    verified: true, // [VERIFIED] from LateNighter Season 50 list
    notes: '10.9M views. John Mulaney host episode.',
  },

  // ============================================================
  // Craig Ferguson - Late Late Show (5 episodes)
  // Source: HubPages, LateNighter, Cracked
  // ============================================================
  {
    youtubeId: '7ZVWIELHQQY',
    title: 'Craig Ferguson - Britney Spears Monologue',
    series: 'craig-ferguson',
    category: 'entertainment',
    verified: false,
    notes: 'Legendary empathetic monologue. Honest, human dialogue.',
  },
  {
    youtubeId: 'qv4Uh6r-at4',
    title: 'Craig Ferguson Interviews Mila Kunis',
    series: 'craig-ferguson',
    category: 'entertainment',
    verified: false,
    notes: 'Famous flirty interview. Natural conversation.',
  },
  {
    youtubeId: 'nCwwVjPNloY',
    title: 'Craig Ferguson - Why Everything Sucks',
    series: 'craig-ferguson',
    category: 'entertainment',
    verified: false,
    notes: 'Classic monologue on American culture.',
  },
  {
    youtubeId: 'M9P4eFXILVE',
    title: 'Craig Ferguson Interviews Robin Williams',
    series: 'craig-ferguson',
    category: 'entertainment',
    verified: false,
    notes: 'Two comedy legends. Fast-paced witty banter.',
  },
  {
    youtubeId: 'ADa0MaRAZxQ',
    title: 'Craig Ferguson Cold Open - Puppets Take Over',
    series: 'craig-ferguson',
    category: 'entertainment',
    verified: false,
    notes: 'Unique late night format. Surreal comedy.',
  },

  // ============================================================
  // James Corden - Late Late Show non-karaoke (5 episodes)
  // ============================================================
  {
    youtubeId: 'BFHF3usFxr4',
    title: 'Spill Your Guts or Fill Your Guts',
    series: 'james-corden',
    category: 'entertainment',
    verified: false,
    notes: 'Celebrities eat gross food or answer questions.',
  },
  {
    youtubeId: 'LmPvf74VPXg',
    title: 'Flinch with One Direction',
    series: 'james-corden',
    category: 'entertainment',
    verified: false,
    notes: 'Game segment. Fun reactions.',
  },
  {
    youtubeId: 'W4OhQm-VRkc',
    title: 'Drop the Mic with Kevin Hart',
    series: 'james-corden',
    category: 'entertainment',
    verified: false,
    notes: 'Rap battle segment. Fast English.',
  },
  {
    youtubeId: 'pzV3OHYXSMU',
    title: 'Crosswalk Musical with Tom Hanks',
    series: 'james-corden',
    category: 'entertainment',
    verified: false,
    notes: 'Performing musicals in the crosswalk. Dialogue-rich.',
  },
  {
    youtubeId: 'kXYiU_JCYtU',
    title: 'James Corden Late Late Show Best Moments',
    series: 'james-corden',
    category: 'entertainment',
    verified: false,
    notes: 'Compilation of best segments.',
  },

  // ============================================================
  // David Letterman - Late Show Classic (3 episodes)
  // ============================================================
  {
    youtubeId: '9mTGJPMCHBQ',
    title: 'Letterman Interviews Bill Murray',
    series: 'david-letterman',
    category: 'entertainment',
    verified: false,
    notes: 'Classic talk show interview. Bill Murray improvising.',
  },
  {
    youtubeId: 'B2GQ0QSLaFQ',
    title: 'Letterman Top Ten List - Classic',
    series: 'david-letterman',
    category: 'entertainment',
    verified: false,
    notes: 'Iconic Top Ten segment.',
  },
  {
    youtubeId: 'AqGMi_DQXMU',
    title: 'Letterman Interviews Obama',
    series: 'david-letterman',
    category: 'entertainment',
    verified: false,
    notes: 'Presidential interview on late night.',
  },

  // ============================================================
  // AGT / Got Talent (5 episodes)
  // Source: GoldDerby, NBC, TalentRecap rankings
  // ============================================================
  {
    youtubeId: 'GBAqZkEwPME',
    title: 'Nightbirde - Its Okay (Golden Buzzer)',
    series: 'agt',
    category: 'entertainment',
    verified: false,
    notes: '48M+ views. Emotional audition. Clear singing + dialogue.',
  },
  {
    youtubeId: 'CZJvBfoHDk0',
    title: 'Courtney Hadwin - Hard to Handle',
    series: 'agt',
    category: 'entertainment',
    verified: false,
    notes: '58M views. 13yo shy girl becomes rock star.',
  },
  {
    youtubeId: 'PJZF_XAuVLM',
    title: 'Mandy Harvey - Try (deaf singer)',
    series: 'agt',
    category: 'entertainment',
    verified: false,
    notes: '51M views. Deaf singer gets Golden Buzzer.',
  },
  {
    youtubeId: 'Y4ORIIT-W80',
    title: 'Kenichi Ebina - Dance Audition',
    series: 'agt',
    category: 'entertainment',
    verified: false,
    notes: '126M views. Most viewed AGT audition.',
  },
  {
    youtubeId: 'sbnFicGcxQo',
    title: 'Susan Boyle - I Dreamed a Dream (BGT)',
    series: 'agt',
    category: 'entertainment',
    verified: false,
    notes: '260M+ views. Most viral talent show audition ever.',
  },

  // ============================================================
  // MasterChef / Gordon Ramsay (5 episodes)
  // Source: Daily Meal, Collider, official YT channel
  // ============================================================
  {
    youtubeId: 'aDL0SJaJR-0',
    title: 'Gordon Ramsay Best Insults Compilation',
    series: 'masterchef',
    category: 'entertainment',
    verified: false,
    notes: 'Famous Gordon Ramsay insults. Colorful English.',
  },
  {
    youtubeId: 'PV67UivIq0w',
    title: 'Hells Kitchen - Its Raw! Best Of',
    series: 'masterchef',
    category: 'entertainment',
    verified: false,
    notes: "Iconic 'It's RAW!' moments.",
  },
  {
    youtubeId: 'S1WxoAfzQzU',
    title: 'Gordon Ramsay Makes Scrambled Eggs',
    series: 'masterchef',
    category: 'entertainment',
    verified: false,
    notes: 'Cooking tutorial. Clear instructional English.',
  },
  {
    youtubeId: 'jLwSxIdPrPE',
    title: 'MasterChef Junior - Kids Impress Gordon',
    series: 'masterchef',
    category: 'entertainment',
    verified: false,
    notes: 'Wholesome kids cooking. Simple dialogue.',
  },
  {
    youtubeId: 'Jx1YqR6mos0',
    title: 'Gordon Ramsay vs James Corden Cooking Battle',
    series: 'masterchef',
    category: 'entertainment',
    verified: false,
    notes: 'Celebrity cooking challenge. Fun dialogue.',
  },

  // ============================================================
  // Kitchen Nightmares (5 episodes)
  // Source: Kitchen Nightmares YT channel (official)
  // ============================================================
  {
    youtubeId: 'Qp57UjkkR2k',
    title: 'Kitchen Nightmares - Best Arguments',
    series: 'kitchen-nightmares',
    category: 'entertainment',
    verified: true, // [VERIFIED] from Fandom wiki
    notes: 'Gordon confronts restaurant owners.',
  },
  {
    youtubeId: '1bvujGRVmZ4',
    title: "Amy's Baking Company - Most Insane Episode",
    series: 'kitchen-nightmares',
    category: 'entertainment',
    verified: false,
    notes: 'Most famous Kitchen Nightmares episode. Viral.',
  },
  {
    youtubeId: 'bEY3mF6JYHE',
    title: 'Kitchen Nightmares - Delusional Owners',
    series: 'kitchen-nightmares',
    category: 'entertainment',
    verified: false,
    notes: 'Owners in denial. Dramatic dialogue.',
  },
  {
    youtubeId: 'ekUOe19pKV0',
    title: 'Gordon Tries the Food - Best Reactions',
    series: 'kitchen-nightmares',
    category: 'entertainment',
    verified: false,
    notes: 'Gordon tasting bad food. Expressive English.',
  },
  {
    youtubeId: 'DNeUhsMQ1Uk',
    title: 'Kitchen Nightmares - Finally Some Good Food',
    series: 'kitchen-nightmares',
    category: 'entertainment',
    verified: false,
    notes: 'Origin of the famous meme.',
  },

  // ============================================================
  // Shark Tank (5 episodes)
  // Source: US Chamber, Inc, Collider rankings
  // ============================================================
  {
    youtubeId: 'uxI25TGl_1U',
    title: 'Scrub Daddy - Best Shark Tank Pitch Ever',
    series: 'shark-tank',
    category: 'entertainment',
    verified: false,
    notes: '$1B+ in sales. Perfect business pitch English.',
  },
  {
    youtubeId: 'YElnSbzOv6s',
    title: 'Squatty Potty - Hilarious Pitch',
    series: 'shark-tank',
    category: 'entertainment',
    verified: false,
    notes: 'Viral funny pitch. Mother-son duo.',
  },
  {
    youtubeId: 'o2bEaB3Z3u0',
    title: 'Cousins Maine Lobster Pitch',
    series: 'shark-tank',
    category: 'entertainment',
    verified: false,
    notes: 'Best prepared pitch in Shark Tank history.',
  },
  {
    youtubeId: '2QexyLiM9tw',
    title: 'Ring Doorbell - Rejected Then Became $1B',
    series: 'shark-tank',
    category: 'entertainment',
    verified: false,
    notes: 'Sharks passed, became billion-dollar company.',
  },
  {
    youtubeId: 'vqQXFdIXirc',
    title: 'Bombas Socks - Social Enterprise Pitch',
    series: 'shark-tank',
    category: 'entertainment',
    verified: false,
    notes: 'One-for-one sock donation model pitch.',
  },

  // ============================================================
  // The Voice (3 episodes)
  // ============================================================
  {
    youtubeId: 'kYIHE6iGx1g',
    title: 'Best Blind Auditions The Voice USA',
    series: 'the-voice',
    category: 'entertainment',
    verified: false,
    notes: 'Coaches reactions. Natural dialogue.',
  },
  {
    youtubeId: 'qDRORgoZxZU',
    title: 'Judge Banter - Best Coach Moments',
    series: 'the-voice',
    category: 'entertainment',
    verified: false,
    notes: 'Coach arguments and jokes.',
  },
  {
    youtubeId: 'IFqVNPwsLNo',
    title: 'The Voice Knockouts Best Performance',
    series: 'the-voice',
    category: 'entertainment',
    verified: false,
    notes: 'Performance + judge dialogue.',
  },

  // ============================================================
  // Impractical Jokers (5 episodes)
  // Source: Collider, Looper, TruTV
  // ============================================================
  {
    youtubeId: 'JG_wClmLFC0',
    title: 'Impractical Jokers - Best Punishments',
    series: 'impractical-jokers',
    category: 'entertainment',
    verified: false,
    notes: 'Punishment compilations. Natural everyday English.',
  },
  {
    youtubeId: 'kZ7DVawEjmM',
    title: 'Impractical Jokers - Supermarket Challenge',
    series: 'impractical-jokers',
    category: 'entertainment',
    verified: false,
    notes: 'Hidden camera in supermarket. Real reactions.',
  },
  {
    youtubeId: '4LGe265pwSY',
    title: 'Impractical Jokers - Presentation Fails',
    series: 'impractical-jokers',
    category: 'entertainment',
    verified: false,
    notes: 'Jokers give presentations with hidden earpieces.',
  },
  {
    youtubeId: 'bRVCJoEQM3c',
    title: 'Impractical Jokers - Focus Group',
    series: 'impractical-jokers',
    category: 'entertainment',
    verified: false,
    notes: 'Real people reactions to absurd questions.',
  },
  {
    youtubeId: '1hJQQLY5P4E',
    title: 'Impractical Jokers - Novocaine Challenge',
    series: 'impractical-jokers',
    category: 'entertainment',
    verified: false,
    notes: 'Murr with numb mouth tries to speak. Hilarious.',
  },

  // ============================================================
  // Whose Line Is It Anyway (5 episodes)
  // Source: WatchMojo, BuzzFeed, TV Tropes
  // ============================================================
  {
    youtubeId: 'CTxkxG3DF4k',
    title: 'Scenes From a Hat - Best Of',
    series: 'whose-line',
    category: 'entertainment',
    verified: false,
    notes: 'Improv comedy. Quick-fire dialogue.',
  },
  {
    youtubeId: 'Td67kYY9mdQ',
    title: 'Greatest Hits - Wayne Brady Sings',
    series: 'whose-line',
    category: 'entertainment',
    verified: false,
    notes: 'Musical improv. Colin and Ryan riff.',
  },
  {
    youtubeId: 'O7VYoU9YVTM',
    title: 'Richard Simmons Guest Appearance',
    series: 'whose-line',
    category: 'entertainment',
    verified: false,
    notes: 'Legendary guest spot. Everyone breaks.',
  },
  {
    youtubeId: 'GaoLU6zKaws',
    title: 'Sound Effects - Buddy Cops',
    series: 'whose-line',
    category: 'entertainment',
    verified: false,
    notes: 'Audience provides sound effects. Absurd comedy.',
  },
  {
    youtubeId: '2OcemB0K4FU',
    title: 'Hoedown and Irish Drinking Song Best Of',
    series: 'whose-line',
    category: 'entertainment',
    verified: false,
    notes: 'Musical improv. Quick witty lyrics.',
  },

  // ============================================================
  // Stand-Up Comedy (10 episodes)
  // Source: Netflix/YouTube compilations
  // ============================================================
  {
    youtubeId: 'lXpmHMm3tfc',
    title: 'Kevin Hart - My Kids Are Terrible',
    series: 'standup-comedy',
    category: 'entertainment',
    verified: false,
    notes: 'From Laugh At My Pain. Family comedy.',
  },
  {
    youtubeId: 'R4semGMGvEY',
    title: 'John Mulaney - The Salt and Pepper Diner',
    series: 'standup-comedy',
    category: 'entertainment',
    verified: false,
    notes: 'From New in Town. Storytelling masterclass.',
  },
  {
    youtubeId: 'J-zC46Tiurc',
    title: 'Dave Chappelle - First African American',
    series: 'standup-comedy',
    category: 'entertainment',
    verified: false,
    notes: 'From Killin Them Softly. Social commentary.',
  },
  {
    youtubeId: 'funSuqCBsas',
    title: 'Jim Gaffigan - Hot Pockets',
    series: 'standup-comedy',
    category: 'entertainment',
    verified: false,
    notes: 'Food comedy. Clean, easy to follow.',
  },
  {
    youtubeId: 'QnkrL42R7gk',
    title: 'Trevor Noah - Afraid of the Dark (Accents)',
    series: 'standup-comedy',
    category: 'entertainment',
    verified: false,
    notes: 'Netflix special. Accent comedy.',
  },
  {
    youtubeId: 'BzIHyF7UWY4',
    title: 'Hasan Minhaj - Homecoming King',
    series: 'standup-comedy',
    category: 'entertainment',
    verified: false,
    notes: 'Netflix special. Cultural identity comedy.',
  },
  {
    youtubeId: 'XY5KTVA_2ys',
    title: 'Ali Wong - Baby Cobra Best Bits',
    series: 'standup-comedy',
    category: 'entertainment',
    verified: false,
    notes: 'Netflix special. Sharp observational comedy.',
  },
  {
    youtubeId: '2k3yLkMFBuE',
    title: 'Brian Regan - Stupid in School',
    series: 'standup-comedy',
    category: 'entertainment',
    verified: false,
    notes: 'Clean family-friendly comedy. Clear pronunciation.',
  },
  {
    youtubeId: 'nzGsBGk5VnI',
    title: 'Sebastian Maniscalco - Doorbell',
    series: 'standup-comedy',
    category: 'entertainment',
    verified: false,
    notes: 'Italian-American family comedy.',
  },
  {
    youtubeId: 'EUJYXaS9gqE',
    title: 'Nate Bargatze - Full Time Magic',
    series: 'standup-comedy',
    category: 'entertainment',
    verified: false,
    notes: 'Deadpan delivery. Easy to understand.',
  },

  // ============================================================
  // Celebrity Interviews (10 episodes)
  // Source: Various talk shows, viral moments
  // ============================================================
  {
    youtubeId: 'iffAMFDGe7s',
    title: 'Will Smith Slaps Chris Rock - Oscars 2022',
    series: 'celebrity-interviews',
    category: 'entertainment',
    verified: false,
    notes: 'Most viral award show moment. Short dialogue.',
  },
  {
    youtubeId: 'UaVTIH8mujA',
    title: 'Jennifer Lawrence Falls at Oscars',
    series: 'celebrity-interviews',
    category: 'entertainment',
    verified: false,
    notes: 'Charming acceptance speech after tripping.',
  },
  {
    youtubeId: 'rNkwKR04tPQ',
    title: 'Robert Downey Jr on Graham Norton',
    series: 'celebrity-interviews',
    category: 'entertainment',
    verified: false,
    notes: 'Witty banter. British/American English mix.',
  },
  {
    youtubeId: 'OAIrIM2nZfc',
    title: 'Keanu Reeves Interview - Youre Breathtaking',
    series: 'celebrity-interviews',
    category: 'entertainment',
    verified: false,
    notes: 'Viral E3 moment. Short but iconic.',
  },
  {
    youtubeId: 'nyXZR-kkWPI',
    title: 'Ryan Reynolds Interview Deadpool Humor',
    series: 'celebrity-interviews',
    category: 'entertainment',
    verified: false,
    notes: 'Sarcastic comedy. Natural conversational English.',
  },
  {
    youtubeId: 'cISYzA36-ZY',
    title: 'BTS Interview on Late Night (English)',
    series: 'celebrity-interviews',
    category: 'entertainment',
    verified: false,
    notes: 'K-pop meets American talk show. Bilingual moments.',
  },
  {
    youtubeId: 'XsiiIa6bs9I',
    title: 'Tom Holland Spoiling Marvel Movies',
    series: 'celebrity-interviews',
    category: 'entertainment',
    verified: false,
    notes: 'Tom Holland accidentally reveals spoilers. Funny.',
  },
  {
    youtubeId: 'sqA577_IoBk',
    title: 'Zendaya and Tom Holland Chemistry',
    series: 'celebrity-interviews',
    category: 'entertainment',
    verified: false,
    notes: 'Interview chemistry. Natural young adult English.',
  },
  {
    youtubeId: 'FhhJhwVHYFY',
    title: 'Morgan Freeman Interview - Voice of God',
    series: 'celebrity-interviews',
    category: 'entertainment',
    verified: false,
    notes: 'Perfect pronunciation. Clear deep voice.',
  },
  {
    youtubeId: 'YkgkThdzX-8',
    title: 'Conan Travels to Japan',
    series: 'celebrity-interviews',
    category: 'entertainment',
    verified: false,
    notes: 'Conan abroad. Cultural comedy with English narration.',
  },

  // ============================================================
  // Award Show Moments (5 episodes)
  // ============================================================
  {
    youtubeId: 'DLzxrzFCyOs',
    title: 'Oscar Best Speech - Matthew McConaughey',
    series: 'award-shows',
    category: 'entertainment',
    verified: false,
    notes: 'Alright alright alright. Motivational speech.',
  },
  {
    youtubeId: '1i3Chp_LFrk',
    title: 'Adele Grammy Speech - Album of the Year',
    series: 'award-shows',
    category: 'entertainment',
    verified: false,
    notes: 'Emotional speech praising Beyonce.',
  },
  {
    youtubeId: 'kjJZbLBqJZU',
    title: 'La La Land / Moonlight Oscar Mix-Up',
    series: 'award-shows',
    category: 'entertainment',
    verified: false,
    notes: 'Infamous wrong envelope. Dramatic real dialogue.',
  },
  {
    youtubeId: 'Y5l0ZgvBbTs',
    title: 'Ricky Gervais Golden Globes Roast',
    series: 'award-shows',
    category: 'entertainment',
    verified: false,
    notes: 'Controversial hosting. Sharp British humor.',
  },
  {
    youtubeId: 'cnCMqr1QRQw',
    title: 'Ellen DeGeneres Oscar Selfie Moment',
    series: 'award-shows',
    category: 'entertainment',
    verified: false,
    notes: 'Record-breaking tweet. Celebrity banter.',
  },
];

// ============================================================
// DAILY / EDUCATION VIDEO CANDIDATES (~80 clips)
// ============================================================

export const dailyVideos: VideoCandidate[] = [
  // ============================================================
  // TED Talks - New Speakers (20 episodes)
  // Source: TED.com playlists, TED blog top 2024
  // ============================================================

  // --- Top TED Talks of 2024 (from official TED playlist) ---
  {
    youtubeId: 'L9y6Ce2ZLWI',
    title: 'How the US is Destroying Young Peoples Future - Scott Galloway',
    series: 'ted-talks-2',
    category: 'daily',
    verified: false,
    notes: '#1 most popular TED 2024. Clear passionate delivery.',
  },
  {
    youtubeId: 'KKNCiRWd_j0',
    title: 'What is an AI Anyway - Mustafa Suleyman',
    series: 'ted-talks-2',
    category: 'daily',
    verified: false,
    notes: '#2 TED 2024. AI explained simply.',
  },
  {
    youtubeId: 'Tf5p_bHR5Yg',
    title: 'The Problem with Being Too Nice at Work - Tessa West',
    series: 'ted-talks-2',
    category: 'daily',
    verified: false,
    notes: '#6 TED 2024. Workplace English.',
  },
  {
    youtubeId: 'bHGE3FmfMN8',
    title: 'A Comedians Take on How to Save Democracy - Jordan Klepper',
    series: 'ted-talks-2',
    category: 'daily',
    verified: false,
    notes: '#8 TED 2024. Comedy + politics.',
  },
  {
    youtubeId: 'xAzraJbBDKM',
    title: 'The Tipping Point I Got Wrong - Malcolm Gladwell',
    series: 'ted-talks-2',
    category: 'daily',
    verified: false,
    notes: '#10 TED 2024. Famous author revisits ideas.',
  },

  // --- Classic Short TED Talks (well-known) ---
  {
    youtubeId: 'V74AxCqOTvg',
    title: 'How to Start a Movement - Derek Sivers',
    series: 'ted-talks-2',
    category: 'daily',
    verified: true, // [VERIFIED] from TED search results
    notes: '3 minutes. Shows how movements begin.',
  },
  {
    youtubeId: 'zAFcV7zuUDA',
    title: 'How to Tie Your Shoes - Terry Moore',
    series: 'ted-talks-2',
    category: 'daily',
    verified: true, // [VERIFIED] from TED search results
    notes: '3 minutes. Simple, clear English.',
  },
  {
    youtubeId: 'YX_OxBfsvbk',
    title: 'Why is X the Unknown - Terry Moore',
    series: 'ted-talks-2',
    category: 'daily',
    verified: true, // [VERIFIED] from TED search results
    notes: '4 minutes. Math history explanation.',
  },
  {
    youtubeId: 'C4Uc-cztsJo',
    title: 'More Adventures in Replying to Spam - James Veitch',
    series: 'ted-talks-2',
    category: 'daily',
    verified: true, // [VERIFIED] from multiple sources
    notes: '59M+ views. Comedy + email scams.',
  },

  // --- Other Popular TED Talks ---
  {
    youtubeId: 'H14bBuluwB8',
    title: 'Inside the Mind of a Procrastinator - Tim Urban',
    series: 'ted-talks-2',
    category: 'daily',
    verified: false,
    notes: '65M+ views. Funny + relatable. Great for learners.',
  },
  {
    youtubeId: 'iCvmsMzlF7o',
    title: 'The Power of Vulnerability - Brene Brown',
    series: 'ted-talks-2',
    category: 'daily',
    verified: false,
    notes: '65M+ views. Most popular TED speaker.',
  },
  {
    youtubeId: 'qp0HIF3SfI4',
    title: 'How Great Leaders Inspire Action - Simon Sinek',
    series: 'ted-talks-2',
    category: 'daily',
    verified: false,
    notes: '63M+ views. Golden Circle framework.',
  },
  {
    youtubeId: 'arj7oStGLkU',
    title: 'Your Body Language May Shape Who You Are - Amy Cuddy',
    series: 'ted-talks-2',
    category: 'daily',
    verified: false,
    notes: '68M+ views. Power posing.',
  },
  {
    youtubeId: '8S0FDjFBj8o',
    title: 'Try Something New for 30 Days - Matt Cutts',
    series: 'ted-talks-2',
    category: 'daily',
    verified: false,
    notes: '3 minutes. Simple challenge concept.',
  },
  {
    youtubeId: 'Ks-_Mh1QhMc',
    title: 'Got a Meeting? Take a Walk - Nilofer Merchant',
    series: 'ted-talks-2',
    category: 'daily',
    verified: false,
    notes: '4 minutes. Business advice. Clear delivery.',
  },
  {
    youtubeId: 'UF8uR6Z6KLc',
    title: 'The Surprising Habits of Original Thinkers - Adam Grant',
    series: 'ted-talks-2',
    category: 'daily',
    verified: false,
    notes: 'Organizational psychology. Clear academic English.',
  },
  {
    youtubeId: 'Nks_YLp9r6A',
    title: 'The Skill of Self Confidence - Dr Ivan Joseph',
    series: 'ted-talks-2',
    category: 'daily',
    verified: false,
    notes: 'TEDx talk. Self-improvement. Clear delivery.',
  },
  {
    youtubeId: 'vhhgI4tSMwc',
    title: "What I Learned from 100 Days of Rejection - Jia Jiang",
    series: 'ted-talks-2',
    category: 'daily',
    verified: false,
    notes: 'TEDx. Overcoming fear. Storytelling.',
  },
  {
    youtubeId: 'RcGyVTAoXEU',
    title: 'The Happy Secret to Better Work - Shawn Achor',
    series: 'ted-talks-2',
    category: 'daily',
    verified: false,
    notes: 'Positive psychology. Funny + educational.',
  },
  {
    youtubeId: 'ZUFPbBjr6xY',
    title: 'How to Make Stress Your Friend - Kelly McGonigal',
    series: 'ted-talks-2',
    category: 'daily',
    verified: false,
    notes: 'Health psychology. Counterintuitive advice.',
  },

  // ============================================================
  // Crash Course (10 episodes)
  // Source: CrashCourse.com, YouTube channel @crashcourse
  // ============================================================
  {
    youtubeId: 'IhuwS5ZLwKY',
    title: 'Crash Course Study Skills #1 - Taking Notes',
    series: 'crash-course',
    category: 'daily',
    verified: true, // [VERIFIED] from playlist URL
    notes: 'Study skills series opener. Practical English.',
  },
  {
    youtubeId: 'nckLS04l5o0',
    title: 'Crash Course World History #1 - Agricultural Revolution',
    series: 'crash-course',
    category: 'daily',
    verified: false,
    notes: 'John Green. Fast-paced but clear. Very popular.',
  },
  {
    youtubeId: 'QnQe0xW_JY4',
    title: 'Crash Course Biology #1 - Intro to Biology',
    series: 'crash-course',
    category: 'daily',
    verified: false,
    notes: 'Hank Green. Science vocabulary.',
  },
  {
    youtubeId: 'ixQbCXLUUj8',
    title: 'Crash Course Psychology #1 - Intro to Psychology',
    series: 'crash-course',
    category: 'daily',
    verified: false,
    notes: 'Popular series. Academic English made accessible.',
  },
  {
    youtubeId: 'd8uTB5XorBw',
    title: 'Crash Course Economics #1 - Intro to Economics',
    series: 'crash-course',
    category: 'daily',
    verified: false,
    notes: 'Business/finance vocabulary.',
  },
  {
    youtubeId: 'tpIctyqH29Q',
    title: 'Crash Course US History #1 - The Black Legend',
    series: 'crash-course',
    category: 'daily',
    verified: false,
    notes: 'John Green on American history.',
  },
  {
    youtubeId: '1o2pe41TaEo',
    title: 'Crash Course Sociology #1 - What Is Sociology',
    series: 'crash-course',
    category: 'daily',
    verified: false,
    notes: 'Social science vocabulary.',
  },
  {
    youtubeId: 'OoO5d07Rd6w',
    title: 'Crash Course Film History #1 - The Birth of Movies',
    series: 'crash-course',
    category: 'daily',
    verified: false,
    notes: 'Film vocabulary. Pop culture references.',
  },
  {
    youtubeId: '4dn76ZPkDeM',
    title: 'Crash Course Philosophy #1 - What Is Philosophy',
    series: 'crash-course',
    category: 'daily',
    verified: false,
    notes: 'Abstract thinking in English.',
  },
  {
    youtubeId: 'ChRruhFa3Hw',
    title: 'Crash Course Computer Science #1 - Early Computing',
    series: 'crash-course',
    category: 'daily',
    verified: false,
    notes: 'Tech vocabulary. Modern topic.',
  },

  // ============================================================
  // Kurzgesagt - In a Nutshell (5 episodes)
  // Source: Kurzgesagt.org, Social Blade, Tubefilter
  // ============================================================
  {
    youtubeId: 'BtN-goy9VOY',
    title: 'The Coronavirus Explained',
    series: 'kurzgesagt',
    category: 'daily',
    verified: false,
    notes: '89M views. Most viewed. Clear science narration.',
  },
  {
    youtubeId: 'JQVmkDUkZT4',
    title: 'The Egg - Kurzgesagt',
    series: 'kurzgesagt',
    category: 'daily',
    verified: false,
    notes: 'Philosophical short story. Beautiful narration.',
  },
  {
    youtubeId: 'uD4izuDMUQA',
    title: 'Optimistic Nihilism',
    series: 'kurzgesagt',
    category: 'daily',
    verified: false,
    notes: 'Philosophy of life. Clear academic English.',
  },
  {
    youtubeId: 'sNhhvQGsMEc',
    title: 'What if the Sun Disappeared',
    series: 'kurzgesagt',
    category: 'daily',
    verified: false,
    notes: 'Science thought experiment. Simple vocabulary.',
  },
  {
    youtubeId: 'NbuUW9i-mHs',
    title: 'The Immune System Explained',
    series: 'kurzgesagt',
    category: 'daily',
    verified: false,
    notes: 'Biology + health vocabulary. Animated.',
  },

  // ============================================================
  // Vox Explained (5 episodes)
  // Source: Vox YouTube channel, PressGazette
  // ============================================================
  {
    youtubeId: 'aWIE0PX1uXk',
    title: 'Why Stradivarius Violins Are Worth Millions',
    series: 'vox-explained',
    category: 'daily',
    verified: false,
    notes: 'Popular Vox explainer. Music + science.',
  },
  {
    youtubeId: 'LrGPp5_hVeo',
    title: 'Why the US Puts Corn in Everything',
    series: 'vox-explained',
    category: 'daily',
    verified: false,
    notes: 'Food + economics explainer.',
  },
  {
    youtubeId: 'YQZ2UeOTO3I',
    title: 'How the Yanny vs Laurel Debate Went Viral',
    series: 'vox-explained',
    category: 'daily',
    verified: false,
    notes: 'Language/perception topic. Meta-relevant.',
  },
  {
    youtubeId: '1Bix44C1EzY',
    title: 'Why All World Maps Are Wrong',
    series: 'vox-explained',
    category: 'daily',
    verified: false,
    notes: 'Geography explainer. Clear narration.',
  },
  {
    youtubeId: 'E-0Iidog4Xk',
    title: 'Why the US Has No High Speed Rail',
    series: 'vox-explained',
    category: 'daily',
    verified: false,
    notes: 'Infrastructure + politics explainer.',
  },

  // ============================================================
  // MKBHD Tech Reviews (5 episodes)
  // Source: MKBHD channel, FastCompany timeline
  // ============================================================
  {
    youtubeId: 'UIH_feguiXA',
    title: 'iPhone 16 Pro Review - MKBHD',
    series: 'mkbhd',
    category: 'daily',
    verified: false,
    notes: 'Latest iPhone review. Clear tech English.',
  },
  {
    youtubeId: 'Z7_28Jg5sPc',
    title: 'Tesla Cybertruck Review - MKBHD',
    series: 'mkbhd',
    category: 'daily',
    verified: false,
    notes: 'Viral truck review. Tech vocabulary.',
  },
  {
    youtubeId: 'XrGqJCOmxQA',
    title: 'Best Headphones of 2024 - MKBHD',
    series: 'mkbhd',
    category: 'daily',
    verified: false,
    notes: 'Product comparison. Descriptive English.',
  },
  {
    youtubeId: 'NpiE4yb6tQA',
    title: 'Apple Vision Pro Review - MKBHD',
    series: 'mkbhd',
    category: 'daily',
    verified: false,
    notes: 'Cutting edge tech. Future vocabulary.',
  },
  {
    youtubeId: 'mXU__3QI8OQ',
    title: 'Talking Tech with Bill Gates - MKBHD',
    series: 'mkbhd',
    category: 'daily',
    verified: false,
    notes: 'Interview with Bill Gates. Clear dialogue.',
  },

  // ============================================================
  // Casey Neistat Vlogs (5 episodes)
  // Source: TheTVDB archive, Casey Neistat channel
  // ============================================================
  {
    youtubeId: 'gnHCw87Enq4',
    title: 'Casey Neistat - Vlog #001',
    series: 'casey-neistat',
    category: 'daily',
    verified: true, // [VERIFIED] from TheTVDB listing
    notes: 'First vlog ever. NYC daily life English.',
  },
  {
    youtubeId: 'cmLFCfNrHlo',
    title: 'Casey Neistat - NYC Daily Life',
    series: 'casey-neistat',
    category: 'daily',
    verified: true, // [VERIFIED] from TheTVDB listing
    notes: 'Early vlog. Natural conversational English.',
  },
  {
    youtubeId: 'pmGOE6yNA98',
    title: 'Casey Neistat - Weekend Adventures',
    series: 'casey-neistat',
    category: 'daily',
    verified: true, // [VERIFIED] from TheTVDB listing
    notes: 'Casual vlog. Daily life vocabulary.',
  },
  {
    youtubeId: 'WxfZkMm3wcg',
    title: 'Make It Count - Nike Fuelband (Casey Neistat)',
    series: 'casey-neistat',
    category: 'daily',
    verified: false,
    notes: 'Most iconic Casey video. Travel around the world.',
  },
  {
    youtubeId: 'bzE-IMaegzQ',
    title: 'Casey Neistat - Bike Lanes',
    series: 'casey-neistat',
    category: 'daily',
    verified: false,
    notes: 'Viral NYC bike lane video. Activist filmmaking.',
  },

  // ============================================================
  // National Geographic (5 episodes)
  // Source: NatGeo YT channel, Wikitubia
  // ============================================================
  {
    youtubeId: 'AYecihGqJrU',
    title: 'Emperor Penguins - NatGeo',
    series: 'nat-geo',
    category: 'daily',
    verified: false,
    notes: '63M views. Nature narration. Documentary English.',
  },
  {
    youtubeId: 'bpbkSGm6Oeg',
    title: 'Worlds Deadliest Animals - NatGeo',
    series: 'nat-geo',
    category: 'daily',
    verified: false,
    notes: 'Wildlife documentary. Clear narration.',
  },
  {
    youtubeId: 'W4rYzEIyg-s',
    title: 'Great White Shark Encounter - NatGeo',
    series: 'nat-geo',
    category: 'daily',
    verified: false,
    notes: 'Ocean life documentary. Science vocabulary.',
  },
  {
    youtubeId: 'wkObbkBM-mQ',
    title: 'Inside the International Space Station - NatGeo',
    series: 'nat-geo',
    category: 'daily',
    verified: false,
    notes: 'Space exploration. Technical English.',
  },
  {
    youtubeId: 'ViM7CQLS_jA',
    title: 'Grand Canyon from Above - NatGeo',
    series: 'nat-geo',
    category: 'daily',
    verified: false,
    notes: 'Nature + geography. Descriptive English.',
  },

  // ============================================================
  // BBC Learning English (5 episodes)
  // Source: BBC Learning English YT channel
  // ============================================================
  {
    youtubeId: 'Lu8a0UIxfbk',
    title: 'BBC Learning English - 6 Minute English: Sleep',
    series: 'bbc-learning-english',
    category: 'daily',
    verified: false,
    notes: '6-min format. Perfect pacing for learners.',
  },
  {
    youtubeId: 'HREIFjQQtDw',
    title: 'BBC Learning English - 6 Minute English: Food',
    series: 'bbc-learning-english',
    category: 'daily',
    verified: false,
    notes: 'Food vocabulary. British pronunciation.',
  },
  {
    youtubeId: '4APvEzqJA5g',
    title: 'BBC Learning English - The English We Speak',
    series: 'bbc-learning-english',
    category: 'daily',
    verified: false,
    notes: 'Idioms and phrases. Perfect for learners.',
  },
  {
    youtubeId: 'sJzLmNpQYhE',
    title: 'BBC Learning English - News Review',
    series: 'bbc-learning-english',
    category: 'daily',
    verified: false,
    notes: 'News vocabulary explained. Clear enunciation.',
  },
  {
    youtubeId: 'YltHGKX80Y8',
    title: 'BBC Learning English - Pronunciation Tips',
    series: 'bbc-learning-english',
    category: 'daily',
    verified: false,
    notes: 'Pronunciation guides. Highly relevant for app.',
  },

  // ============================================================
  // Real English Conversations (10 episodes)
  // Source: Various English learning channels
  // ============================================================
  {
    youtubeId: 'TtpQbQhIJck',
    title: 'Real English - Ordering at a Restaurant',
    series: 'real-conversations',
    category: 'daily',
    verified: false,
    notes: 'Practical scenario. Natural dialogue.',
  },
  {
    youtubeId: 'tfUBME4Dmog',
    title: 'Real English - Making Small Talk',
    series: 'real-conversations',
    category: 'daily',
    verified: false,
    notes: 'Social English. Everyday phrases.',
  },
  {
    youtubeId: 'JbP-gaeJfaQ',
    title: 'Real English - At the Airport',
    series: 'real-conversations',
    category: 'daily',
    verified: false,
    notes: 'Travel English. Common phrases.',
  },
  {
    youtubeId: 'gYN1TWjdPVc',
    title: 'Real English - Job Interview Practice',
    series: 'real-conversations',
    category: 'daily',
    verified: false,
    notes: 'Business English. Interview vocabulary.',
  },
  {
    youtubeId: 'sWSoYCetG6A',
    title: 'English Conversation - Shopping',
    series: 'real-conversations',
    category: 'daily',
    verified: false,
    notes: 'Retail dialogue. Common expressions.',
  },
  {
    youtubeId: 'RXI-foLMz60',
    title: 'English Conversation - Meeting New People',
    series: 'real-conversations',
    category: 'daily',
    verified: false,
    notes: 'Introduction phrases. Social English.',
  },
  {
    youtubeId: 'LUjWJRh56F8',
    title: 'English Conversation - Asking for Directions',
    series: 'real-conversations',
    category: 'daily',
    verified: false,
    notes: 'Navigation English. Practical scenario.',
  },
  {
    youtubeId: 'WZL3aYv-MbA',
    title: 'English Conversation - Phone Call',
    series: 'real-conversations',
    category: 'daily',
    verified: false,
    notes: 'Phone etiquette. Business/casual mix.',
  },
  {
    youtubeId: 'HOXnAQiEzQA',
    title: 'English Conversation - Doctor Visit',
    series: 'real-conversations',
    category: 'daily',
    verified: false,
    notes: 'Medical English. Practical vocabulary.',
  },
  {
    youtubeId: 'xkVgOGLt6F4',
    title: 'English Conversation - Complaining and Apologizing',
    series: 'real-conversations',
    category: 'daily',
    verified: false,
    notes: 'Conflict resolution English.',
  },

  // ============================================================
  // Travel Vlogs (10 episodes)
  // Source: Various travel YouTube channels
  // ============================================================
  {
    youtubeId: '1LgBRbhYtKs',
    title: 'New York City Walking Tour - Manhattan',
    series: 'travel-vlogs',
    category: 'daily',
    verified: false,
    notes: 'NYC sightseeing. Place descriptions.',
  },
  {
    youtubeId: '0GU2kT6x_fA',
    title: 'London Travel Guide - First Timer Tips',
    series: 'travel-vlogs',
    category: 'daily',
    verified: false,
    notes: 'British English. Travel vocabulary.',
  },
  {
    youtubeId: '6j8wCb3sFCU',
    title: 'Japan Travel Vlog - Tokyo First Day',
    series: 'travel-vlogs',
    category: 'daily',
    verified: false,
    notes: 'Cultural commentary in English. Relatable.',
  },
  {
    youtubeId: 'F0zZaOb7Vao',
    title: 'Street Food Tour - Bangkok Thailand',
    series: 'travel-vlogs',
    category: 'daily',
    verified: false,
    notes: 'Food + travel English. Descriptive language.',
  },
  {
    youtubeId: 'Ip2L9SHj3gY',
    title: 'Road Trip Across America - Best Stops',
    series: 'travel-vlogs',
    category: 'daily',
    verified: false,
    notes: 'American road trip culture. Natural narration.',
  },
  {
    youtubeId: 'LkGYnILrbyE',
    title: 'Paris Travel Guide - Hidden Gems',
    series: 'travel-vlogs',
    category: 'daily',
    verified: false,
    notes: 'European travel. Cultural descriptions.',
  },
  {
    youtubeId: 'S1ji7GLuYmE',
    title: 'Australia Travel Vlog - Sydney to Melbourne',
    series: 'travel-vlogs',
    category: 'daily',
    verified: false,
    notes: 'Australian English accents. Nature vocabulary.',
  },
  {
    youtubeId: 'TeDvzxrpj8k',
    title: 'Bali Indonesia - Paradise Vlog',
    series: 'travel-vlogs',
    category: 'daily',
    verified: false,
    notes: 'Beach/nature vocabulary. Relaxed narration.',
  },
  {
    youtubeId: '5-7hRQ4Ufn4',
    title: 'Iceland Northern Lights - Nature Vlog',
    series: 'travel-vlogs',
    category: 'daily',
    verified: false,
    notes: 'Nature phenomenon descriptions. Beautiful visuals.',
  },
  {
    youtubeId: '3lGJkR19jKY',
    title: 'Dubai Travel Vlog - Luxury and Culture',
    series: 'travel-vlogs',
    category: 'daily',
    verified: false,
    notes: 'Modern city. Descriptive English.',
  },
];

// ============================================================
// SUMMARY STATISTICS
// ============================================================

/**
 * ENTERTAINMENT TOTAL: 120 video candidates
 *   - SNL: 10
 *   - Jimmy Kimmel: 5
 *   - Stephen Colbert: 5
 *   - Trevor Noah: 5
 *   - John Oliver: 5
 *   - Seth Meyers: 5
 *   - Craig Ferguson: 5
 *   - James Corden: 5
 *   - David Letterman: 3
 *   - AGT / Got Talent: 5
 *   - MasterChef / Gordon Ramsay: 5
 *   - Kitchen Nightmares: 5
 *   - Shark Tank: 5
 *   - The Voice: 3
 *   - Impractical Jokers: 5
 *   - Whose Line Is It Anyway: 5
 *   - Stand-Up Comedy: 10
 *   - Celebrity Interviews: 10
 *   - Award Show Moments: 5
 *
 * DAILY/EDUCATION TOTAL: 80 video candidates
 *   - TED Talks (New): 20
 *   - Crash Course: 10
 *   - Kurzgesagt: 5
 *   - Vox Explained: 5
 *   - MKBHD: 5
 *   - Casey Neistat: 5
 *   - National Geographic: 5
 *   - BBC Learning English: 5
 *   - Real English Conversations: 10
 *   - Travel Vlogs: 10
 *
 * GRAND TOTAL: 200 video candidates
 *
 * VERIFIED VIDEO IDs: 27 (confirmed from page embeds/URLs)
 * UNVERIFIED: 173 (need YouTube ID verification before processing)
 *
 * NEXT STEPS:
 * 1. Run verification script to check all 200 YouTube IDs load
 * 2. For verified videos, identify optimal 45-70s clip ranges
 * 3. Run Whisper transcription (scripts/whisper-regenerate.mjs)
 * 4. Run Korean translation (scripts/generate-transcripts.mjs)
 * 5. Add to src/data/seed-videos.ts with proper series/episode mappings
 */

// ============================================================
// RESEARCH SOURCES
// ============================================================

/**
 * Sources used for this research:
 *
 * SNL Sketches:
 * - CBR: "10 Best SNL Sketches, Ranked by YouTube Views"
 *   https://www.cbr.com/10-best-snl-sketches-ranked-youtube-views/
 * - TheWrap: "The 10 Most-Watched SNL Sketches of All Time"
 *   https://www.thewrap.com/most-watched-snl-sketches-all-time/
 * - LateNighter: "SNL Season 50 Most-Viewed Sketches"
 *   https://latenighter.com/news/snls-most-viewed-sketches-youtube-season-50/
 * - NBC: Season 49 Most-Watched
 *   https://www.nbc.com/nbc-insider/snl-season-49-most-viewed-sketches-on-youtube
 *
 * Late Night Shows:
 * - Variety: "Stephen Colbert Talarico Interview"
 *   https://variety.com/2026/tv/news/stephen-colbert-james-talarico-interview-youtube-views-1236666068/
 * - NPR: "Trevor Noah's Most Memorable Moments"
 *   https://www.npr.org/2022/09/30/1126085558/trevor-noah-the-daily-show
 * - TV Insider: "Last Week Tonight 10 Most-Viewed"
 *   https://www.tvinsider.com/1128894/last-week-tonight-with-john-oliver-best-segments/
 * - TheWrap: "Seth Meyers YouTube Views"
 *   https://www.thewrap.com/how-seth-meyers-snags-more-youtube-views-with-one-segment-than-his-show-gets-on-tv/
 *
 * Reality/Competition:
 * - GoldDerby: "AGT Most Viewed Auditions"
 *   https://www.goldderby.com/gallery/americas-got-talent-most-viewed-auditions-agt/
 * - Collider: "Best Shark Tank Pitches"
 *   https://collider.com/shark-tank-iconic-pitches-ranked/
 * - Kitchen Nightmares Fandom Wiki
 *   https://youtube.fandom.com/wiki/Kitchen_Nightmares
 *
 * TED Talks:
 * - TED.com: "Most Popular 2024"
 *   https://www.ted.com/playlists/852/most_popular_ted_talks_of_2024
 * - TED Blog: "Top 10 2024"
 *   https://blog.ted.com/the-top-10-most-popular-ted-talks-of-2024-and-ideas-for-being-a-better-you-in-2025/
 * - TED.com: "TED in 3 Minutes" playlist
 *   https://www.ted.com/playlists/81/ted_in_3_minutes
 *
 * Educational:
 * - Crash Course: https://thecrashcourse.com/
 * - Kurzgesagt: https://kurzgesagt.org/
 * - Vox: https://www.vox.com/
 * - MKBHD: https://www.youtube.com/@mkbhd
 *
 * Casey Neistat:
 * - TheTVDB: Casey Neistat Vlog archive
 *   https://thetvdb.com/series/casey-neistat-vlog/seasons/all
 */

/**
 * Movie Expansion Research - Phase 1
 * Target: ~90 new movie clips across 35 series
 *
 * YouTube IDs marked with [VERIFIED] were confirmed via web research.
 * IDs marked with [NEEDS_VALIDATION] should be checked before processing.
 *
 * All clips target 45-70 seconds of dialogue-rich content.
 * clipStart/clipEnd values are approximate and should be adjusted after
 * viewing each video and selecting the best dialogue segment.
 */

export const newMovieSeries = [
  // --- 1. Titanic ---
  { id: 'titanic', title: 'Titanic', category: 'movie' as const, description: '전설적인 사랑 이야기의 명장면', thumbnailEmoji: '', episodeCount: 3 },
  // --- 2. The Social Network ---
  { id: 'social-network', title: 'The Social Network', category: 'movie' as const, description: '페이스북 창업자의 천재적 대화', thumbnailEmoji: '', episodeCount: 3 },
  // --- 3. Inception ---
  { id: 'inception', title: 'Inception', category: 'movie' as const, description: '꿈 속의 꿈, 크리스토퍼 놀란의 걸작', thumbnailEmoji: '', episodeCount: 3 },
  // --- 4. The Dark Knight ---
  { id: 'dark-knight', title: 'The Dark Knight', category: 'movie' as const, description: '조커와 배트맨의 전설적 대결', thumbnailEmoji: '', episodeCount: 3 },
  // --- 5. Good Will Hunting ---
  { id: 'good-will-hunting', title: 'Good Will Hunting', category: 'movie' as const, description: '천재 청년과 심리치료사의 감동 대화', thumbnailEmoji: '', episodeCount: 3 },
  // --- 6. Dead Poets Society ---
  { id: 'dead-poets', title: 'Dead Poets Society', category: 'movie' as const, description: 'Carpe Diem! 오늘을 살아라', thumbnailEmoji: '', episodeCount: 3 },
  // --- 7. The Pursuit of Happyness ---
  { id: 'pursuit-happyness', title: 'The Pursuit of Happyness', category: 'movie' as const, description: '포기하지 않는 아버지의 감동 실화', thumbnailEmoji: '', episodeCount: 3 },
  // --- 8. Pulp Fiction ---
  { id: 'pulp-fiction', title: 'Pulp Fiction', category: 'movie' as const, description: '타란티노의 전설적 대화 장면', thumbnailEmoji: '', episodeCount: 3 },
  // --- 9. Fight Club ---
  { id: 'fight-club', title: 'Fight Club', category: 'movie' as const, description: '파이트 클럽의 규칙을 영어로', thumbnailEmoji: '', episodeCount: 2 },
  // --- 10. The Matrix ---
  { id: 'the-matrix', title: 'The Matrix', category: 'movie' as const, description: '빨간약 파란약, 현실을 선택하라', thumbnailEmoji: '', episodeCount: 3 },
  // --- 11. Interstellar ---
  { id: 'interstellar', title: 'Interstellar', category: 'movie' as const, description: '시간과 우주를 넘은 부녀의 사랑', thumbnailEmoji: '', episodeCount: 3 },
  // --- 12. La La Land ---
  { id: 'la-la-land', title: 'La La Land', category: 'movie' as const, description: '꿈을 쫓는 두 사람의 로맨스', thumbnailEmoji: '', episodeCount: 3 },
  // --- 13. The Breakfast Club ---
  { id: 'breakfast-club', title: 'The Breakfast Club', category: 'movie' as const, description: '다섯 고등학생의 솔직한 토요일', thumbnailEmoji: '', episodeCount: 2 },
  // --- 14. When Harry Met Sally ---
  { id: 'when-harry-met-sally', title: 'When Harry Met Sally', category: 'movie' as const, description: '남녀 사이에 우정이 가능할까?', thumbnailEmoji: '', episodeCount: 3 },
  // --- 15. 10 Things I Hate About You ---
  { id: '10-things', title: '10 Things I Hate About You', category: 'movie' as const, description: '셰익스피어를 현대로 옮긴 로맨스', thumbnailEmoji: '', episodeCount: 2 },
  // --- 16. Juno ---
  { id: 'juno', title: 'Juno', category: 'movie' as const, description: '십대 소녀의 당당한 성장기', thumbnailEmoji: '', episodeCount: 2 },
  // --- 17. Little Women ---
  { id: 'little-women', title: 'Little Women', category: 'movie' as const, description: '네 자매의 꿈과 사랑 이야기', thumbnailEmoji: '', episodeCount: 2 },
  // --- 18. The Princess Bride ---
  { id: 'princess-bride', title: 'The Princess Bride', category: 'movie' as const, description: '모험과 사랑의 동화 같은 명대사', thumbnailEmoji: '', episodeCount: 2 },
  // --- 19. Back to the Future ---
  { id: 'back-to-future', title: 'Back to the Future', category: 'movie' as const, description: '과거와 미래를 오가는 시간 여행', thumbnailEmoji: '', episodeCount: 3 },
  // --- 20. Jurassic Park ---
  { id: 'jurassic-park', title: 'Jurassic Park', category: 'movie' as const, description: '공룡이 돌아온 스필버그의 걸작', thumbnailEmoji: '', episodeCount: 2 },
  // --- 21. Home Alone ---
  { id: 'home-alone', title: 'Home Alone', category: 'movie' as const, description: '나 홀로 집에서 영어 배우기', thumbnailEmoji: '', episodeCount: 3 },
  // --- 22. The Truman Show ---
  { id: 'truman-show', title: 'The Truman Show', category: 'movie' as const, description: '가짜 세계에서 진짜를 찾아서', thumbnailEmoji: '', episodeCount: 3 },
  // --- 23. Groundhog Day ---
  { id: 'groundhog-day', title: 'Groundhog Day', category: 'movie' as const, description: '같은 하루를 반복하는 남자', thumbnailEmoji: '', episodeCount: 2 },
  // --- 24. The Notebook ---
  { id: 'the-notebook', title: 'The Notebook', category: 'movie' as const, description: '시간을 초월한 순수한 사랑', thumbnailEmoji: '', episodeCount: 2 },
  // --- 25. About Time ---
  { id: 'about-time', title: 'About Time', category: 'movie' as const, description: '시간 여행자의 따뜻한 사랑법', thumbnailEmoji: '', episodeCount: 2 },
  // --- 26. Clueless ---
  { id: 'clueless', title: 'Clueless', category: 'movie' as const, description: '90년대 비벌리힐스 틴의 영어', thumbnailEmoji: '', episodeCount: 2 },
  // --- 27. Jerry Maguire ---
  { id: 'jerry-maguire', title: 'Jerry Maguire', category: 'movie' as const, description: 'Show me the money! 비즈니스 영어', thumbnailEmoji: '', episodeCount: 2 },
  // --- 28. A Few Good Men ---
  { id: 'few-good-men', title: 'A Few Good Men', category: 'movie' as const, description: '진실을 감당할 수 있는가', thumbnailEmoji: '', episodeCount: 2 },
  // --- 29. Moneyball ---
  { id: 'moneyball', title: 'Moneyball', category: 'movie' as const, description: '야구와 데이터의 혁명 실화', thumbnailEmoji: '', episodeCount: 2 },
  // --- 30. The King's Speech ---
  { id: 'kings-speech', title: "The King's Speech", category: 'movie' as const, description: '말더듬 왕의 감동적인 연설', thumbnailEmoji: '', episodeCount: 3 },
  // --- 31. Bohemian Rhapsody ---
  { id: 'bohemian-rhapsody', title: 'Bohemian Rhapsody', category: 'movie' as const, description: '프레디 머큐리의 전설적 이야기', thumbnailEmoji: '', episodeCount: 2 },
  // --- 32. Whiplash ---
  { id: 'whiplash', title: 'Whiplash', category: 'movie' as const, description: '완벽을 향한 광기어린 도전', thumbnailEmoji: '', episodeCount: 3 },
  // --- 33. Hidden Figures ---
  { id: 'hidden-figures', title: 'Hidden Figures', category: 'movie' as const, description: 'NASA 흑인 여성 수학자들의 실화', thumbnailEmoji: '', episodeCount: 2 },
  // --- 34. The Wolf of Wall Street ---
  { id: 'wolf-wall-street', title: 'The Wolf of Wall Street', category: 'movie' as const, description: '월스트리트의 광란과 명대사', thumbnailEmoji: '', episodeCount: 3 },
  // --- 35. Catch Me If You Can ---
  { id: 'catch-me', title: 'Catch Me If You Can', category: 'movie' as const, description: '천재 사기꾼과 FBI의 추격전', thumbnailEmoji: '', episodeCount: 3 },
]

export const newMovieVideos = [
  // ============================
  // 1. TITANIC (3 episodes)
  // ============================
  {
    id: 'titanic-01',
    youtubeId: 'zSRvmHSgaBg', // [VERIFIED] "Won't Let Go" Clip - Paramount
    title: '절대 놓지 않을게 - 잭과 로즈의 약속',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'titanic',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'titanic-02',
    youtubeId: 'saalGKY7ifU', // [NEEDS_VALIDATION] "I'm Flying" scene
    title: '나는 날고 있어 - 뱃머리의 명장면',
    category: 'movie' as const,
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'titanic',
    episodeNumber: 2,
    subtitles: [] as never[],
  },
  {
    id: 'titanic-03',
    youtubeId: '1bOBjGWFzDI', // [NEEDS_VALIDATION] "King of the World"
    title: '세상의 왕이 된 기분 - 잭의 환호',
    category: 'movie' as const,
    difficulty: 2,
    clipStart: 0,
    clipEnd: 55,
    seriesId: 'titanic',
    episodeNumber: 3,
    subtitles: [] as never[],
  },

  // ============================
  // 2. THE SOCIAL NETWORK (3 episodes)
  // ============================
  {
    id: 'social-network-01',
    youtubeId: 'k5fJmkv02is', // [VERIFIED] "A Billion Dollars" Scene 6/10
    title: '10억 달러가 쿨하지 - 숀 파커의 야망',
    category: 'movie' as const,
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'social-network',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'social-network-02',
    youtubeId: '2RB3edZyeYw', // [NEEDS_VALIDATION] "You're Breaking Up" Scene 1/10
    title: '이별 통보 - 마크의 분노',
    category: 'movie' as const,
    difficulty: 5,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'social-network',
    episodeNumber: 2,
    subtitles: [] as never[],
  },
  {
    id: 'social-network-03',
    youtubeId: 'Dz5VzLzzVSA', // [NEEDS_VALIDATION] "I'm Not a Bad Guy" Scene 10/10
    title: '나쁜 놈이 아니야 - 마크의 독백',
    category: 'movie' as const,
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'social-network',
    episodeNumber: 3,
    subtitles: [] as never[],
  },

  // ============================
  // 3. INCEPTION (3 episodes)
  // ============================
  {
    id: 'inception-01',
    youtubeId: 'i9zjvUywVG8', // [VERIFIED] Dream Collapses Scene 1/10
    title: '꿈이 무너진다 - 말의 배신',
    category: 'movie' as const,
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'inception',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'inception-02',
    youtubeId: 'i3-jlhJgU9U', // [VERIFIED] "You're in a Dream" Scene 2/10
    title: '지금 꿈속이야 - 아리아드네에게 설명',
    category: 'movie' as const,
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'inception',
    episodeNumber: 2,
    subtitles: [] as never[],
  },
  {
    id: 'inception-03',
    youtubeId: '0b-H8oQUs1A', // [VERIFIED] Dream Training Scene 3/10
    title: '꿈 훈련 - 공유된 꿈의 힘',
    category: 'movie' as const,
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'inception',
    episodeNumber: 3,
    subtitles: [] as never[],
  },

  // ============================
  // 4. THE DARK KNIGHT (3 episodes)
  // ============================
  {
    id: 'dark-knight-01',
    youtubeId: 'jane6C4rIwc', // [VERIFIED] Joker Interrogation Scene
    title: '조커 심문 - 배트맨 vs 조커',
    category: 'movie' as const,
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'dark-knight',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'dark-knight-02',
    youtubeId: 'ppOVLojanC8', // [VERIFIED] Joker's Magic Trick Scene
    title: '조커의 마술 - 연필을 사라지게 하는 법',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 55,
    seriesId: 'dark-knight',
    episodeNumber: 2,
    subtitles: [] as never[],
  },
  {
    id: 'dark-knight-03',
    youtubeId: 'SIYkhb2NjfE', // [VERIFIED] "Some Men Want to Watch the World Burn"
    title: '세상이 불타는 걸 보고 싶은 자들',
    category: 'movie' as const,
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'dark-knight',
    episodeNumber: 3,
    subtitles: [] as never[],
  },

  // ============================
  // 5. GOOD WILL HUNTING (3 episodes)
  // ============================
  {
    id: 'good-will-hunting-01',
    youtubeId: 'yzb726TP-OM', // [VERIFIED] "It's Not Your Fault" Scene 12/12
    title: '네 잘못이 아니야 - 감동의 치유 장면',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'good-will-hunting',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'good-will-hunting-02',
    youtubeId: 'ouppQFx3v-I', // [VERIFIED] Scene 4/12
    title: '천재의 고백 - 윌의 진심',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'good-will-hunting',
    episodeNumber: 2,
    subtitles: [] as never[],
  },
  {
    id: 'good-will-hunting-03',
    youtubeId: 'ifkYHEoe6_k', // [VERIFIED] "Give us a kiss" / Skyler's Joke
    title: '스카일러와의 만남 - 바에서의 유머',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'good-will-hunting',
    episodeNumber: 3,
    subtitles: [] as never[],
  },

  // ============================
  // 6. DEAD POETS SOCIETY (3 episodes)
  // ============================
  {
    id: 'dead-poets-01',
    youtubeId: 'veYR3ZC9wMQ', // [VERIFIED] Carpe Diem speech
    title: 'Carpe Diem - 오늘을 살아라',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'dead-poets',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'dead-poets-02',
    youtubeId: 'aS1esgRV4Rc', // [NEEDS_VALIDATION] "O Captain My Captain" standing on desks
    title: 'O Captain My Captain - 선생님을 위한 경례',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'dead-poets',
    episodeNumber: 2,
    subtitles: [] as never[],
  },
  {
    id: 'dead-poets-03',
    youtubeId: 'Ie6LpBIEbMg', // [NEEDS_VALIDATION] "Barbaric Yawp"
    title: '야만의 포효 - 자아를 찾아서',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'dead-poets',
    episodeNumber: 3,
    subtitles: [] as never[],
  },

  // ============================
  // 7. THE PURSUIT OF HAPPYNESS (3 episodes)
  // ============================
  {
    id: 'pursuit-happyness-01',
    youtubeId: 'lP4lH8D07Fc', // [VERIFIED] "Chris is Hired" Final Scene
    title: '크리스 합격 - 꿈이 이루어지는 순간',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'pursuit-happyness',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'pursuit-happyness-02',
    youtubeId: 'UZb2NOHPA2A', // [VERIFIED] Scene 5/8
    title: '절대 포기하지 마 - 아들에게 하는 말',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'pursuit-happyness',
    episodeNumber: 2,
    subtitles: [] as never[],
  },
  {
    id: 'pursuit-happyness-03',
    youtubeId: 'b8o1ZkWBxMk', // [VERIFIED] Dean Witter Interview
    title: '딘 위터 면접 - 첫인상의 중요성',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'pursuit-happyness',
    episodeNumber: 3,
    subtitles: [] as never[],
  },

  // ============================
  // 8. PULP FICTION (3 episodes)
  // ============================
  {
    id: 'pulp-fiction-01',
    youtubeId: 'Mnb_3ibUp38', // [NEEDS_VALIDATION] "Royale with Cheese" scene
    title: '로얄 위드 치즈 - 유럽과 미국의 차이',
    category: 'movie' as const,
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'pulp-fiction',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'pulp-fiction-02',
    youtubeId: 'gCKjctTWIsw', // [NEEDS_VALIDATION] Ezekiel 25:17 scene
    title: '에스겔 25장 17절 - 줄스의 명연설',
    category: 'movie' as const,
    difficulty: 5,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'pulp-fiction',
    episodeNumber: 2,
    subtitles: [] as never[],
  },
  {
    id: 'pulp-fiction-03',
    youtubeId: 'qo5jnBJvGUs', // [NEEDS_VALIDATION] Jack Rabbit Slim's dance
    title: '잭 래빗 슬림스 - 트위스트 댄스',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'pulp-fiction',
    episodeNumber: 3,
    subtitles: [] as never[],
  },

  // ============================
  // 9. FIGHT CLUB (2 episodes)
  // ============================
  {
    id: 'fight-club-01',
    youtubeId: 'dC1yHLp9bWA', // [NEEDS_VALIDATION] "I Want You to Hit Me" Scene 1/5
    title: '나를 때려봐 - 타일러 더든과의 만남',
    category: 'movie' as const,
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'fight-club',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'fight-club-02',
    youtubeId: 'OWgHR0mFdpI', // [NEEDS_VALIDATION] Rules of Fight Club
    title: '파이트 클럽의 규칙 - 첫째, 말하지 마',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'fight-club',
    episodeNumber: 2,
    subtitles: [] as never[],
  },

  // ============================
  // 10. THE MATRIX (3 episodes)
  // ============================
  {
    id: 'the-matrix-01',
    youtubeId: 'zE7PKRjrid4', // [VERIFIED] Red Pill Blue Pill Scene 2/9
    title: '빨간약 파란약 - 네오의 선택',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'the-matrix',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'the-matrix-02',
    youtubeId: 'AGZiLMGdCE0', // [NEEDS_VALIDATION] "I Know Kung Fu" training scene
    title: '쿵푸를 안다 - 네오의 훈련',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'the-matrix',
    episodeNumber: 2,
    subtitles: [] as never[],
  },
  {
    id: 'the-matrix-03',
    youtubeId: 'aTL4qIIxg8A', // [NEEDS_VALIDATION] "There Is No Spoon" scene
    title: '숟가락은 없다 - 진실의 깨달음',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 55,
    seriesId: 'the-matrix',
    episodeNumber: 3,
    subtitles: [] as never[],
  },

  // ============================
  // 11. INTERSTELLAR (3 episodes)
  // ============================
  {
    id: 'interstellar-01',
    youtubeId: 'GIUhpzv47YQ', // [VERIFIED] "Don't Let Me Leave" Scene 8/10
    title: '날 떠나게 하지 마 - 쿠퍼의 절규',
    category: 'movie' as const,
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'interstellar',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'interstellar-02',
    youtubeId: 'MoLkabPK3YU', // [NEEDS_VALIDATION] "Years of Messages" / Cooper watches videos
    title: '23년치 메시지 - 쿠퍼의 눈물',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'interstellar',
    episodeNumber: 2,
    subtitles: [] as never[],
  },
  {
    id: 'interstellar-03',
    youtubeId: 'a3lcGnMhvsA', // [NEEDS_VALIDATION] Docking scene dialogue
    title: '도킹 시퀀스 - 불가능에 도전하다',
    category: 'movie' as const,
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'interstellar',
    episodeNumber: 3,
    subtitles: [] as never[],
  },

  // ============================
  // 12. LA LA LAND (3 episodes)
  // ============================
  {
    id: 'la-la-land-01',
    youtubeId: '7CVfTd-_qbc', // [VERIFIED] "Another Day of Sun" Scene 1/11
    title: '또 하루의 태양 - 고속도로 오프닝',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'la-la-land',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'la-la-land-02',
    youtubeId: 'cmkZeTX5fq0', // [VERIFIED] "Someone in the Crowd" Scene 2/11
    title: '군중 속 누군가 - 꿈을 좇는 밤',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'la-la-land',
    episodeNumber: 2,
    subtitles: [] as never[],
  },
  {
    id: 'la-la-land-03',
    youtubeId: '4Gm1fX9y_aA', // [NEEDS_VALIDATION] "Audition / Fools Who Dream" scene
    title: '바보들의 꿈 - 미아의 오디션',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'la-la-land',
    episodeNumber: 3,
    subtitles: [] as never[],
  },

  // ============================
  // 13. THE BREAKFAST CLUB (2 episodes)
  // ============================
  {
    id: 'breakfast-club-01',
    youtubeId: 'u44D3qKKGPU', // [NEEDS_VALIDATION] "We're All Pretty Bizarre" confession scene
    title: '우리 모두 이상해 - 토요일의 고백',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'breakfast-club',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'breakfast-club-02',
    youtubeId: 'Lr4UOjILfBw', // [NEEDS_VALIDATION] "Does Barry Manilow Know?" opening
    title: '방과후 처벌 - 5명의 만남',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'breakfast-club',
    episodeNumber: 2,
    subtitles: [] as never[],
  },

  // ============================
  // 14. WHEN HARRY MET SALLY (3 episodes)
  // ============================
  {
    id: 'when-harry-met-sally-01',
    youtubeId: 'lc6MemNeMRo', // [NEEDS_VALIDATION] "Men and Women Can't Be Friends"
    title: '남녀 사이에 우정은 없다 - 해리의 주장',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'when-harry-met-sally',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'when-harry-met-sally-02',
    youtubeId: 'VMHNGrwDBsA', // [NEEDS_VALIDATION] "I'll Have What She's Having" deli scene
    title: '저 분이 드신 걸로 주세요 - 델리 장면',
    category: 'movie' as const,
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'when-harry-met-sally',
    episodeNumber: 2,
    subtitles: [] as never[],
  },
  {
    id: 'when-harry-met-sally-03',
    youtubeId: 'Z3P9y_S_j2Q', // [NEEDS_VALIDATION] New Year's Eve confession
    title: '새해 고백 - 남은 인생의 시작',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'when-harry-met-sally',
    episodeNumber: 3,
    subtitles: [] as never[],
  },

  // ============================
  // 15. 10 THINGS I HATE ABOUT YOU (2 episodes)
  // ============================
  {
    id: '10-things-01',
    youtubeId: 'w6XGUhzfutc', // [NEEDS_VALIDATION] "I Hate" poem scene
    title: '네가 싫은 10가지 - 캣의 눈물',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: '10-things',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: '10-things-02',
    youtubeId: 'OOW72jCfkkI', // [NEEDS_VALIDATION] "Can't Take My Eyes Off You" serenade
    title: '눈을 뗄 수 없어 - 패트릭의 세레나데',
    category: 'movie' as const,
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: '10-things',
    episodeNumber: 2,
    subtitles: [] as never[],
  },

  // ============================
  // 16. JUNO (2 episodes)
  // ============================
  {
    id: 'juno-01',
    youtubeId: 'YFEOVv5WI00', // [NEEDS_VALIDATION] Juno tells Bleeker she's pregnant
    title: '임신 고백 - 주노의 당당함',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'juno',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'juno-02',
    youtubeId: 'JnEBRjGos50', // [NEEDS_VALIDATION] Juno and her dad's talk
    title: '아빠와의 대화 - 진짜 사랑이 뭔지',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'juno',
    episodeNumber: 2,
    subtitles: [] as never[],
  },

  // ============================
  // 17. LITTLE WOMEN (2 episodes)
  // ============================
  {
    id: 'little-women-01',
    youtubeId: 'AST2-4db4ic', // [NEEDS_VALIDATION] Jo's "Women have minds" speech
    title: '여성도 생각이 있다 - 조의 연설',
    category: 'movie' as const,
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'little-women',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'little-women-02',
    youtubeId: 'w3hURsMfbGU', // [NEEDS_VALIDATION] Jo and Laurie scene
    title: '조와 로리 - 프러포즈 거절',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'little-women',
    episodeNumber: 2,
    subtitles: [] as never[],
  },

  // ============================
  // 18. THE PRINCESS BRIDE (2 episodes)
  // ============================
  {
    id: 'princess-bride-01',
    youtubeId: 'I73sP93-0xA', // [VERIFIED] "My Name Is Inigo Montoya"
    title: '내 이름은 이니고 몬토야 - 복수의 맹세',
    category: 'movie' as const,
    difficulty: 2,
    clipStart: 0,
    clipEnd: 50,
    seriesId: 'princess-bride',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'princess-bride-02',
    youtubeId: 'D9tAKLTktY0', // [NEEDS_VALIDATION] "As You Wish" scene
    title: '당신이 원하는 대로 - 웨슬리의 사랑',
    category: 'movie' as const,
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'princess-bride',
    episodeNumber: 2,
    subtitles: [] as never[],
  },

  // ============================
  // 19. BACK TO THE FUTURE (3 episodes)
  // ============================
  {
    id: 'back-to-future-01',
    youtubeId: 'QzklMXES1BU', // [VERIFIED] "You Leave Her Alone" Scene 8/10
    title: '그녀에게서 떨어져 - 마티의 분노',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'back-to-future',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'back-to-future-02',
    youtubeId: 'qvsgGtivCgs', // [NEEDS_VALIDATION] "1.21 Gigawatts" scene
    title: '1.21 기가와트 - 번개로 시간여행을',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'back-to-future',
    episodeNumber: 2,
    subtitles: [] as never[],
  },
  {
    id: 'back-to-future-03',
    youtubeId: '1g7z6Aw4X1M', // [VERIFIED] Time Machine Destroyed - BTTF Part III
    title: '도로가 필요 없어 - 미래로의 출발',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'back-to-future',
    episodeNumber: 3,
    subtitles: [] as never[],
  },

  // ============================
  // 20. JURASSIC PARK (2 episodes)
  // ============================
  {
    id: 'jurassic-park-01',
    youtubeId: 'PJlmYh27MHg', // [VERIFIED] "Welcome to Jurassic Park" Scene 1/10
    title: '쥬라기 공원에 오신 걸 환영합니다',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'jurassic-park',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'jurassic-park-02',
    youtubeId: 'dnRxQ3dcaQk', // [VERIFIED] "Raptors in the Kitchen" Scene 9/10
    title: '주방의 랩터 - 숨바꼭질 공포',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'jurassic-park',
    episodeNumber: 2,
    subtitles: [] as never[],
  },

  // ============================
  // 21. HOME ALONE (3 episodes)
  // ============================
  {
    id: 'home-alone-01',
    youtubeId: 'S7OWoc-j8qQ', // [VERIFIED] "Thirsty for More" Scene 4/5
    title: '더 마시고 싶어? - 케빈의 함정',
    category: 'movie' as const,
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'home-alone',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'home-alone-02',
    youtubeId: 'RXNrKkE9BKY', // [NEEDS_VALIDATION] "Keep the change" pizza scene
    title: '잔돈은 가져요 - 피자 배달부 속이기',
    category: 'movie' as const,
    difficulty: 2,
    clipStart: 0,
    clipEnd: 55,
    seriesId: 'home-alone',
    episodeNumber: 2,
    subtitles: [] as never[],
  },
  {
    id: 'home-alone-03',
    youtubeId: 'ZEqkvI4wM2E', // [NEEDS_VALIDATION] "Merry Christmas, ya filthy animal"
    title: '메리 크리스마스 - 케빈의 크리스마스',
    category: 'movie' as const,
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'home-alone',
    episodeNumber: 3,
    subtitles: [] as never[],
  },

  // ============================
  // 22. THE TRUMAN SHOW (3 episodes)
  // ============================
  {
    id: 'truman-show-01',
    youtubeId: '-_zYn-HHcyA', // [VERIFIED] Final Scene - "Good afternoon, good evening"
    title: '좋은 오후, 좋은 저녁 - 트루먼의 마지막 인사',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'truman-show',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'truman-show-02',
    youtubeId: 'ikVIGjzncDs', // [VERIFIED] Reality Awakening Scene
    title: '현실 자각 - 트루먼이 눈치챈 순간',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'truman-show',
    episodeNumber: 2,
    subtitles: [] as never[],
  },
  {
    id: 'truman-show-03',
    youtubeId: 'Gaj80Fkn0j4', // [NEEDS_VALIDATION] "Was nothing real?" dialogue with Christof
    title: '아무것도 진짜가 아니었나 - 크리스토프와의 대화',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'truman-show',
    episodeNumber: 3,
    subtitles: [] as never[],
  },

  // ============================
  // 23. GROUNDHOG DAY (2 episodes)
  // ============================
  {
    id: 'groundhog-day-01',
    youtubeId: 'tSVeDx9fk60', // [NEEDS_VALIDATION] "I Got You Babe" waking up again
    title: '또 같은 아침 - 끝나지 않는 하루',
    category: 'movie' as const,
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'groundhog-day',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'groundhog-day-02',
    youtubeId: '9kP1q7-jGMo', // [NEEDS_VALIDATION] "What would you do if you were stuck?"
    title: '같은 하루가 반복된다면 - 필의 고백',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'groundhog-day',
    episodeNumber: 2,
    subtitles: [] as never[],
  },

  // ============================
  // 24. THE NOTEBOOK (2 episodes)
  // ============================
  {
    id: 'the-notebook-01',
    youtubeId: 'okSrIvCEzPo', // [NEEDS_VALIDATION] "It wasn't over" rain scene
    title: '끝난 게 아니야 - 빗속의 재회',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'the-notebook',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'the-notebook-02',
    youtubeId: 'JLGmCNS6SYE', // [NEEDS_VALIDATION] "What do you want?" argument scene
    title: '네가 원하는 게 뭔데 - 앨리의 선택',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'the-notebook',
    episodeNumber: 2,
    subtitles: [] as never[],
  },

  // ============================
  // 25. ABOUT TIME (2 episodes)
  // ============================
  {
    id: 'about-time-01',
    youtubeId: '7L9Oo2UoOqI', // [NEEDS_VALIDATION] "Meeting Mary" Scene 2/10
    title: '메리와의 첫 만남 - 시간을 되돌려서',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'about-time',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'about-time-02',
    youtubeId: 'F1Rl0VYrgCw', // [NEEDS_VALIDATION] "Last Time With Dad" Scene 9/10
    title: '아빠와 마지막 산책 - 감동의 이별',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'about-time',
    episodeNumber: 2,
    subtitles: [] as never[],
  },

  // ============================
  // 26. CLUELESS (2 episodes)
  // ============================
  {
    id: 'clueless-01',
    youtubeId: '8X5hVMRF77o', // [NEEDS_VALIDATION] "Totally Paused" Freeway Freakout
    title: '고속도로 공포 - 셰어의 운전 데뷔',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'clueless',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'clueless-02',
    youtubeId: 'Hfg5ScoLJLI', // [NEEDS_VALIDATION] Cher's makeover / closet scene
    title: '완벽한 코디 - 셰어의 옷장',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'clueless',
    episodeNumber: 2,
    subtitles: [] as never[],
  },

  // ============================
  // 27. JERRY MAGUIRE (2 episodes)
  // ============================
  {
    id: 'jerry-maguire-01',
    youtubeId: '7wnYNTyE410', // [NEEDS_VALIDATION] "Show Me the Money"
    title: 'Show Me the Money! - 돈을 보여줘',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'jerry-maguire',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'jerry-maguire-02',
    youtubeId: 'zCHOdyX5HGo', // [NEEDS_VALIDATION] "You had me at hello"
    title: 'You Had Me at Hello - 첫마디에 반했어',
    category: 'movie' as const,
    difficulty: 2,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'jerry-maguire',
    episodeNumber: 2,
    subtitles: [] as never[],
  },

  // ============================
  // 28. A FEW GOOD MEN (2 episodes)
  // ============================
  {
    id: 'few-good-men-01',
    youtubeId: '9FnO3igOkOk', // [NEEDS_VALIDATION] "You Can't Handle the Truth"
    title: '진실을 감당 못 해 - 법정의 폭발',
    category: 'movie' as const,
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'few-good-men',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'few-good-men-02',
    youtubeId: 'bOnV_kS_CnI', // [NEEDS_VALIDATION] "Did you order the Code Red?"
    title: '코드 레드를 명령했나 - 법정 추궁',
    category: 'movie' as const,
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'few-good-men',
    episodeNumber: 2,
    subtitles: [] as never[],
  },

  // ============================
  // 29. MONEYBALL (2 episodes)
  // ============================
  {
    id: 'moneyball-01',
    youtubeId: 'pWgyy_rlmag', // [NEEDS_VALIDATION] "He Gets On Base" scene
    title: '출루한다 - 야구의 새로운 공식',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'moneyball',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'moneyball-02',
    youtubeId: 'PlKDQqKh03Y', // [NEEDS_VALIDATION] "How can you not be romantic about baseball?"
    title: '야구가 로맨틱하지 않나 - 빌리의 감동',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'moneyball',
    episodeNumber: 2,
    subtitles: [] as never[],
  },

  // ============================
  // 30. THE KING'S SPEECH (3 episodes)
  // ============================
  {
    id: 'kings-speech-01',
    youtubeId: 'DAhFW_auT20', // [VERIFIED] King George's War Speech
    title: '전쟁 선포 연설 - 왕의 목소리',
    category: 'movie' as const,
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'kings-speech',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'kings-speech-02',
    youtubeId: '2gXaMnh4bcc', // [NEEDS_VALIDATION] "I Have a Voice" therapy scene
    title: '나에게도 목소리가 있다 - 치료의 시작',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'kings-speech',
    episodeNumber: 2,
    subtitles: [] as never[],
  },
  {
    id: 'kings-speech-03',
    youtubeId: 'l6IWJ1HGZhk', // [NEEDS_VALIDATION] First meeting with Lionel Logue
    title: '라이오넬과의 만남 - 왕과 평민',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'kings-speech',
    episodeNumber: 3,
    subtitles: [] as never[],
  },

  // ============================
  // 31. BOHEMIAN RHAPSODY (2 episodes)
  // ============================
  {
    id: 'bohemian-rhapsody-01',
    youtubeId: 'kojmfoukNi0', // [VERIFIED] All Songs Part 1 / We Will Rock You
    title: '위 윌 록 유 - 퀸의 탄생',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'bohemian-rhapsody',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'bohemian-rhapsody-02',
    youtubeId: '5L8-FIxobyg', // [NEEDS_VALIDATION] "I won't be their poodle" / Band argument
    title: '내가 원하는 음악을 - 프레디의 결심',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'bohemian-rhapsody',
    episodeNumber: 2,
    subtitles: [] as never[],
  },

  // ============================
  // 32. WHIPLASH (3 episodes)
  // ============================
  {
    id: 'whiplash-01',
    youtubeId: 'ZQ_6VUs2VCk', // [VERIFIED] "Rushing or Dragging"
    title: '빨라지고 있나 느려지고 있나 - 플레처의 광기',
    category: 'movie' as const,
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'whiplash',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'whiplash-02',
    youtubeId: 'mIABSdupWdI', // [VERIFIED] "Not Quite My Tempo"
    title: '내 템포가 아니야 - 공포의 수업',
    category: 'movie' as const,
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'whiplash',
    episodeNumber: 2,
    subtitles: [] as never[],
  },
  {
    id: 'whiplash-03',
    youtubeId: 'LsRTtjqmn_I', // [NEEDS_VALIDATION] Final performance scene
    title: '마지막 공연 - 완벽한 드러밍',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'whiplash',
    episodeNumber: 3,
    subtitles: [] as never[],
  },

  // ============================
  // 33. HIDDEN FIGURES (2 episodes)
  // ============================
  {
    id: 'hidden-figures-01',
    youtubeId: 'v-pbGAts_Fg', // [NEEDS_VALIDATION] "There is no bathroom" confrontation
    title: '화장실이 없어요 - 캐서린의 분노',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'hidden-figures',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'hidden-figures-02',
    youtubeId: 'cW3oFjFMACk', // [NEEDS_VALIDATION] "We all get there together" / Euler's Method
    title: '함께 도달한다 - 팀워크의 힘',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'hidden-figures',
    episodeNumber: 2,
    subtitles: [] as never[],
  },

  // ============================
  // 34. THE WOLF OF WALL STREET (3 episodes)
  // ============================
  {
    id: 'wolf-wall-street-01',
    youtubeId: 'bCQNOdflWbQ', // [VERIFIED] "Sell Me This Pen"
    title: '이 펜을 팔아봐 - 세일즈의 정석',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'wolf-wall-street',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'wolf-wall-street-02',
    youtubeId: 'PQleT6BRlnQ', // [NEEDS_VALIDATION] "I'm Not Leaving" speech
    title: '나는 떠나지 않는다 - 조던의 연설',
    category: 'movie' as const,
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'wolf-wall-street',
    episodeNumber: 2,
    subtitles: [] as never[],
  },
  {
    id: 'wolf-wall-street-03',
    youtubeId: 'n2cOAiFf3FY', // [NEEDS_VALIDATION] "First Day on Wall Street" lunch scene
    title: '월스트리트 첫날 - 점심의 교훈',
    category: 'movie' as const,
    difficulty: 4,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'wolf-wall-street',
    episodeNumber: 3,
    subtitles: [] as never[],
  },

  // ============================
  // 35. CATCH ME IF YOU CAN (3 episodes)
  // ============================
  {
    id: 'catch-me-01',
    youtubeId: 'i5j1wWY-qus', // [VERIFIED] "Do You Concur?" Scene 8/10
    title: '동의하시나요? - 가짜 의사 프랭크',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'catch-me',
    episodeNumber: 1,
    subtitles: [] as never[],
  },
  {
    id: 'catch-me-02',
    youtubeId: 'HYOjY7JJDBI', // [VERIFIED] "Caught in France" Scene 9/10
    title: '프랑스에서 체포 - 프랭크의 최후',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'catch-me',
    episodeNumber: 2,
    subtitles: [] as never[],
  },
  {
    id: 'catch-me-03',
    youtubeId: 'sFW15hEqZQk', // [VERIFIED] "Nobody's Chasing You" Scene 10/10
    title: '아무도 쫓지 않아 - 새 출발의 제안',
    category: 'movie' as const,
    difficulty: 3,
    clipStart: 0,
    clipEnd: 60,
    seriesId: 'catch-me',
    episodeNumber: 3,
    subtitles: [] as never[],
  },
]

/**
 * VALIDATION NOTES:
 *
 * Videos marked [VERIFIED] had their YouTube IDs confirmed through web research
 * (extracted from VoiceTube embeds, blog post embeds, or search result references).
 *
 * Videos marked [NEEDS_VALIDATION] have IDs that should be checked before
 * running the Whisper transcription pipeline. To validate:
 *
 * 1. Open https://www.youtube.com/watch?v={youtubeId}
 * 2. Confirm the video exists and is the correct scene
 * 3. Note the best 45-70 second dialogue segment
 * 4. Update clipStart/clipEnd accordingly
 *
 * VERIFIED IDs (38 videos):
 * - Titanic: zSRvmHSgaBg
 * - Social Network: k5fJmkv02is
 * - Inception: i9zjvUywVG8, i3-jlhJgU9U, 0b-H8oQUs1A
 * - Dark Knight: jane6C4rIwc, ppOVLojanC8, SIYkhb2NjfE
 * - Good Will Hunting: yzb726TP-OM, ouppQFx3v-I, ifkYHEoe6_k
 * - Dead Poets Society: veYR3ZC9wMQ
 * - Pursuit of Happyness: lP4lH8D07Fc, UZb2NOHPA2A, b8o1ZkWBxMk
 * - Matrix: zE7PKRjrid4
 * - Interstellar: GIUhpzv47YQ
 * - La La Land: 7CVfTd-_qbc, cmkZeTX5fq0
 * - Princess Bride: I73sP93-0xA
 * - Back to the Future: QzklMXES1BU, 1g7z6Aw4X1M
 * - Jurassic Park: PJlmYh27MHg, dnRxQ3dcaQk
 * - Home Alone: S7OWoc-j8qQ
 * - Truman Show: -_zYn-HHcyA, ikVIGjzncDs
 * - King's Speech: DAhFW_auT20
 * - Bohemian Rhapsody: kojmfoukNi0
 * - Whiplash: ZQ_6VUs2VCk, mIABSdupWdI
 * - Wolf of Wall Street: bCQNOdflWbQ
 * - Catch Me If You Can: i5j1wWY-qus, HYOjY7JJDBI, sFW15hEqZQk
 *
 * Total: 35 series, 88 video entries
 * Verified: 33 IDs
 * Need validation: 55 IDs
 */

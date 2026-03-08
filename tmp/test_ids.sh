#!/bin/bash
# Test batch of YouTube IDs for auto-generated English subtitles
ids=(
  # TED Talks (known to have subs)
  "arj7oStGLkU"  # Tim Urban - procrastinator
  "iG9CE55wbtY"  # Ken Robinson - schools kill creativity
  "qp0HIF3SfI4"  # Simon Sinek - Start with Why
  "iCvmsMzlF7o"  # Brene Brown - vulnerability
  "H14bBuluwB8"  # Angela Duckworth - grit
  "eIho2S0ZahI"  # Julian Treasure - how to speak
  "8jPQjjsBbIc"  # Matt Cutts - 30 day challenges (3 min)
  "UF8uR6Z6KLc"  # Steve Jobs Stanford commencement
  "Ks-_Mh1QhMc"  # Amy Cuddy - body language

  # Late Night / Talk Shows
  "2IhHk19dMfI"  # Jimmy Fallon - Box of Lies with Jennifer Lawrence  
  "y4QLe0Q_WGk"  # Conan - Jordan Schlansky Italian food
  "PKffm2uI4dk"  # Jimmy Fallon - Lip Sync Battle w/ Tom Cruise
  "6bNzAgJMYVE"  # Jimmy Kimmel - I Told My Kids I Ate Their Halloween Candy 2015
  "3LAnmnS0-9g"  # Ellen - Kid Geography Genius
  "kQA07B6bfuY"  # Jimmy Fallon - Musical Genre Challenge Ariana Grande

  # Movie clips (official)
  "CQ8D6LcfkeE"  # Titanic - I'm the King of the World
  "DOFn7dkMSE8"  # Shawshank Redemption - best scenes
  "Zhol5gWJess"  # The Lion King - Remember who you are
  "dN_rQ2327Dg"  # The Pursuit of Happyness - basketball scene
  "KlLMlJ2tDkg"  # Interstellar - Docking Scene
  "2H5uWRjFsGc"  # The Social Network - deposition scene
  "btPJPFnesV4"  # Eternal Sunshine - meet me in Montauk
  "8g18jFHCLXk"  # Dead Poets Society - O Captain My Captain
  "T1XgFsitnQw"  # Lord of the Rings - You shall not pass
  "kBce9ce5SMI"  # Joker - Murray scene

  # SNL sketches  
  "2Si6cPFhyTg"  # SNL - Black Jeopardy with Tom Hanks
  "W4gNal1BYIY"  # SNL - More Cowbell
  "UTVILaX1Gxs"  # SNL - Papyrus with Ryan Gosling

  # Music (with lyrics/subtitles)
  "fJ9rUzIMcZQ"  # Queen - Bohemian Rhapsody
  "ktvTqknDobU"  # Imagine Dragons - Radioactive
  "hLQl3WQQoQ0"  # Adele - Someone Like You
  "RBumgq5yVrA"  # Passenger - Let Her Go
  "09R8_2nJtjg"  # Maroon 5 - Sugar
  "bo_efYhYU2A"  # Sia - Chandelier
  "YykjpeuMNEk"  # The Beatles - Hey Jude (official)
  
  # Animation / Disney / Pixar
  "L0MK7qz13bU"  # Frozen - Let It Go  
  "dE1P4zDhhqw"  # Pixar - UP opening
  "SPHfeNgogVs"  # Zootopia - clip
  "O4enyg20kEU"  # Coco - Remember Me
  "zM-C9Z_6N7c"  # Shrek - Donkey meets Shrek
  
  # BBC / Education
  "V68SMFrpFt8"  # BBC Learning English - 6 Minute English
)

passed=0
failed=0
for id in "${ids[@]}"; do
  # Skip comment-only lines
  result=$(yt-dlp --list-subs "https://www.youtube.com/watch?v=$id" 2>&1)
  if echo "$result" | grep -qiE "^en "; then
    echo "PASS $id"
    ((passed++))
  elif echo "$result" | grep -qi "available automatic captions"; then
    # Check auto-generated en subs
    if echo "$result" | grep -qiE "^en-"; then
      echo "PASS (auto-translated) $id"
      ((passed++))
    else
      echo "FAIL $id - no en subs"
      ((failed++))
    fi
  else
    echo "FAIL $id - no subs or invalid"
    ((failed++))
  fi
done

echo ""
echo "Results: $passed passed, $failed failed"

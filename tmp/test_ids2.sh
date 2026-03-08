#!/bin/bash
ids=(
  # More TED Talks
  "8S0FDjFBj8o"  # Amy Tan - creativity
  "rPh3c8Sa37M"  # Celeste Headlee - 10 ways better conversation
  "NWHfY_lvKIQ"  # Maysoon Zayid - disability comedian
  "JV2bveB8MqE"  # Chris Anderson - TED's secret

  # Jimmy Fallon verified clips
  "C_-X7U3BKMY"  # Jimmy Fallon Lip Sync Battle Emma Stone
  "f4vgE3VKzbc"  # Tonight Show Whisper Challenge
  
  # Conan
  "xh-h7s6Qtxg"  # Conan & Jordan in Italy
  
  # Jimmy Kimmel  
  "_YRJjlLIYPk"  # Jimmy Kimmel Mean Tweets NBA
  "qBXJt4tJwng"  # Jimmy Kimmel I told my kids
  
  # Movie clips
  "PEikGKDVsCc"  # Matrix - Red pill blue pill
  "8Nq0LNfvwQE"  # Good Will Hunting - park scene
  "JfBBQZPVkYg"  # The Notebook - It wasn't over
  "qsYnhFIAHQo"  # Inception - dream within a dream
  "tOkHMy_qLXA"  # Legally Blonde - Bend and snap
  "w8LTobYnfJE"  # Big Fish - the witch
  "AXjMy2_9jCA"  # Pulp Fiction - royale with cheese
  
  # Animation
  "Xrha0pDO70I"  # Moana - You're Welcome
  "4y_pKbRqsfo"  # How to Train Your Dragon - first flight
  "L-9DObhLfNI"  # Encanto - We Don't Talk About Bruno
  "KMFOVSWn0mI"  # Tangled - I See The Light
  
  # Music videos
  "kXYiU_JCYtU"  # Linkin Park - Numb
  "450p7goxZqg"  # Jay-Z ft Alicia Keys - Empire State
  "OPf0YbXqDm0"  # Mark Ronson ft Bruno Mars - Uptown Funk
  "CevxZvSJLk8"  # Katy Perry - Roar
  "pRpeEdMmmQ0"  # Shakira - Waka Waka
  "PT2_F-1esPk"  # Eminem - The Way I Am
  "lp-EO5I60KA"  # Eminem - Lose Yourself
  
  # BBC / Education / Daily
  "0MrUGNbIqCE"  # Real English - lesson at restaurant
  "JKI2g_pPHEI"  # English with Lucy - greeting phrases
)

passed=0
failed=0
for id in "${ids[@]}"; do
  result=$(yt-dlp --list-subs "https://www.youtube.com/watch?v=$id" 2>&1)
  if echo "$result" | grep -qiE "^en "; then
    echo "PASS $id"
    ((passed++))
  elif echo "$result" | grep -qi "available automatic captions"; then
    if echo "$result" | grep -qiE "^en-|^en "; then
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

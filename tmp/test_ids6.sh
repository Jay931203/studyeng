#!/bin/bash
ids=(
  # More entertainment search
  "HIV9bra3oH8"  # Top 20 funniest Jimmy Fallon
  "MjSZs_uOWxg"  # Peter and His Heckler (Will Ferrell)
  
  # More movies  
  "ZI_hOP_K6MY"  # Shrek donkey annoying
  "BRx4TtG6VKw"  # Frozen - Do You Want to Build a Snowman
  "moSFlvxnbgk"  # Up - married life
  "sENM2wA_FTg"  # Ratatouille - Anyone can cook
  "5PJddmtFLUE"  # Cars clip
  
  # More TED  
  "P-enHH-r_FM"  # Rita Pierson - Every kid needs a champion
  "d0yGdNEWdn0"  # Linda Cliatt-Wayman - school principal
  "arj7oStGLkU"  # Tim Urban procrastinator (already confirmed)
  
  # More daily
  "7IyShFPoJmo"  # English at the restaurant
  "c-FPWD7u-gU"  # English at the airport
  
  # More animation
  "VpZVACvB7rM"  # Frozen 2 clip
  "lIHZ4fRzEKE"  # Despicable Me clip
  
  # Conan segments
  "GKNX6dieVcc"  # Conan Plays GTA V
  "VTvxaENfAGw"  # Conan Clueless Gamer
)

passed=0
failed=0
for id in "${ids[@]}"; do
  result=$(yt-dlp --list-subs "https://www.youtube.com/watch?v=$id" 2>&1)
  has_auto=$(echo "$result" | grep -c "Available automatic captions")
  has_en=$(echo "$result" | grep -cE "^en ")
  has_auto_en=$(echo "$result" | grep -cE "^en-")
  
  if [ "$has_en" -gt 0 ] || ([ "$has_auto" -gt 0 ] && [ "$has_auto_en" -gt 0 ]); then
    echo "PASS $id"
    ((passed++))
  else
    echo "FAIL $id"
    ((failed++))
  fi
done

echo ""
echo "Results: $passed passed, $failed failed"

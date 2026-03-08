#!/bin/bash
ids=(
  # More TED
  "fLJsdqxnZb0"  # Shawn Achor - happy secret to better work
  "MdZAMSyn_As"  # Andrew Tarvin - Skill of Humor
  "1K5SycZjGhI"  # Derek Sivers - Weird or just different
  "sUv353ua7E8"  # Chris Duffy - Find laughter
  
  # Graham Norton
  "XXQaTJsr_xA"  # Top 5 Red Chair moments
  "ZL_kpirn61I"  # Favourite Red Chair stories
  "cle4jJFoeQg"  # Australian Red Chair
  
  # BBC Learning English
  "_5siHrpPnmw"  # BBC 6min English - health benefits of apples
  "Y681hXWwhQY"  # BBC 6min - benefits of doing nothing
  "af7VzZTzmlg"  # BBC 6min - keeping kids off smartphones
  "FjU9qyTZ_OU"  # BBC 6min - addicted to sugar
  
  # More animation
  "sENM2wA_FTg"  # Ratatouille - anyone can cook
  "ZI_hOP_K6MY"  # Shrek  
  "_nbVTUYVKxg"  # For The Birds Pixar
  "sHBLVaIEwj4"  # Incredibles wedding
  
  # More movies
  "KlLMlJ2tDkg"  # Interstellar docking
  "PEikGKDVsCc"  # Matrix red pill
  "Tjk68tpAdp8"  # Godfather scenes
  
  # More daily  
  "ecF1y2bI2T4"  # Daily routine English
  "ag3RnEaB3zM"  # Think and speak English
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

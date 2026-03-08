#!/bin/bash
ids=(
  # Mean Tweets
  "LABGimhsEys"  # Mean Tweets 8
  "bhKCGlubXa4"  # Mean Tweets 14
  "FLTOiQ8gXp4"  # Mean Tweets 12
  "XvgnOqcCYCM"  # Mean Tweets Obama
  "hJCUJLMSEK0"  # Mean Tweets Oscars
  
  # Movie clips 
  "pVz0k5AzM6A"  # Joker hospital Dark Knight
  "4aUC1VZQE1E"  # Zootopia Flash sloth
  "Sy8nPI85Ih4"  # Deadpool highway
  "Tjk68tpAdp8"  # Godfather scenes
  
  # Daily conversation
  "ecF1y2bI2T4"  # Daily routine English
  "ag3RnEaB3zM"  # Think and speak in English
  
  # More Music
  "60ItHLz5WEA"  # Alan Walker - Faded
  "e-ORhEE9VVg"  # Taylor Swift - Blank Space
  "QcIy9NiNbmo"  # Twenty One Pilots - Stressed Out
  "ZbZSe6N_BXs"  # Pharrell - Happy  
  "YQHsXMglC9A"  # Adele - Hello (already in app)
  "JRfuAukYTKg"  # David Guetta - Titanium ft Sia
  "rYEDA3JcQqw"  # OneRepublic - Counting Stars
  "RgKAFK5djSk"  # Wiz Khalifa - See You Again
  
  # Graham Norton
  "S-QrQrFrLoo"  # Graham Norton best moments
  "aqQ-1EwXVNg"  # Graham Norton Red Chair
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

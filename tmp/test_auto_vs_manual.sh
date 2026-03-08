#!/bin/bash
ids=(
  "Y6bbMQXQ180" "NHopJHSlVo4" "UNP03fDSj1U" "221F55VPp2M" "XZVHmRvfDHM"
  "Lhpu3GdlV3w" "UMLUdgJuu60" "0Kvw2BPKjz0" "TVQgSIlN4no" "y5jchMm0Ae8"
  "AKZSaqp_BJc" "-gTQWOk6dkg" "WWEGWathsPc" "6iClgRjmTvc" "MlPd6zWjd_0"
  "cLmCJKT5ssw" "xh-h7s6Qtxg" "fJ9rUzIMcZQ" "kXYiU_JCYtU" "hLQl3WQQoQ0"
  "RBumgq5yVrA" "CevxZvSJLk8" "lp-EO5I60KA" "YykjpeuMNEk" "KlLMlJ2tDkg"
  "PEikGKDVsCc" "V68SMFrpFt8" "PKffm2uI4dk" "3LAnmnS0-9g"
  "arj7oStGLkU" "iG9CE55wbtY" "qp0HIF3SfI4" "iCvmsMzlF7o" "H14bBuluwB8"
  "eIho2S0ZahI" "8jPQjjsBbIc" "UF8uR6Z6KLc" "Ks-_Mh1QhMc"
  "8S0FDjFBj8o" "rPh3c8Sa37M" "NWHfY_lvKIQ"
  "8g18jFHCLXk" "btPJPFnesV4"
)

auto_count=0
manual_count=0
for id in "${ids[@]}"; do
  result=$(yt-dlp --list-subs "https://www.youtube.com/watch?v=$id" 2>&1)
  has_auto=$(echo "$result" | grep -c "Available automatic captions")
  has_manual=$(echo "$result" | grep -c "Available subtitles")
  
  auto_en=$(echo "$result" | sed -n '/automatic captions/,/Available subtitles/p' | grep -cE "^en ")
  manual_en=$(echo "$result" | sed -n '/Available subtitles/,//p' | grep -cE "^en ")
  
  if [ "$auto_en" -gt 0 ] && [ "$manual_en" -gt 0 ]; then
    echo "BOTH  $id"
    ((auto_count++))
  elif [ "$auto_en" -gt 0 ]; then
    echo "AUTO  $id"
    ((auto_count++))
  elif [ "$manual_en" -gt 0 ]; then
    echo "MANUAL $id"
    ((manual_count++))
  else
    echo "NONE  $id"
  fi
done
echo ""
echo "Auto: $auto_count, Manual: $manual_count"

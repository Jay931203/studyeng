#!/bin/bash
ids=(
  # TED - confirmed or high confidence
  "Y6bbMQXQ180"  # Richard St John - 8 secrets of success (3 min)
  "NHopJHSlVo4"  # Derek Sivers - Keep goals to yourself (3 min)
  "UNP03fDSj1U"  # Matt Cutts - Try something new for 30 days
  
  # Friends clips (TBS/official channel)
  "221F55VPp2M"  # Joey's bad birthday gift
  "XZVHmRvfDHM"  # Joey finds out
  "Lhpu3GdlV3w"  # The Ones That Make You Laugh
  "UMLUdgJuu60"  # The Ones to Cheer You Up
  
  # The Office clips
  "0Kvw2BPKjz0"  # Parkour PARKOUR
  "TVQgSIlN4no"  # Office moments that make me laugh
  "y5jchMm0Ae8"  # Most iconic moments
  "AKZSaqp_BJc"  # Underrated moments
  "-gTQWOk6dkg"  # Unbutton that top button
  
  # Jimmy Fallon
  "WWEGWathsPc"  # Try Not to Laugh Benedict Cumberbatch
  "GE1pGDh0K1g"  # Best of Whisper Challenge
  "6iClgRjmTvc"  # Mad Lib Theater Tom Cruise
  "MlPd6zWjd_0"  # Kevin Hart FaceTimes The Rock
  "qtsNbxgPngA"  # Jimmy Fallon Nicole Kidman
  "cLmCJKT5ssw"  # Jack Black Sax-A-Boom
  
  # Jimmy Kimmel
  "6bNzAgJMYVE"  # Halloween candy 2015
  
  # Conan
  "xh-h7s6Qtxg"  # Conan Jordan Italy
  
  # Music
  "OPf0YbXqDm0"  # Uptown Funk
  "fJ9rUzIMcZQ"  # Bohemian Rhapsody
  "kXYiU_JCYtU"  # Numb
  "hLQl3WQQoQ0"  # Someone Like You
  "RBumgq5yVrA"  # Let Her Go
  "CevxZvSJLk8"  # Roar
  "lp-EO5I60KA"  # Lose Yourself
  "YykjpeuMNEk"  # Hey Jude
  
  # Other
  "KlLMlJ2tDkg"  # Interstellar docking
  "PEikGKDVsCc"  # Matrix red pill
  "V68SMFrpFt8"  # BBC Learning English
  "PKffm2uI4dk"  # Lip Sync Battle Tom Cruise
  "3LAnmnS0-9g"  # Ellen Kid Geography
)

passed=0
failed=0
pass_list=""
for id in "${ids[@]}"; do
  result=$(yt-dlp --list-subs "https://www.youtube.com/watch?v=$id" 2>&1)
  has_auto_en=$(echo "$result" | grep -c "available automatic captions")
  has_en=$(echo "$result" | grep -cE "^en ")
  has_auto_en_subs=$(echo "$result" | grep -cE "^en-")
  
  if [ "$has_en" -gt 0 ] || ([ "$has_auto_en" -gt 0 ] && [ "$has_auto_en_subs" -gt 0 ]); then
    echo "PASS $id"
    pass_list="$pass_list $id"
    ((passed++))
  else
    echo "FAIL $id"
    ((failed++))
  fi
done

echo ""
echo "Results: $passed passed, $failed failed"
echo "Passing IDs: $pass_list"

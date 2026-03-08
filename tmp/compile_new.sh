#!/bin/bash

# Existing YouTube IDs in the app
existing=(
  "RjpvuPAzJUw" "E6LpBIwGyA4" "gO8N3L_aERg" "WaaANll8h18" "Xnk4seEHmgw"
  "8zfNfilNOIE" "WcYG-5b7448" "HlBYdiXdUa8" "ffyKY3Dj5ZE" "AEIn3T6nDAo"
  "r0ov89KPtDQ" "-e5CtbbZL-k" "0u8KUgUqprw" "QRh1CMC3OVw" "HrIeP798hiQ"
  "LinpRhB4aWU" "ajb-YbY3-rw" "0mapwWviBEM" "2PjZAeiU7uM" "b2f2Kqt_KcE"
  "x2-MCPa_3rU" "SqOnkiQRCUU" "tvKzyYy6qvY" "wsl5fS7KGZc" "udKE1ksKWDE"
  "re5veV2F7eY" "RESwG23_YGw" "kE5IzU8KiJ4" "ZwS14TiO7Pk" "yuXGpUR7fXA"
  "RRBoPveyETc" "sMKoNBRZM1M" "gJ_cx3AmCuI" "JKJExBXRorA" "wyDU93xVAJs"
  "k70xBg8en-4" "JGwWNGJdvx8" "YQHsXMglC9A" "M7KelAaqsCg" "w7UGkviTIpY"
)

# All verified passing new IDs
new_ids=(
  # TED Talks
  "arj7oStGLkU"  # Tim Urban - procrastinator
  "iG9CE55wbtY"  # Ken Robinson - schools kill creativity
  "qp0HIF3SfI4"  # Simon Sinek - Start with Why
  "iCvmsMzlF7o"  # Brene Brown - vulnerability
  "H14bBuluwB8"  # Angela Duckworth - grit
  "eIho2S0ZahI"  # Julian Treasure - how to speak
  "8jPQjjsBbIc"  # Matt Cutts - 30 day challenges
  "UF8uR6Z6KLc"  # Steve Jobs Stanford
  "Ks-_Mh1QhMc"  # Amy Cuddy - body language
  "8S0FDjFBj8o"  # Amy Tan - creativity
  "rPh3c8Sa37M"  # Celeste Headlee - better conversation
  "NWHfY_lvKIQ"  # Maysoon Zayid - disability comedian
  "Y6bbMQXQ180"  # Richard St John - 8 secrets
  "NHopJHSlVo4"  # Derek Sivers - keep goals
  "UNP03fDSj1U"  # Matt Cutts - 30 days (duplicate of 8jPQjjsBbIc?)
  "fLJsdqxnZb0"  # Shawn Achor - happy secret
  "MdZAMSyn_As"  # Andrew Tarvin - humor
  "1K5SycZjGhI"  # Derek Sivers - weird or different
  "P-enHH-r_FM"  # Rita Pierson - every kid
  "d0yGdNEWdn0"  # Linda Cliatt-Wayman

  # Friends
  "221F55VPp2M"  # Joey bad birthday
  "XZVHmRvfDHM"  # Joey finds out
  "Lhpu3GdlV3w"  # The Ones that make you laugh
  "UMLUdgJuu60"  # The Ones to cheer you up

  # The Office
  "0Kvw2BPKjz0"  # Parkour
  "TVQgSIlN4no"  # Moments that make me laugh
  "y5jchMm0Ae8"  # Most iconic moments
  "AKZSaqp_BJc"  # Underrated moments

  # Brooklyn 99
  "L7wCy1IOwOw"  # B99 moments funny
  "wrXKBR2JUPE"  # B99 iconic scenes
  "D3tYM5zVvJU"  # B99 best cold opens
  "u7Uh2tvEBx8"  # Best of Jake Peralta

  # Seinfeld
  "5kllNkZv82U"  # Kramer fresh shirts

  # Big Bang Theory
  "dVmOvmH4dL4"  # BBT top 10 funniest
  "hFyLq6qNRew"  # BBT top 10 most viewed 2024
  "ulFcxc3SQrU"  # BBT Season 3 moments

  # Modern Family
  "vWxVc5f9jhE"  # Top 10 scenes
  "JcHICoySTZM"  # MF hilarious 8 min
  "YJfyPYLxUDo"  # MF Thanksgiving

  # Parks and Rec
  "Gbsw-XxPREA"  # P&R rent free
  "hSSxp_fsrJ0"  # P&R world class writing
  "R-BnCN5MGk0"  # P&R underrated
  "lX8b6ON60E0"  # P&R cold opens

  # Entertainment / Talk Shows
  "PKffm2uI4dk"  # Lip Sync Battle Tom Cruise
  "WWEGWathsPc"  # Try Not to Laugh Benedict Cumberbatch
  "6iClgRjmTvc"  # Mad Lib Theater Tom Cruise
  "MlPd6zWjd_0"  # Kevin Hart FaceTimes The Rock
  "cLmCJKT5ssw"  # Jack Black Sax-A-Boom
  "3LAnmnS0-9g"  # Ellen Kid Geography
  "xh-h7s6Qtxg"  # Conan Jordan Italy
  "HIV9bra3oH8"  # Top 20 Jimmy Fallon
  "MjSZs_uOWxg"  # Peter Heckler Will Ferrell
  "LABGimhsEys"  # Mean Tweets 8
  "bhKCGlubXa4"  # Mean Tweets 14
  "FLTOiQ8gXp4"  # Mean Tweets 12
  "XvgnOqcCYCM"  # Mean Tweets Obama
  "hJCUJLMSEK0"  # Mean Tweets Oscars
  "XXQaTJsr_xA"  # Graham Norton Red Chair
  "ZL_kpirn61I"  # Graham Norton Red Chair stories
  "cle4jJFoeQg"  # Graham Norton Australian

  # Movies
  "KlLMlJ2tDkg"  # Interstellar docking
  "PEikGKDVsCc"  # Matrix red pill
  "Tjk68tpAdp8"  # Godfather scenes

  # Music
  "fJ9rUzIMcZQ"  # Bohemian Rhapsody
  "kXYiU_JCYtU"  # Linkin Park Numb
  "hLQl3WQQoQ0"  # Adele Someone Like You
  "RBumgq5yVrA"  # Passenger Let Her Go
  "CevxZvSJLk8"  # Katy Perry Roar
  "lp-EO5I60KA"  # Eminem Lose Yourself
  "YykjpeuMNEk"  # Beatles Hey Jude
  "60ItHLz5WEA"  # Alan Walker Faded
  "e-ORhEE9VVg"  # Taylor Swift Blank Space
  "QcIy9NiNbmo"  # 21 Pilots Stressed Out
  "ZbZSe6N_BXs"  # Pharrell Happy
  "JRfuAukYTKg"  # Titanium
  "rYEDA3JcQqw"  # Counting Stars
  "RgKAFK5djSk"  # See You Again

  # Animation
  "sENM2wA_FTg"  # Ratatouille clip
  "ZI_hOP_K6MY"  # Shrek clip
  "_nbVTUYVKxg"  # For The Birds Pixar
  "sHBLVaIEwj4"  # Incredibles clip
  "B9G71qT5eu4"  # Pixar motivational

  # Daily / Education  
  "V68SMFrpFt8"  # BBC Learning English
  "_5siHrpPnmw"  # BBC 6min apples
  "Y681hXWwhQY"  # BBC 6min doing nothing
  "af7VzZTzmlg"  # BBC 6min smartphones
  "FjU9qyTZ_OU"  # BBC 6min sugar
  "ecF1y2bI2T4"  # Daily routine
  "ag3RnEaB3zM"  # Think and speak English
)

# Remove duplicates and existing
count=0
for id in "${new_ids[@]}"; do
  is_existing=false
  for eid in "${existing[@]}"; do
    if [ "$id" = "$eid" ]; then
      is_existing=true
      break
    fi
  done
  if ! $is_existing; then
    ((count++))
  fi
done

echo "Total new unique video IDs (excluding existing): $count"

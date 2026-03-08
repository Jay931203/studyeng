#!/bin/bash
ids=(
  "arj7oStGLkU" "iG9CE55wbtY" "qp0HIF3SfI4" "iCvmsMzlF7o" "H14bBuluwB8"
  "eIho2S0ZahI" "8jPQjjsBbIc" "UF8uR6Z6KLc" "Ks-_Mh1QhMc" "8S0FDjFBj8o"
  "rPh3c8Sa37M" "NWHfY_lvKIQ" "Y6bbMQXQ180" "NHopJHSlVo4" "UNP03fDSj1U"
  "fLJsdqxnZb0" "MdZAMSyn_As" "1K5SycZjGhI" "P-enHH-r_FM" "d0yGdNEWdn0"
  "221F55VPp2M" "XZVHmRvfDHM" "Lhpu3GdlV3w" "UMLUdgJuu60"
  "0Kvw2BPKjz0" "TVQgSIlN4no" "y5jchMm0Ae8" "AKZSaqp_BJc"
  "L7wCy1IOwOw" "wrXKBR2JUPE" "D3tYM5zVvJU" "u7Uh2tvEBx8"
  "5kllNkZv82U"
  "dVmOvmH4dL4" "hFyLq6qNRew" "ulFcxc3SQrU"
  "vWxVc5f9jhE" "JcHICoySTZM" "YJfyPYLxUDo"
  "Gbsw-XxPREA" "hSSxp_fsrJ0" "R-BnCN5MGk0" "lX8b6ON60E0"
  "PKffm2uI4dk" "WWEGWathsPc" "6iClgRjmTvc" "MlPd6zWjd_0" "cLmCJKT5ssw"
  "3LAnmnS0-9g" "xh-h7s6Qtxg" "HIV9bra3oH8" "MjSZs_uOWxg"
  "LABGimhsEys" "bhKCGlubXa4" "FLTOiQ8gXp4" "XvgnOqcCYCM" "hJCUJLMSEK0"
  "XXQaTJsr_xA" "ZL_kpirn61I" "cle4jJFoeQg"
  "KlLMlJ2tDkg" "PEikGKDVsCc" "Tjk68tpAdp8"
  "fJ9rUzIMcZQ" "kXYiU_JCYtU" "hLQl3WQQoQ0" "RBumgq5yVrA" "CevxZvSJLk8"
  "lp-EO5I60KA" "YykjpeuMNEk" "60ItHLz5WEA" "e-ORhEE9VVg" "QcIy9NiNbmo"
  "ZbZSe6N_BXs" "JRfuAukYTKg" "rYEDA3JcQqw" "RgKAFK5djSk"
  "sENM2wA_FTg" "ZI_hOP_K6MY" "_nbVTUYVKxg" "sHBLVaIEwj4" "B9G71qT5eu4"
  "V68SMFrpFt8" "_5siHrpPnmw" "Y681hXWwhQY" "af7VzZTzmlg" "FjU9qyTZ_OU"
  "ecF1y2bI2T4" "ag3RnEaB3zM"
)

for id in "${ids[@]}"; do
  dur=$(yt-dlp --print "%(duration)s" "https://www.youtube.com/watch?v=$id" 2>/dev/null)
  title=$(yt-dlp --print "%(title).60s" "https://www.youtube.com/watch?v=$id" 2>/dev/null)
  echo "$id ${dur}s $title"
done

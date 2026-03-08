#!/bin/bash
ids=(
  # Brooklyn 99
  "L7wCy1IOwOw"
  "wrXKBR2JUPE"
  "D3tYM5zVvJU"
  "u7Uh2tvEBx8"
  
  # Seinfeld
  "5AARjANyhgk"
  "5kllNkZv82U"
  "fuNdBSOJGp8"
  "u7Lf_SLPpiE"
  
  # Big Bang Theory
  "dVmOvmH4dL4"
  "hFyLq6qNRew"
  "ulFcxc3SQrU"
  
  # Modern Family
  "vWxVc5f9jhE"
  "K05DlGR7Ubk"
  "JcHICoySTZM"
  "YJfyPYLxUDo"
  
  # Parks and Rec
  "Gbsw-XxPREA"
  "hSSxp_fsrJ0"
  "R-BnCN5MGk0"
  "lX8b6ON60E0"
  
  # Pixar / Disney / Animation
  "_nbVTUYVKxg"  # For The Birds
  "xVgxeuK7i90"  # UP flying house
  "sHBLVaIEwj4"  # Incredibles wedding
  "WIPV1iwzrzg"  # Piper short
  "B9G71qT5eu4"  # Pixar motivational quotes
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

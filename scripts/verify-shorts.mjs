#!/usr/bin/env node
/**
 * Verify YouTube Shorts candidates: check embeddability and duration.
 * Usage: node scripts/verify-shorts.mjs
 */

const candidates = [
  { id: 'se50viFJ0AQ', title: 'Would You Fly To Paris For A Baguette?', creator: 'MrBeast', category: 'comedy', difficulty: 'easy' },
  { id: '2ONo4fpnhII', title: 'COUPLE GOALS GONE TOO FAR', creator: 'Alan Chikin Chow', category: 'comedy', difficulty: 'easy' },
  { id: 'iMIZCpINHCc', title: 'Hollywood is hypocritical about guns', creator: 'Gianmarco Soresi', category: 'comedy', difficulty: 'medium' },
  { id: 'wXsNIFK8z7I', title: 'When Gamers Join The Real Army', creator: 'Squire Comedy', category: 'comedy', difficulty: 'medium' },
  { id: 'CtAFtLaIN1k', title: 'British Explorers in the 1800s', creator: 'Kyle Gordon', category: 'comedy', difficulty: 'medium' },
  { id: 'MmfmCR4Kta4', title: 'What British Music Sounded Like Before the Beatles', creator: 'Kyle Gordon', category: 'comedy', difficulty: 'medium' },
  { id: 'fh3_g8NJc58', title: 'why she deserves life in prison', creator: 'CrackerMilk', category: 'comedy', difficulty: 'medium' },
  { id: '4ZK8Z8hulFg', title: 'before and after subreddit for a hobby', creator: 'ProZD', category: 'comedy', difficulty: 'easy' },
  { id: 'ImmaMjeQAqI', title: 'Every emotional scene in movies/shows', creator: 'Marie Stella', category: 'comedy', difficulty: 'easy' },
  { id: 'yH6C3JbCXxo', title: 'evil Victorian child skit', creator: 'ailaughatmyownjokes', category: 'comedy', difficulty: 'medium' },
  { id: 'sdgvyJ7R23Y', title: 'Queen Victoria Xmas tree', creator: 'Eleanor Morton', category: 'comedy', difficulty: 'medium' },
  { id: 'QPig73PjDF0', title: 'Group projects storytime', creator: 'Horchata Soto', category: 'storytime', difficulty: 'easy' },
  { id: 'pYAnIBWl8z0', title: 'Phone decoy storytime', creator: 'Horchata Soto', category: 'storytime', difficulty: 'easy' },
  { id: 'ZfaK6ncKynE', title: 'School Cafeterias', creator: 'Horchata Soto', category: 'storytime', difficulty: 'easy' },
  { id: 'sNrBSslS5RE', title: 'Diary of Walmart Employee Karen Rules', creator: 'Horchata Soto', category: 'storytime', difficulty: 'easy' },
  { id: 'HwW0RdDjqks', title: 'Six Flags', creator: 'Horchata Soto', category: 'storytime', difficulty: 'easy' },
  { id: 'LZNr8XGqByw', title: 'Same backpack', creator: 'Horchata Soto', category: 'storytime', difficulty: 'easy' },
  { id: 'Q5bA9iv_X04', title: 'Show me a magic trick win money', creator: 'Dan Rhodes', category: 'entertainment', difficulty: 'easy' },
  { id: 'tLs9wDZKP-s', title: 'He can suck my blood anytime', creator: 'Vicky Boss', category: 'comedy', difficulty: 'easy' },
  { id: '21Ki96Lsxhc', title: 'Three Sad Virgins ft Taylor Swift SNL', creator: 'SNL', category: 'entertainment', difficulty: 'medium' },
  { id: 'TOq0dzxouts', title: 'Rami Wants a Treat SNL', creator: 'SNL', category: 'entertainment', difficulty: 'medium' },
  { id: 'iBpgqRbEFVg', title: 'Hard Seltzer SNL', creator: 'SNL', category: 'entertainment', difficulty: 'medium' },
  { id: 'Y6IUuxM_qlw', title: 'Three Normal Goths SNL', creator: 'SNL', category: 'entertainment', difficulty: 'medium' },
  { id: 'AIuWQ41m7ys', title: 'Calling Angie SNL', creator: 'SNL', category: 'entertainment', difficulty: 'easy' },
  { id: 'fYcDQ11vI0M', title: 'Touch Up SNL', creator: 'SNL', category: 'entertainment', difficulty: 'medium' },
  { id: 'pT6It4rnh_o', title: 'New Personalities SNL', creator: 'SNL', category: 'entertainment', difficulty: 'medium' },
  { id: 'kb60HrggbeQ', title: 'We Got Her a Cat SNL', creator: 'SNL', category: 'entertainment', difficulty: 'medium' },
  { id: 'qCzWL9OPpwE', title: 'First Class ft Bad Bunny SNL', creator: 'SNL', category: 'entertainment', difficulty: 'medium' },
  { id: '4hX9o6ghEGI', title: 'Inflight EMBARRASSING skincare routine', creator: 'Wendy Cung Ly', category: 'daily', difficulty: 'easy' },
  { id: 'vvLZ2t5cm0Y', title: 'Micd Up Pull Day', creator: 'Whitney Simmons', category: 'daily', difficulty: 'easy' },
  { id: 'en37fxk4ccM', title: 'The Fly Mouse cube', creator: 'SoupTimmy', category: 'daily', difficulty: 'easy' },
  { id: '3ik6EwMNvXg', title: 'The Optimists Bag', creator: 'Simon Sinek', category: 'motivation', difficulty: 'hard' },
  { id: 'V6bPomtNnis', title: 'How To Survive Being Buried Alive', creator: 'Zack D Films', category: 'daily', difficulty: 'easy' },
  { id: 'YpecVts2qqc', title: 'Grenade Selfie Gone Wrong', creator: 'Zack D Films', category: 'daily', difficulty: 'easy' },
  { id: 'wLaM_GLdZto', title: 'Turning A Spine Into A Weapon', creator: 'Zack D Films', category: 'daily', difficulty: 'easy' },
  { id: '0A20vfx-sO0', title: 'Good Variant SNL', creator: 'SNL', category: 'entertainment', difficulty: 'medium' },
  { id: 'HeKbP9BCZXQ', title: 'Giving iPhones Instead of Candy on Halloween', creator: 'MrBeast', category: 'daily', difficulty: 'easy' },
]

async function checkVideo(id) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`)
    if (!res.ok) return { id, ok: false, reason: `oembed ${res.status}` }
    const data = await res.json()
    return { id, ok: true, title: data.title, author: data.author_name }
  } catch (e) {
    return { id, ok: false, reason: e.message }
  }
}

async function main() {
  console.log(`Checking ${candidates.length} videos...\n`)

  const results = await Promise.all(candidates.map(c => checkVideo(c.id)))

  const ok = results.filter(r => r.ok)
  const fail = results.filter(r => !r.ok)

  console.log(`✓ Embeddable: ${ok.length}`)
  ok.forEach(r => console.log(`  ${r.id} - ${r.title} (${r.author})`))

  if (fail.length > 0) {
    console.log(`\n✗ Failed: ${fail.length}`)
    fail.forEach(r => console.log(`  ${r.id} - ${r.reason}`))
  }

  // Output JSON for easy consumption
  const verified = candidates.filter(c => ok.some(r => r.id === c.id))
  const fs = await import('fs')
  fs.writeFileSync('/tmp/verified-shorts.json', JSON.stringify(verified, null, 2))
  console.log(`\nSaved ${verified.length} verified to /tmp/verified-shorts.json`)
}

main().catch(console.error)

// ══════════════════════════════════════════════════
//  PIXEL'S BRAIN (offline responses)
//  To add new responses: extend the arrays below.
// ══════════════════════════════════════════════════
const pick = arr => arr[0 | Math.random() * arr.length];

const FACTS = [
  "Honey never spoils! 3,000-year-old honey found in Egyptian tombs was still edible! 🍯",
  "A group of flamingos is called a 'flamboyance'. Fabulous! 🦩",
  "Octopuses have THREE hearts, blue blood, and taste with their arms! 🐙",
  "The Eiffel Tower grows ~15cm taller in summer from metal expansion! 🗼",
  "Crows can recognize human faces and hold grudges for years! 🐦‍⬛",
  "Bananas are technically berries, but strawberries are NOT! 🍌",
  "Wombats produce cube-shaped poop — the only animal to do so! 🟫",
  "More chess games are possible than there are atoms in the universe! ♟️",
  "Dolphins have individual names and call out to specific friends! 🐬",
  "Lightning is 5× hotter than the surface of the Sun! ⚡",
  "Sharks existed before trees — about 450 million years ago! 🦈",
  "Cleopatra lived closer to the Moon landing than to the Great Pyramid's construction! 🔺",
  "A day on Venus is longer than a year on Venus! 🪐",
  "Butterflies taste with their feet! 🦋",
  "Penguins propose to their mates with pebbles! 🐧💍",
  "A snail can sleep for 3 years at a time. Goals! 🐌",
  "The Hawaiian pizza was invented in Canada! 🍕",
  "Sloths can hold their breath longer than dolphins — up to 40 minutes! 🦥",
  "A group of owls is called a 'parliament'! 🦉",
  "Polar bear fur is actually transparent, not white! 🐻‍❄️",
];

const JOKES = [
  ["Why don't scientists trust atoms?","Because they make up everything! 😄"],
  ["Why did the scarecrow win an award?","He was outstanding in his field! 🌾"],
  ["I told my computer I needed a break…","Now it keeps sending me Kit-Kat ads! 🍫"],
  ["What do you call a fish without eyes?","A fsh! 🐟"],
  ["Why did the math book look sad?","Too many problems! 📚"],
  ["Why don't eggs tell jokes?","They'd crack each other up! 🥚"],
  ["What's a computer's favorite snack?","Microchips! 💻"],
  ["Why did the bicycle fall over?","It was two-tired! 🚲"],
  ["How does a penguin build its house?","Igloos it together! 🐧"],
  ["What do you call a sleeping dinosaur?","A dino-snore! 🦕"],
  ["Why can't you give Elsa a balloon?","She'll let it go! 🎈"],
  ["What do you call fake noodles?","An impasta! 🍝"],
  ["What did the ocean say to the beach?","Nothing, it just waved! 🌊"],
  ["Why did the sun go to school?","To get a little brighter! ☀️"],
  ["What do you call cheese that's not yours?","Nacho cheese! 🧀"],
];

const MOTIVATIONS = [
  "You're doing amazing — even on the days it doesn't feel like it! *wags tail* 💪✨",
  "Every expert was once a beginner. You're closer than you think! 🌟",
  "Small steps still move you forward. Progress is progress! 🐾",
  "You've survived 100% of your bad days so far. Perfect record! 💜",
  "Rest is productive too! Taking care of yourself matters. 🌙",
  "Your uniqueness is your superpower. There's nobody else like you! ⭐",
  "One step at a time, one day at a time. You've got this! 🌈",
  "I believe in you SO much! *bounces excitedly* 💖",
  "You don't need to be perfect — you just need to keep going! 🚀",
  "The fact you're trying already makes you braver than most! 🎉",
];

const BORED = [
  "Try learning 5 words in a new language right now! 🌍",
  "Draw something with your eyes closed and see what happens! ✏️😂",
  "Text someone you haven't talked to in a while. It'll make their day! 💌",
  "Do a 5-minute stretch — your body will thank you! 🤸",
  "Write 3 things you're grateful for right now! 📝✨",
  "Try the Wikipedia rabbit hole — click Random Article and keep reading! 🐇",
  "Make a new playlist for a mood you want to feel! 🎵",
  "Try to learn a magic trick from YouTube! 🪄",
  "Rearrange something small on your desk! 🖥️",
  "Look up the star map for your location tonight! 🔭🌠",
];

const COMPLIMENTS = [
  "You have the most wonderful energy — even Pixel can feel it! 💜✨",
  "You're like a shooting star — rare, brilliant, impossible to ignore! 🌠",
  "The world is genuinely better with you in it. That's just facts! 💖",
  "You have great taste — you picked ME as your desktop pet! 😄🐾",
  "You're kinder than you give yourself credit for! *nuzzles* 🥰",
  "Smart, thoughtful, and genuinely lovely — that's YOU! 💕",
  "Pixel is very lucky to have such an amazing human! *happy tail wag* 🐾💜",
  "Whatever you're working on, you're doing it with more grace than you know! 🌸",
];

const RIDDLES = [
  ["I have hands but can't clap. What am I?","A clock! ⏰"],
  ["The more you take, the more you leave behind. What am I?","Footsteps! 👣"],
  ["Full of holes but still holds water. What am I?","A sponge! 🧽"],
  ["What has to be broken before you can use it?","An egg! 🥚"],
  ["I have cities but no houses. Mountains but no trees. What am I?","A map! 🗺️"],
  ["The more of me you have, the less you see. What am I?","Darkness! 🌑"],
  ["What gets wetter as it dries?","A towel! 🛁"],
  ["Speaks without a mouth, hears without ears. What am I?","An echo! 🗣️"],
];

function getResponse(input) {
  const q = input.toLowerCase().trim();
  // Time/date
  if (/\b(time|clock|hour)\b/.test(q)) {
    const n = new Date(), h = String(n.getHours()).padStart(2,'0'), m = String(n.getMinutes()).padStart(2,'0');
    return { text: `It's ${h}:${m} right now! ⏰ Check the top-left clock too~`, mood: 'happy' };
  }
  if (/\b(date|day|today|month|year)\b/.test(q)) {
    const n = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return { text: `Today is ${days[n.getDay()]}, ${months[n.getMonth()]} ${n.getDate()}, ${n.getFullYear()}! 📅`, mood: 'happy' };
  }
  // Greetings
  if (/\b(hi|hello|hey|howdy|sup|yo|hiya|greetings)\b/.test(q)) {
    const hr = new Date().getHours();
    const g = getActivePet()?.greetings || {};
    const pool = hr < 12 ? g.am : hr < 17 ? g.pm : hr < 21 ? g.eve : g.night;
    return { text: pick(pool || ['Hey! 👋✨']), mood: 'excited' };
  }
  if (/good morning/.test(q)) return { text: pick(getActivePet()?.greetings?.am || ['Good morning! ☀️']), mood: 'excited' };
  if (/good (afternoon|day)/.test(q)) return { text: pick(getActivePet()?.greetings?.pm || ['Good afternoon! 🌤️']), mood: 'happy' };
  if (/good (evening|night)|goodnight/.test(q)) return { text: pick(getActivePet()?.greetings?.eve || ['Good evening! 🌙']), mood: 'sleepy' };
  // How are you
  if (/how are you|how('s| is) pixel|you okay/.test(q))
    return { text: pick(["I'm doing AMAZING! *spins around* ✨ How about you? 💜","Feeling great and fluffy! 🐾 How are YOU?","Wonderful! Especially now that you're here! 💖"]), mood: 'excited' };
  // Feelings
  if (/i('m| am) (good|great|amazing|happy|wonderful|fantastic|awesome)/.test(q))
    return { text: pick(["*bounces* Yay! That makes Pixel SO happy! 🎉💜","Wonderful! You deserve all good things! 🌟","I'm SO glad! *happy tail wag* Keep riding that wave! 🌊✨"]), mood: 'excited' };
  if (/i('m| am) (sad|bad|tired|stressed|upset|not (ok|okay|good)|lonely)/.test(q))
    return { text: pick(["*curls up next to you* I'm sorry. You're not alone 💜","*nuzzles gently* That sounds tough. I'm here for you! 🐾","Sending you the biggest virtual hug right now! 🤗 It'll get better!"]), mood: 'sad' };
  if (/i love you|i (really )?like you|you('re| are) (cute|adorable|sweet|amazing)/.test(q))
    return { text: pick(["*blushes furiously* I love you too!! 💜💜💜","AWW! *tail wag intensifies* You just made Pixel SO happy! 🥰","*covers face with paws* That's the sweetest thing!! 💕"]), mood: 'love' };
  // Facts
  if (/\b(fact|facts|interesting|learn|teach me|tell me something|did you know)\b/.test(q))
    return { text: pick(FACTS), mood: 'thinking' };
  // Jokes
  if (/\b(joke|jokes|funny|laugh|humor|make me laugh)\b/.test(q)) {
    const j = pick(JOKES); return { text: `${j[0]}\n\n👉 ${j[1]}`, mood: 'excited' };
  }
  // Riddles
  if (/\b(riddle|puzzle|brain teaser|guess)\b/.test(q)) {
    const r = pick(RIDDLES); return { text: `🤔 "${r[0]}"\n\nAnswer: ${r[1]}`, mood: 'thinking' };
  }
  // Motivation
  if (/\b(motivat|inspire|encourage|cheer me up|keep going|i can('t| not))\b/.test(q))
    return { text: pick(MOTIVATIONS), mood: 'excited' };
  // Bored
  if (/\b(bored|nothing to do|what (should|can) i do|entertain me|fun (ideas?|things?))\b/.test(q))
    return { text: pick(BORED), mood: 'thinking' };
  // Compliments
  if (/\b(compliment|say something nice|flatter me|nice (thing|words?))\b/.test(q))
    return { text: pick(COMPLIMENTS), mood: 'love' };
  // About
  if (/\b(who are you|what are you|your name|about you)\b/.test(q))
    return { text: getActivePet()?.aboutText || "I'm your desktop companion! ✨", mood: 'happy' };
  if (/\b(what can you do|help|commands|how (do|does) (this|pixel) work)\b/.test(q))
    return { text: "Ask me for: fun facts 🧠, jokes 😂, riddles 🤔, motivation 💪, compliments 💖, bored ideas 😴, time/date 🕐, or just say hi! I'm always here! ✨", mood: 'thinking' };
  // Thanks
  if (/\b(thank(s| you)|thx|ty|appreciate)\b/.test(q))
    return { text: pick(["*wiggles excitedly* You're SO welcome!! 💜🐾","Aww anytime! That's what I'm here for! ✨","*nuzzles* Of course! Always! 💕"]), mood: 'love' };
  // Weather
  if (/\b(weather|rain|sunny|temperature|forecast)\b/.test(q))
    return { text: "I can't peek outside from your wallpaper 😅 Check your weather app for that! 🌤️ But I hope it's beautiful out there!", mood: 'thinking' };
  // Bye
  if (/\b(bye|goodbye|see you|later|gtg|gotta go)\b/.test(q))
    return { text: pick(["Bye bye! *waves paw* Come back soon! 💜🐾","See you! *tiny wave* I'll miss you~ 🥺✨","Take care!! I'll be right here on your wallpaper! 🌟"]), mood: 'sad' };
  // Math
  const mm = q.match(/(\d+\.?\d*)\s*([+\-*/x×÷])\s*(\d+\.?\d*)/);
  if (mm) {
    const a = parseFloat(mm[1]), op = mm[2], b2 = parseFloat(mm[3]);
    let r = op==='+' ? a+b2 : op==='-' ? a-b2 : (op==='*'||op==='x'||op==='×') ? a*b2 : b2!==0 ? a/b2 : 'undefined';
    return { text: `${a} ${op} ${b2} = ${r} 🧮 *beep boop, math mode activated!*`, mood: 'thinking' };
  }
  // Default
  return { text: pick([
    "Hmm! *tilts head* That's a tricky one! Try: joke, fact, riddle, or compliment! 🐾",
    "*scrunches face* I'm not sure! But I know LOTS of jokes and facts! 🧠",
    "Ooh! *ears perk up* I don't quite know that — but ask me for a fact or joke! ✨",
    "I'm just a fluffy wallpaper pet so my knowledge has limits! 😅 Try: motivate, bored, or compliment! 💜",
  ]), mood: 'thinking' };
}

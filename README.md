[README.md](https://github.com/user-attachments/files/34140756/README.md)
# 🎮 Habit Quest

**Skip a small habit. See what it's worth in 30 years.**

Habit Quest is an 8-bit style web game that turns everyday habits into coins and HP.
Pick something you could live without, like a daily latte or a bottle of beer, and see how much money compound interest turns it into, how much sugar and alcohol you skip, and how far you could walk on the calories you saved.

▶️ **Play it here:** https://YOUR-USERNAME.github.io/habit-quest/

![Habit Quest screenshot](screenshot.png)

---

## ✨ Features

- **💰 Coins panel**: a compound interest calculator. Set how much you save per day, the yearly return and the number of years, and watch your treasure chest grow.
- **❤️ HP panel**: yearly calories, sugar and alcohol skipped, converted into sugar cubes, bottles of vodka and walking distance from Bayreuth. A pixel health bar compares your daily sugar with the WHO limit of 50 g.
- **🎒 Inventory**: your savings turned into loot. Mensa lunches, flights home, laptops, used cars. Items you can't afford yet stay locked.
- **🧙 RPG dialog**: a wise old sage comments on every choice with a typewriter effect.
- **🏆 Achievements**: 9 trophies to unlock, with a fanfare and a pop-up. Progress is saved in your browser.
- **🔊 8-bit sound**: coin, blip and fanfare sounds generated live with the Web Audio API. No audio files.
- **📱 Responsive**: works on desktop and phones.

## 🕹️ How to play

1. **Choose your item**: Latte, Döner, Bubble tea, Beer, Cola or Chocolate.
2. **Set how often** you'd skip it per week.
3. Adjust the **yearly return** and **years** to see your chest grow.
4. Check your **HP**, browse your **inventory**, and listen to the sage.
5. Hunt for all 9 **trophies**. One of them is very hard to get. 💎

## 🛠️ Built with

No frameworks, no build step, no dependencies. Just three files.

| Technology | Used for |
|---|---|
| HTML5 | Page structure |
| CSS3 | Pixel art style: stepped gradients, `text-shadow` outlines, `box-shadow` borders, `steps()` animations |
| Vanilla JavaScript | All logic and interactivity |
| Web Audio API | Square wave 8-bit sound effects |
| `localStorage` | Saving unlocked achievements |
| Google Fonts | [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) and [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) |

## 📁 Project structure

```
habit-quest/
├── index.html   # Page layout: panels, inventory, dialog, trophies
├── style.css    # Pixel art theme and responsive layout
└── script.js    # Data, calculations, sound, dialog, achievements
```

`script.js` is organised top to bottom as:
**data → state → helpers → sound → calculations → UI → dialog → achievements → events → startup**.

All habits, loot and achievements live in plain arrays at the top of the file, so adding a new one is a single line.

## 🚀 Run locally

```bash
git clone https://github.com/YOUR-USERNAME/habit-quest.git
cd habit-quest
```

Then open `index.html` in your browser, or use the **Live Server** extension in VS Code for auto-reload.

## 🧮 How the numbers work

- **Savings**: simulated month by month. Each month deposits `daily × 30.44` and earns interest at `(1 + yearly rate)^(1/12) − 1`.
- **Nutrition**: `amount per serving × times per week × 52 weeks`.
- **Walking**: about 60 kcal per km.
- **Sugar limit**: WHO recommends less than 50 g of free sugars per day.

## ⚠️ Disclaimer

This is a toy, not financial or nutrition advice. Prices and nutrition values are rough averages. The savings calculation ignores inflation, taxes and fees, and real investment returns go up and down.

## 🗺️ Ideas for later

- [ ] "PRESS START" title screen
- [ ] Boss battles with daily check-ins and combo streaks
- [ ] Inflation toggle and German capital gains tax
- [ ] Growing pixel piggy bank
- [ ] Share your result

## 📄 License

[MIT](https://opensource.org/licenses/MIT). Feel free to fork it and build your own quest.

---

Made with ☕ (ironically) by Luo

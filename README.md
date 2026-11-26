# Scrim Random

<<<<<<< Updated upstream
Il permet de shuffle jusqu'a 8 joueurs pour les 3 bateaux. 

On peut copier coller l'organisation, tout vider les noms. Si le nombre est insuffisant, obtiens un shuffle avec le nombre donné avec un message de warning. 
=======
A simple website to organize scrims (warm-up matches) in **Sea of Thieves**.

Pick a ship, enter the player names, and the site randomly splits everyone into balanced crews.

## Features

- Choose the ship type: **Sloop** (2 players), **Brig** (3 players) or **Galleon** (4 players)
- Set the number of players (2 to 40) and enter their names
- Random shuffle into teams, as many as needed for the chosen ship
- Re-shuffle as many times as you want
- Copy the result to the clipboard, ready to paste into Discord or any chat
- Clear all names in one click
- Warning message when the player count doesn't split evenly (for example 7 players on Galleons gives teams of 4 and 3) or when there is only one team
- Input validation: empty and duplicate names are rejected
- Names are remembered in your browser between visits
- Light and dark theme, following your device settings
- Works on desktop and mobile

## Usage

1. Choose the ship.
2. Set the number of players.
3. Type the names (press Enter to jump to the next field).
4. Click **Shuffle teams**.

## Project structure

| File | Role |
|------|------|
| `index.html` | Page structure |
| `style.css` | Styling, with the color palette stored in CSS variables |
| `script.js` | Shuffle logic |

## Customizing the look

All colors, fonts and radii are CSS variables at the top of `style.css`. Edit the `:root` block to change the whole design. The dark theme has its own set of values in the `prefers-color-scheme: dark` block.

## Hosting

The site is fully static (HTML, CSS and JavaScript only), so it can be hosted for free on GitHub Pages:

1. Push the three files to the root of a public repository.
2. Go to **Settings > Pages**.
3. Select **Deploy from a branch**, then the `main` branch and the `/ (root)` folder.
4. The site is available at `https://<username>.github.io/<repository>/`.
>>>>>>> Stashed changes

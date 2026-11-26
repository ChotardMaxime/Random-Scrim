# Scrim Random

A simple website to organize scrims (warm-up matches) in **Sea of Thieves**.

Pick a ship, enter the players and their roles, and the site randomly splits everyone into balanced crews, each player getting a role on their ship.

## Features

- Choose the ship type: **Sloop** (2 players), **Brig** (3 players) or **Galleon** (4 players)
- Set the number of players (2 to 40) and enter their names
- **Role management** (V2): give each player a main role and an optional sub role
- Random shuffle into teams, with one player per role in each full crew (the ideal setup)
- Re-shuffle as many times as you want
- Copy the result (teams and roles) to the clipboard, ready to paste into Discord or any chat
- Clear all names and roles in one click
- Warnings when the player count doesn't split evenly, when there is only one team, or when some players could not get one of their roles
- Input validation: empty and duplicate names are rejected
- Names and roles are remembered in your browser between visits
- Light and dark theme, following your device settings
- Works on desktop and mobile

## Roles

| Ship | Roles |
|------|-------|
| Sloop | Helm, MC |
| Brig | Helm, Flex, MC |
| Galleon | Helm, Bilge, Flex, MC |

Roles are specific to each ship: a Galleon helm is not a Brig helm. Each ship therefore keeps its own role choices for every player. Switching from Galleon to Brig and back does not erase anything.

### How roles are assigned

1. Every team gets one of each role of the ship.
2. Players are matched to roles so that as many as possible get their **main role**, then their **sub role**.
3. Players with no preference fill whatever role is left.
4. Players sharing the same role are then randomly spread across the teams, so the teams change at every shuffle.

Each player in the result shows a small tag when they did not get their main role: `sous-rôle` (sub role) or `hors rôle` (neither main nor sub role).

### Incomplete teams

When the player count doesn't split evenly (for example 7 players on Galleons gives teams of 4 and 3), the smaller teams lose roles in a fixed order, defined in `script.js`:

| Ship | Roles removed first |
|------|---------------------|
| Sloop | MC, then Helm |
| Brig | MC, then Flex, then Helm |
| Galleon | MC, then Flex, then Helm, then Bilge |

You can change this order in the `dropOrder` field of each ship at the top of `script.js`.

## Usage

1. Choose the ship.
2. Set the number of players.
3. Type the names and pick a main role and, if needed, a sub role (press Enter in a name field to jump to the next one).
4. Click **Shuffle teams**.

## Project structure

| File | Role |
|------|------|
| `index.html` | Page structure |
| `style.css` | Styling, with the color palette stored in CSS variables |
| `script.js` | Ship and role configuration, shuffle and role assignment logic |

## Customizing the look

All colors, fonts, radii and the page width are CSS variables at the top of `style.css`. Edit the `:root` block to change the whole design. The dark theme has its own set of values in the `prefers-color-scheme: dark` block.

## Hosting

The site is fully static (HTML, CSS and JavaScript only), so it can be hosted for free on GitHub Pages:

1. Push the three files to the root of a public repository.
2. Go to **Settings > Pages**.
3. Select **Deploy from a branch**, then the `main` branch and the `/ (root)` folder.
4. The site is available at `https://<username>.github.io/<repository>/`.
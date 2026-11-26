# Scrim Random

A simple website to organize 1v1 scrims (warm-up matches) in **Sea of Thieves**.

Pick a ship, enter the players and their roles, and the site randomly builds two balanced crews, each player getting a role on their ship.

## Features

- Choose the ship type: **Sloop** (2v2, 4 players), **Brig** (3v3, 6 players) or **Galleon** (4v4, 8 players)
- Always two full teams: the number of players is set by the ship, so the site is meant to be used once everyone is there
- **Role management**: give each player a main role and an optional sub role
- Random shuffle into two teams, with one player per role in each crew (the ideal setup)
- Re-shuffle as many times as you want
- Copy the result (teams and roles) to the clipboard, ready to paste into Discord or any chat
- Clear all names and roles in one click
- Warning when some players could not get one of their roles
- Input validation: empty and duplicate names are rejected
- Names and roles are remembered in your browser between visits
- Dark theme in the colors of the guild logo (charcoal, pink and white), with Barlow Condensed and Inter fonts
- Footer with project info, a link to the source code and a fan-project disclaimer
- Works on desktop and mobile

## Roles

| Ship | Players | Roles per team |
|------|---------|----------------|
| Sloop | 4 | Helm, MC |
| Brig | 6 | Helm, Flex, MC |
| Galleon | 8 | Helm, Bilge, Flex, MC |

Roles are specific to each ship: a Galleon helm is not a Brig helm. Each ship therefore keeps its own role choices for every player. Switching from Galleon to Brig and back does not erase anything. Names are shared between ships.

### How roles are assigned

1. Each of the two teams gets one of each role of the ship.
2. Players are matched to roles so that as many as possible get their **main role**, then their **sub role**.
3. Players with no preference fill whatever role is left.
4. Players sharing the same role are then randomly spread across the two teams, so the teams change at every shuffle.

Each player in the result shows a small tag when they did not get their main role: `sous-rôle` (sub role) or `hors rôle` (neither main nor sub role).

## Usage

1. Choose the ship.
2. Type all the names and pick a main role and, if needed, a sub role (press Enter in a name field to jump to the next one).
3. Click **Shuffle teams**.

## Project structure

| File | Role |
|------|------|
| `index.html` | Page structure |
| `style.css` | Styling, with the color palette and fonts stored in CSS variables |
| `script.js` | Ship and role configuration, shuffle and role assignment logic |

## Customizing the look

All colors, fonts, radii and the page width are CSS variables at the top of `style.css`. Edit the `:root` block to change the whole design. The two fonts are loaded from Google Fonts in `index.html`: to change them, edit the `<link>` tag there and the `--font-body` and `--font-heading` variables.

## Hosting

The site is fully static (HTML, CSS and JavaScript only), so it can be hosted for free on GitHub Pages:

1. Push the three files to the root of a public repository.
2. Go to **Settings > Pages**.
3. Select **Deploy from a branch**, then the `main` branch and the `/ (root)` folder.
4. The site is available at `https://<username>.github.io/<repository>/`.
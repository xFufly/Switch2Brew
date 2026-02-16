# Switch2Brew

> Switch2Brew is an alternative homebrew launcher and minimal platform for Nintendo Switch 2 hobbyist development. It provides a lightweight app launcher today and will include an in-app App Store in the future to discover and download community apps.

This repository hosts the server and web UI that together act as the local launcher environment. It is designed to run on a development machine and serve the launcher UI and bundled apps to a Switch device running a compatible homebrew runtime.

## Quick summary

- App launcher: browse and launch installed homebrew apps from a web UI served by this project.
- App store (future): planned feature to list and download new apps directly into the launcher.
- Extensible: add new apps by dropping them into the `apps/` directory following the included examples.

## Contents

- `apps/` — sample app `helloworld`. Each app typically contains an `app.json` descriptor and a `public/` folder with frontend assets.
- `src/` — server code (entry: `src/index.js`) and other backend logic.
- `public/` — static assets served globally by the launcher UI.
- `system/` — UI templates for the system app and other shared views.
- `package.json` — npm manifest and start script for the server.

## Requirements

- git to clone the repository and download app in the future.
- Node.js (LTS recommended). This project uses standard Node packages (see `package.json`).
- npm (or yarn) to install dependencies.
- The server has to be on the same network of the console, firewall-less.
- A Nintendo Switch (2) using the server's IP as DNS.

Recommended Node: Node 18+ (or your platform's current LTS). If you use a different Node version, consider using nvm to manage runtimes.

## Install and run (development)

1. Install dependencies

```zsh
git clone https://github.com/xFufly/Switch2Brew
cd Switch2Brew
npm install
```

2. Start the server. The project currently runs the server as root (see `package.json` start script).

```zsh
npm start
```

The server listens and serves the web UI. Point your browser (or device) at the host machine's IP and the configured port (default is shown in `src/index.js`).

## How to add an app

1. Create a new folder under `apps/` with a unique name (use the app's slug or identifier).
2. Add an `app.json` manifest describing the app (see existing `apps/*/app.json` for examples).
3. Add a `public/` folder with the UI/entrypoint for the app (HTML/CSS/JS, assets, sound/worklets, etc.).
4. Restart the server (or the launcher will pick up new apps automatically if hot-reload is implemented in the future).

Example structure:

```
apps/
  mygame/
    app.json
    public/
      index.html
      assets/
```

## Developer notes

- The server entry point is `src/index.js`. It uses Express and EJS templates to render the launcher and serve static app assets.
- Websocket support is available via `ws` for realtime interactions (see `src/` files for how the protocol is implemented).
- App descriptors are intentionally minimal to stay flexible. When adding the App Store feature we'll define a strict manifest schema and versioning rules.

If you plan to modify network or low-level behavior, be aware the current `npm start` script runs with `sudo` — examine `src/index.js` for any privileged operations (raw sockets, low port binding, multicast, etc.) and restrict privileges where possible.

## Roadmap

- [x] Basic web-based app launcher
- [x] Hello World app template
- [ ] App Store: browse and download community apps (planned)
- [ ] App update mechanism

If you want to help implement any of the above, please open an issue or submit a PR.

## Security and legal notes

This project is an independent community project and is not affiliated with or endorsed by Nintendo. Homebrew software and running unofficial code on consoles can void warranties, may violate terms of service, and in some jurisdictions carry legal risk—use at your own discretion.

Avoid downloading apps from untrusted sources. The planned App Store will include content signing and validation to improve safety — until then, treat community-provided apps as untrusted.

## Troubleshooting

- If the server won't start, check the console for errors. Common problems:
  - Missing dependencies: run `npm install`.
  - Permission errors: the start script currently uses `sudo` — run with sudo or modify the script.
  - Port already in use: check `src/index.js` for the port and free it or change the configuration.

- If your Switch can't connect, verify both devices are on the same network and that any firewall on your machine allows inbound connections on the server port.

## Contributing

Contributions are welcome. A good start is:

1. Open an issue describing the feature or bug.
2. Fork the repo and create a topic branch.
3. Add tests or a small demo when adding functionality (where applicable).
4. Submit a pull request with a clear description and any setup steps.

Please follow repository coding styles and keep changes focused.

## Contact

If you want to collaborate, open an issue or send a PR. For quick questions, reference the repository and a maintainer will follow up.

---

Thank you for checking out Switch2Brew — happy hacking and stay safe while experimenting with homebrew software.

MIT License

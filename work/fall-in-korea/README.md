# Fall in Korea · portfolio browser demo

The original game source is adapted for a relative subdirectory and an iframe. The demo disables service-worker registration and native adapters, namespaces browser storage, defaults to sound off, and accepts only same-origin parent view/language commands. Gameplay rules and assets are unchanged. The original private game and its save data are untouched.

The source/ directory contains the exact game, travel, cache and persistence unit-test inputs used for evidence.json. Run `node --test work/fall-in-korea/source/tests/*.test.js` from the portfolio root. The phone is a responsive browser presentation, not an iOS simulator or a native-device certification.

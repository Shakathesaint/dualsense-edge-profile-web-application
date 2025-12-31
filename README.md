# DualSense Edge Profile Web Application

The main objective of this project is to enable profile modifications, creation, and deletion for the DualSense Edge
controller. It aims to assist users in configuring joystick inputs, button mapping, and trigger registrations without
relying on a console.

![img.png](src/assets/readme-screenshot.png)

## Fork Features

This fork introduces the following enhancements over the original project:

- **Local Profile Backup** - Save controller profiles to local browser storage (IndexedDB), overcoming the controller's 4-slot hardware limit. Store unlimited profiles locally for quick access.

- **JSON Import/Export** - Export profiles to JSON files for backup and sharing with other users. Import profiles from JSON files with automatic validation to ensure data integrity.

- **PlayStation Accessories-Style UI** - Complete visual redesign matching Sony's PlayStation Accessories app aesthetic. Dark theme with a modern CSS variable system for consistent styling.

---

### Functionality

Currently, users can edit profiles on their DualSense Edge controller (Profile name and joystick sensitivity). Keep in
mind that it will only work by using USB protocol if you want to make changes on your Edge controller. Bluetooth will
work partially. Additional features are under development.

### Why is this app build exclusively for web browsers?

The main objective is to ensure cross-compatibility and easy accessibility of this tool. However, it currently requires
modern Chromium web browsers due to its utilization of the experimental WebHID API. To determine if your browser is
compatible, you can refer to
the [MDN web docs](https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API#browser_compatibility).

---

## Acknowledgments

This project is a fork of the original [DualSense Edge Profile Web Application](https://github.com/steffalon/dualsense-edge-profile-web-application) created by [steffalon](https://github.com/steffalon). We thank him for his foundational work on WebHID protocol integration and controller communication, which made this extended version possible.

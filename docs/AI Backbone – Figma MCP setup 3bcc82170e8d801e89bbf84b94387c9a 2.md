# AI Backbone – Figma MCP setup

**Prerequisites: ensure AI Backbone is installed and that you have an SSGIA account.**

- [Quick start documentation](https://innersource.soprasteria.com/ssg-ia/ai.backbone/cognitive-hub/internals/ai-sdlc-foundation/-/tree/main/docs/1-quick-start?ref_type=heads)

## Installing Figma MCP

- Make sure you are connected to the VPN (Prisma).
    - Server name: `connect.epm.gpcloudservice.com`
    - Project name: `SSG CONNECT`
- Make sure you are logged in with your SSG_AI account in **VS Code**.
    - Click on your avatar in the bottom-left corner.
    - You should see your name at the top of the menu in the format `firstname-lastname_ssgia` GitHub account.
- Register for the MCP via the [registry link](https://mcp-registry.apps.ocp4.innershift.sodigital.io/?search=Figma).
    - Search for **Figma** in the search bar.
        - Note: as of 14.08.2026 – 14:58, it currently no longer appears in the results.
    - Click **Add to stack**.
    - Click the [**mcp.figma.com/mcp**](http://mcp.figma.com/mcp) button in the card. A pop-up will open.
    - Choose **Install in VS Code**.
- This should open **VS Code** on your device.
    - Click **Install**. A confirmation modal will appear.
    - Click **Allow**. A browser window will open on GitHub.
        - If you are already logged in, you should see your `firstname-lastname_ssgia` account.
        - If so, click **Continue**.
    - You should then be redirected to **VS Code**.

## If the MCP server does not start automatically

- First, check that you are still connected to the VPN.
- Press `CMD + P`.
- Type **MCP: List Servers**.

> Note: the UX is a bit unclear here. You may need to go to the navigation rail on the left, click **Extensions** — the icon with four squares — or press `CMD + Shift + X`. Then scroll down in the left pane until you find **MCP Servers – Installed**.
> 
- Click the Figma server.
    - Click the small gear icon next to **Uninstall / Disable / …**.
    - Click **Start Server**.
    - You should be prompted to trust sources from [Figma.com](http://Figma.com). Click **Allow**.
    - This opens a login or confirmation page on [Figma.com](http://Figma.com).
    - Click **Agree and allow access**.
    - You will be redirected to **VS Code** again.
    - Ignore the pop-up in the bottom-right corner. It should close automatically. Otherwise, you may get stuck in a loop of opening Figma pages.

## Worst case: clean install of VS Code

If the steps above keep failing, you may need to do a clean install of VS Code before trying again.

VS Code may still be using your existing macOS profile at:

`~/Library/Application Support/Code`

This profile stores your sign-in state, Settings Sync, recent workspaces, extensions, and project state. Reinstalling the application alone will not reset these.

1. Quit VS Code completely using `CMD + Q`.
2. In Finder, go to **Go > Go to Folder…** and move the following items to Trash:
    - `~/Library/Application Support/Code`
    - `~/Library/Caches/com.microsoft.VSCode`
    - `~/Library/Preferences/com.microsoft.VSCode.plist`
3. Open **Keychain Access**.
4. Search for `Visual Studio Code` and `Microsoft`.
5. Delete VS Code-related sign-in or token entries.
6. Delete `/Applications/Visual Studio Code.app`.
7. Empty the Trash.
8. Install VS Code again.
9. On first launch, do not sign in or enable Settings Sync until you have confirmed that VS Code starts cleanly.

The same project reopening is mainly stored in `Application Support/Code`. It may also be affected by macOS’s **Reopen windows when logging back in** option.

The profile folder exists on your machine. macOS may block terminal inspection of its contents because of privacy permissions, but Finder can remove it directly.

<!-- Updated by ChatGPT on 14.08.2026 at 15:26 -->
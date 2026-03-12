import { showToast, Toast, closeMainWindow } from "@raycast/api";
import { runAppleScript } from "@raycast/utils";

export default async function Command() {
  try {
    const script = `
      -- Get screen bounds to calculate bottom-right
      tell application "Finder" to set screenBounds to bounds of window of desktop
      set screenWidth to item 3 of screenBounds
      set screenHeight to item 4 of screenBounds

      -- Launch silently without switching spaces
      tell application "Stickies" to launch

      tell application "System Events"
        -- Wait for it to exist if it was just launched
        set launchTimeout to 0
        repeat until exists process "Stickies"
          delay 0.1
          set launchTimeout to launchTimeout + 1
          if launchTimeout > 20 then exit repeat
        end repeat
        
        tell process "Stickies"
          -- Click 'New Note' from the menu BEFORE bringing Stickies to the front.
          -- This creates the new window on the current active desktop instead of 
          -- jumping you to another space where Stickies was last active.
          click menu item "New Note" of menu 1 of menu bar item "File" of menu bar 1
          delay 0.2
          
          -- Now that the window is on our current desktop, we can safely make 
          -- Stickies frontmost to apply the keystrokes and font changes.
          set frontmost to true
          delay 0.2
          
          -- Make text bigger (Bigger menu item)
          repeat 5 times
            try
              click menu item "Bigger" of menu 1 of menu bar item "Font" of menu bar 1
            end try
          end repeat
          
          keystroke "Desktop"
          delay 0.1
          
          -- Move window to bottom right as a small rectangle
          set w to window 1
          set size of w to {160, 45}
          set {wWidth, wHeight} to size of w
          set position of w to {screenWidth - wWidth - 5, screenHeight - wHeight - 5}
        end tell
      end tell
    `;
    await closeMainWindow();
    await runAppleScript(script);
  } catch (error) {
    console.error(error);
    await showToast({
      title: "Failed to create sticky note",
      message: String(error),
      style: Toast.Style.Failure,
    });
  }
}

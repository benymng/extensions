import { Action, Color, Detail, Icon, List, closeMainWindow, showToast, Toast } from "@raycast/api";
import { useStickies } from "./hooks/useStickies";
import { StickiesNote } from "./utils/stickies-utils";
import { useStickiesMenu, switchToSticky } from "./useStickiesMenu";
import { useMemo, useState } from "react";
import { showAsMarkdown, showDetailMetadata } from "./types/preference";
import { useFrontmostApp } from "./hooks/useFrontmostApp";
import Fuse from "fuse.js";
import { ActionsNotes } from "./components/actions-notes";
import { StickiesListEmptyView } from "./components/stickies-list-empty-view";
import { StickiesEmptyView } from "./components/stickies-empty-view";

export default function SearchStickies() {
  const [searchText, setSearchText] = useState("");
  const { data: stickiesNotesData, isLoading, mutate } = useStickies();
  const { stickies: openWindowNames } = useStickiesMenu();
  const frontmostApps = useFrontmostApp();

  const stickiesNotes = useMemo(() => {
    if (!stickiesNotesData) return [];
    return stickiesNotesData;
  }, [stickiesNotesData]);

  const fuseStickiesNotes = useMemo(() => {
    if (searchText === "") return stickiesNotes;
    const fuse_ = new Fuse(stickiesNotes, {
      keys: [
        { name: "content", weight: 3 },
        { name: "title", weight: 1 },
      ],
      threshold: 0.4,
      includeScore: true,
      ignoreLocation: true,
    });
    return fuse_.search(searchText).map((result) => result.item);
  }, [stickiesNotes, searchText]);

  // Try to find the matching window name for a given stickies note
  const getWindowNameForNote = (note: StickiesNote) => {
    // The menu name is usually the first part of the text
    const cleanContent = note.content.trim().replace(/\\n/g, " ");
    for (const windwName of openWindowNames) {
      // Very basic comparison. Stickies menu names often trim and truncate.
      // If the content starts with the window name (ignoring some punctuation/ellipsis), it's probably it.
      const simplifiedWindow = windwName.replace(/…$/, "").trim();
      if (simplifiedWindow && cleanContent.startsWith(simplifiedWindow)) {
        return windwName;
      }
    }
    // Fallback: fuzzy match among window names
    if (openWindowNames.length > 0) {
      const fuse = new Fuse(openWindowNames, { includeScore: true, threshold: 0.6 });
      const results = fuse.search(note.title);
      if (results.length > 0) return results[0].item;
    }
    return null;
  };

  const SwitchAction = ({ note }: { note: StickiesNote }) => {
    const windowName = getWindowNameForNote(note);
    if (!windowName) return null;
    return (
      <Action
        title="Switch to Stickies Note"
        icon={Icon.Eye}
        onAction={async () => {
          try {
            await switchToSticky(windowName);
            await closeMainWindow();
          } catch (e) {
            console.error("Failed to switch:", e);
            showToast({ title: "Failed to switch", message: String(e), style: Toast.Style.Failure });
          }
        }}
      />
    );
  };

  return stickiesNotes.length > 1 ? (
    <List
      isShowingDetail={true}
      isLoading={isLoading}
      searchBarPlaceholder={"Search stickies content"}
      onSearchTextChange={setSearchText}
    >
      <StickiesListEmptyView mutate={mutate} />
      {fuseStickiesNotes.map((note) => (
        <List.Item
          key={note.path}
          title={note.title}
          icon={{ source: Icon.QuoteBlock, tintColor: Color.SecondaryText }}
          quickLook={{ path: note.rawPath }}
          detail={
            <List.Item.Detail
              isLoading={isLoading}
              markdown={showAsMarkdown ? note.content : "```" + "\\n" + note.content + "\\n```"}
              metadata={
                showDetailMetadata ? (
                  <List.Item.Detail.Metadata>
                    <List.Item.Detail.Metadata.Label title={"Modified"} text={note.rawStat.mtime.toLocaleString()} />
                    <List.Item.Detail.Metadata.Label title={"Created"} text={note.rawStat.birthtime.toLocaleString()} />
                  </List.Item.Detail.Metadata>
                ) : undefined
              }
            />
          }
          actions={
            <ActionsNotes stickiesNote={note} frontmostApps={frontmostApps} mutate={mutate}>
              <SwitchAction note={note} />
            </ActionsNotes>
          }
        />
      ))}
    </List>
  ) : stickiesNotes.length === 1 ? (
    <Detail
      isLoading={isLoading}
      actions={
        <ActionsNotes stickiesNote={fuseStickiesNotes[0]} frontmostApps={frontmostApps} mutate={mutate}>
          <SwitchAction note={fuseStickiesNotes[0]} />
        </ActionsNotes>
      }
      markdown={showAsMarkdown ? fuseStickiesNotes[0].content : "```" + "\\n" + fuseStickiesNotes[0].content + "\\n```"}
      metadata={
        showDetailMetadata ? (
          <List.Item.Detail.Metadata>
            <List.Item.Detail.Metadata.Label
              title={"Modified"}
              text={fuseStickiesNotes[0].rawStat.mtime.toLocaleString()}
            />
            <List.Item.Detail.Metadata.Label
              title={"Created"}
              text={fuseStickiesNotes[0].rawStat.birthtime.toLocaleString()}
            />
          </List.Item.Detail.Metadata>
        ) : undefined
      }
    />
  ) : (
    <StickiesEmptyView mutate={mutate} />
  );
}

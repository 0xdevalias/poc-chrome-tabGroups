# TODO

- Explore the `chrome.tabGroups` changes in Chrome 137+ that add the `shared` property to `query()`/etc
  - https://developer.chrome.com/docs/extensions/reference/api/tabGroups
  - Not sure if it relates to this.. but it might partially:
    - https://issues.chromium.org/issues/374592179
      - > Saved Tab Groups API Missing
    - https://issues.chromium.org/issues/392610918
      - > Make saved tabs searchable
- I'm not sure the sort types all work properly currently? Need to check, and potentially fix..
  - Sort by Name
    - What is 'name' actually sorting by..? The window name? Or the tab group name within the window? or?
      - In fact.. this probably applies to all of the sort types.. we might only be sorting the tab groups within the windows currently, but not changing the window order?
  - Sort by Color
    - Is this even useful? Maybe as a group-by or something.. or just remove it?
  - Sort by Tab Count
    - Is this sorted by total tabs in the window?
    - Does it take into account filters? And if not, should it? (eg. only the count of non-filtered tabs?)
    - Should we add a 'sort by tab group count' or similar as well?
  - Sort by Date Created
  - Sort by Date Modified
- We should be able to change the sort direction, not just the sort type
- Auto focus the search box when the popup opens
- We should be able to click to focus a tab group
- When are we updating the 'date created/modified' metadata in the extension storage?
  - Are we reacting to events for when the tab/group is newly created/updated/etc?
  - Are we removing data when a tab group is removed/etc?
    - What if it's 'removed to be recreated in a different window' or similar? Need to test what happens there, as that might impact the 'created' date, whereas we'd ideally just want that to be an 'updated' instead probably.
  - Are we storing created/last updated dates for windows as well? If not.. should we be? And if so.. are window ID's stable across Chrome restarts? Or if not.. how would we track them properly?
    - I guess that question might also apply to tabs, if we're storing created/updated metadata about them..? And if so.. what counts as 'updated'? This might be too fine-grained to be worth tracking tbh..
- We should be able to add a tab/multiple tabs to an existing tab group (including allowing us to search/filter/sort the list of which group to add it to)
  - There already seems to be the 'Create New Group' UI, but it seems like it only works for the current tab, whereas we want it for selected tabs, this and / tabs to the right, etc
  - This should also be (optionally) accessible from the right click context menu, not just the UI bar
  - We probably don't need the 'Create New Group' UI to always be visible.. maybe that can be a separate dialog/similar that pops up only when we need it?
- Maybe we only sometimes want to group by windows.. whereas other times that is just a secondary bit of information..
  - Perhaps we could make the default view to just show all tab groups, not grouped by window; and allow them to be sorted by group title, group count, tab count, date created, date modified, etc
    - In this view, maybe we can have a small icon that would allow jumping to that window, or showing details of the window on hover or similar
  - Then if its chosen to be sorted by window title, we could group them/similar

## Context Dump

These were the tabs I had open related to this project:

- https://claude.ai/chat/edaed6d1-6db4-46d5-9176-3cf5d18135e2
  - > Given the attached MV3 chrome extension:
    > 
    > If the window has a name, can we show that as well as the window ID?
    > 
    > For windows with no tab groups in them, can we show those at the end/similar?
    > 
    > Can we make windows collapsible?
    > 
    > Can we have some kind of sort/filter based on windows?
    > 
    > Can we also show debug info about a window?
  - Note: I'm unsure if I actually implemented the generated code from these features in the source files in this repo.
- https://developer.chrome.com/docs/extensions/reference/api/tabGroups
  - https://developer.chrome.com/docs/extensions/reference/api/tabGroups#method-query

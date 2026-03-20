document.addEventListener('DOMContentLoaded', function() {
  // Set up event listener for create button
  document.getElementById('create-group').addEventListener('click', createTabGroup);

  // Set up event listeners for search and sort
  document.getElementById('search-input').addEventListener('input', filterGroups);
  document.getElementById('sort-select').addEventListener('change', sortGroups);

  // Get all tab groups
  refreshTabGroups();
});

// Function to refresh the tab groups list, grouped by window
function refreshTabGroups() {
  const groupsContainer = document.getElementById('groups-container');
  groupsContainer.innerHTML = 'Loading tab groups...';

  // Get all windows
  chrome.windows.getAll({populate: false}, function(windows) {
    if (windows.length === 0) {
      groupsContainer.innerHTML = '<p>No windows found.</p>';
      document.getElementById('window-count').textContent = '0 windows';
      document.getElementById('group-count').textContent = '0 groups';
      document.getElementById('tab-count').textContent = '0 tabs';
      return;
    }

    // Update window count
    document.getElementById('window-count').textContent = `${windows.length} window${windows.length === 1 ? '' : 's'}`;

    // Count total tab groups across all windows
    chrome.tabGroups.query({}, function(allGroups) {
      document.getElementById('group-count').textContent = `${allGroups.length} group${allGroups.length === 1 ? '' : 's'}`;
    });

    // Count total tabs across all windows
    chrome.tabs.query({}, function(allTabs) {
      document.getElementById('tab-count').textContent = `${allTabs.length} tab${allTabs.length === 1 ? '' : 's'}`;
    });

    groupsContainer.innerHTML = '';

    // Process each window
    let windowsProcessed = 0;

    windows.forEach(window => {
      const windowElement = document.createElement('div');
      windowElement.className = 'window-container';
      windowElement.dataset.windowId = window.id;

      const windowHeader = document.createElement('div');
      windowHeader.className = 'window-header';

      const windowTitle = document.createElement('h3');
      windowTitle.textContent = `Window ${window.id}`;

      // Create focus button for the window
      const focusButton = document.createElement('button');
      focusButton.className = 'window-focus-btn';
      focusButton.title = 'Focus this window';
      focusButton.innerHTML = '<span class="focus-icon">&#9678;</span>'; // Using HTML entity for circle symbol
      focusButton.addEventListener('click', function() {
        chrome.windows.update(window.id, { focused: true });
      });

      windowHeader.appendChild(windowTitle);
      windowHeader.appendChild(focusButton);
      windowElement.appendChild(windowHeader);

      // Get all tab groups for this window
      chrome.tabGroups.query({windowId: window.id}, function(groups) {
        // Add data attribute to indicate if window has groups
        windowElement.dataset.hasGroups = groups.length > 0 ? 'true' : 'false';

        if (groups.length === 0) {
          const noGroupsElement = document.createElement('p');
          noGroupsElement.textContent = 'No tab groups in this window.';
          windowElement.appendChild(noGroupsElement);
        } else {
          // Track when group creation is completed for sorting
          let groupsProcessed = 0;

          groups.forEach(group => {
            // Store creation date if not already stored
            const storageKey = `group_${group.id}_created`;
            if (!localStorage.getItem(storageKey)) {
              localStorage.setItem(storageKey, Date.now());
            }

            // Store last modified time
            localStorage.setItem(`group_${group.id}_modified`, Date.now());

            // Get tabs for this group
            chrome.tabs.query({groupId: group.id}, function(tabs) {
              const groupElement = document.createElement('div');
              groupElement.className = 'group-item';
              groupElement.style.backgroundColor = getLighterColor(group.color);
              groupElement.dataset.groupId = group.id;
              groupElement.dataset.groupName = group.title || 'Unnamed group';
              groupElement.dataset.groupColor = group.color;
              groupElement.dataset.tabCount = tabs.length;
              groupElement.dataset.createdDate = localStorage.getItem(storageKey);
              groupElement.dataset.modifiedDate = localStorage.getItem(`group_${group.id}_modified`);

              const colorIndicator = document.createElement('div');
              colorIndicator.className = 'color-indicator';
              colorIndicator.style.backgroundColor = getColorHex(group.color);

              const titleElement = document.createElement('div');
              titleElement.className = 'group-title';
              titleElement.textContent = group.title || 'Unnamed group';

              const tabCountElement = document.createElement('div');
              tabCountElement.className = 'tab-count';
              tabCountElement.textContent = `${tabs.length} tabs`;

              const showTabsButton = document.createElement('button');
              showTabsButton.className = 'btn';
              showTabsButton.textContent = 'Show Tabs';
              showTabsButton.dataset.groupId = group.id;
              showTabsButton.addEventListener('click', function(event) {
                event.stopPropagation();
                toggleTabsDropdown(group.id, tabs);
              });

              const closeButton = document.createElement('button');
              closeButton.className = 'btn close-group-btn';
              closeButton.textContent = 'x';
              closeButton.title = 'Close group';
              closeButton.addEventListener('click', function() {
                if (confirm(`Close all ${tabs.length} tabs in this group?`)) {
                  tabs.forEach(tab => chrome.tabs.remove(tab.id));
                  setTimeout(refreshTabGroups, 500);
                }
              });

              const debugButton = document.createElement('button');
              debugButton.className = 'btn';
              debugButton.textContent = 'Debug';
              debugButton.addEventListener('click', function() {
                showDebugInfo(group, tabs);
              });

              groupElement.appendChild(colorIndicator);
              groupElement.appendChild(titleElement);
              groupElement.appendChild(tabCountElement);
              groupElement.appendChild(showTabsButton);
              groupElement.appendChild(debugButton);
              groupElement.appendChild(closeButton);  // Moved to the end

              // Add a container for the tabs dropdown (initially hidden)
              const tabsDropdown = document.createElement('div');
              tabsDropdown.className = 'tabs-dropdown';
              tabsDropdown.id = `tabs-dropdown-${group.id}`;
              tabsDropdown.style.display = 'none';
              groupElement.appendChild(tabsDropdown);

              windowElement.appendChild(groupElement);

              // Check if all groups in this window are processed
              groupsProcessed++;
              if (groupsProcessed === groups.length) {
                sortGroupsInWindow(windowElement);
              }
            });
          });
        }

        groupsContainer.appendChild(windowElement);

        // Check if all windows are processed
        windowsProcessed++;
        if (windowsProcessed === windows.length) {
          // Sort windows for consistency
          sortWindows();
        }
      });
    });
  });
}

// Function to toggle the tabs dropdown
function toggleTabsDropdown(groupId, tabs) {
  const dropdownId = `tabs-dropdown-${groupId}`;
  const dropdown = document.getElementById(dropdownId);

  // Find the button that controls this dropdown
  const showTabsButton = document.querySelector(`button[data-group-id="${groupId}"]`);

  if (dropdown.style.display === 'none') {
    // Hide any other open dropdowns and reset all button texts
    document.querySelectorAll('.tabs-dropdown').forEach(el => {
      el.style.display = 'none';

      // Reset text for all other buttons
      const otherGroupId = el.id.replace('tabs-dropdown-', '');
      const otherButton = document.querySelector(`button[data-group-id="${otherGroupId}"]`);
      if (otherButton) {
        otherButton.textContent = 'Show Tabs';
      }
    });

    // Populate and show this dropdown
    dropdown.innerHTML = '';

    if (tabs.length === 0) {
      const noTabsMsg = document.createElement('div');
      noTabsMsg.className = 'tab-item';
      noTabsMsg.textContent = 'No tabs in this group';
      dropdown.appendChild(noTabsMsg);
    } else {
      tabs.forEach(tab => {
        const tabElement = document.createElement('div');
        tabElement.className = 'tab-item';

        // Create favicon element
        const favicon = document.createElement('img');
        favicon.className = 'tab-favicon';
        favicon.src = tab.favIconUrl || 'default-favicon.png';
        favicon.onerror = function() {
          this.src = 'default-favicon.png';
          this.onerror = null;
        };

        // Create title element
        const title = document.createElement('span');
        title.className = 'tab-title';
        title.textContent = tab.title || tab.url;
        title.title = tab.url; // Set tooltip to full URL

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'tab-close-btn';
        closeBtn.textContent = 'x';
        closeBtn.title = 'Close tab';
        closeBtn.addEventListener('click', function(e) {
          e.stopPropagation();

          // Add confirmation before closing
          const tabTitle = tab.title || tab.url;
          const confirmMessage = `Close tab "${tabTitle.length > 50 ? tabTitle.substring(0, 47) + '...' : tabTitle}"?`;

          if (confirm(confirmMessage)) {
          chrome.tabs.remove(tab.id, function() {
            // Remove this tab from the dropdown
            dropdown.removeChild(tabElement);
            // If no tabs left, close the dropdown
            if (dropdown.children.length === 0) {
              dropdown.style.display = 'none';
              refreshTabGroups();
            }
          });
          }
        });

        tabElement.appendChild(favicon);
        tabElement.appendChild(title);
        tabElement.appendChild(closeBtn);

        // Make tab clickable to activate it
        tabElement.addEventListener('click', function() {
          chrome.tabs.update(tab.id, { active: true });
          chrome.windows.update(tab.windowId, { focused: true });
        });

        dropdown.appendChild(tabElement);
      });
    }

    dropdown.style.display = 'block';

    // Update button text
    if (showTabsButton) {
      showTabsButton.textContent = 'Hide Tabs';
    }
  } else {
    dropdown.style.display = 'none';

    // Update button text
    if (showTabsButton) {
      showTabsButton.textContent = 'Show Tabs';
    }
  }
}

// Function to show debug info for a group
function showDebugInfo(group, tabs) {
  // Create modal dialog
  const modal = document.createElement('div');
  modal.className = 'debug-modal';

  const modalContent = document.createElement('div');
  modalContent.className = 'debug-modal-content';

  const closeModalBtn = document.createElement('span');
  closeModalBtn.className = 'close-modal';
  closeModalBtn.textContent = 'x';
  closeModalBtn.addEventListener('click', function() {
    document.body.removeChild(modal);
  });

  const title = document.createElement('h3');
  title.textContent = 'Tab Group Debug Info';

  const preElement = document.createElement('pre');

  // Create a detailed object with all available info
  const debugInfo = {
    group: {
      id: group.id,
      windowId: group.windowId,
      title: group.title,
      color: group.color,
      collapsed: group.collapsed,
      createDate: new Date(parseInt(localStorage.getItem(`group_${group.id}_created`))).toLocaleString(),
      modifiedDate: new Date(parseInt(localStorage.getItem(`group_${group.id}_modified`))).toLocaleString()
    },
    tabs: tabs.map(tab => ({
      id: tab.id,
      title: tab.title,
      url: tab.url,
      active: tab.active,
      pinned: tab.pinned,
      index: tab.index
    }))
  };

  preElement.textContent = JSON.stringify(debugInfo, null, 2);

  modalContent.appendChild(closeModalBtn);
  modalContent.appendChild(title);
  modalContent.appendChild(preElement);
  modal.appendChild(modalContent);

  document.body.appendChild(modal);
}

// Function to filter groups based on search input
function filterGroups() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const groupItems = document.querySelectorAll('.group-item');
  const groupsContainer = document.getElementById('groups-container');

  // Remove any existing no-results message
  const existingNoResults = document.getElementById('no-results-summary');
  if (existingNoResults) {
    groupsContainer.removeChild(existingNoResults);
  }

  // Remove any existing filtered-out messages
  document.querySelectorAll('.filtered-out-message').forEach(el => el.remove());

  // Filter groups
  groupItems.forEach(item => {
    const groupName = item.dataset.groupName.toLowerCase();
    if (groupName.includes(searchTerm)) {
      item.style.display = '';
    } else {
      item.style.display = 'none';
    }
  });

  // Hide window containers if all groups are hidden
  const windowContainers = document.querySelectorAll('.window-container');
  let hiddenWindowCount = 0;

  windowContainers.forEach(container => {
    // Check if this window has any groups
    const hasGroups = container.dataset.hasGroups === 'true';

    // Hide windows with no groups when filtering
    if (searchTerm && !hasGroups) {
      container.style.display = 'none';
      hiddenWindowCount++;
      return;
    }

    // For windows with groups, check if any are visible
    if (hasGroups) {
    const groups = container.querySelectorAll('.group-item');
      const totalGroups = groups.length;
      const hiddenGroups = Array.from(groups).filter(group => group.style.display === 'none').length;
      const visibleGroups = totalGroups - hiddenGroups;

      if (visibleGroups === 0) {
        // If all groups are hidden, hide the window
      container.style.display = 'none';
      hiddenWindowCount++;
      } else if (hiddenGroups > 0 && searchTerm) {
        // If some groups are hidden, add a message at the end of the window
        const filteredOutMessage = document.createElement('div');
        filteredOutMessage.className = 'filtered-out-message';
        filteredOutMessage.textContent = `${hiddenGroups} group${hiddenGroups !== 1 ? 's' : ''} filtered out by search`;
        container.appendChild(filteredOutMessage);

        container.style.display = '';
    } else {
      container.style.display = '';
    }
    }
  });

  // Display summary of hidden windows if any
  if (hiddenWindowCount > 0 && searchTerm) {
    const noResultsSummary = document.createElement('div');
    noResultsSummary.id = 'no-results-summary';
    noResultsSummary.className = 'no-results-message';
    noResultsSummary.textContent = `${hiddenWindowCount} window${hiddenWindowCount !== 1 ? 's' : ''} with no matching groups hidden`;

    // Insert at the top of the container
    if (groupsContainer.firstChild) {
      groupsContainer.insertBefore(noResultsSummary, groupsContainer.firstChild);
    } else {
      groupsContainer.appendChild(noResultsSummary);
    }
  }

  // // Show "no results" message if all windows are hidden
  // // TODO: Do we actually need this, or is it handled well enough by the "X windows with no matching groups hidden" message?
  // const visibleWindows = Array.from(windowContainers).filter(window => window.style.display !== 'none');
  // if (visibleWindows.length === 0 && searchTerm) {
  //   const noResultsMessage = document.createElement('div');
  //   noResultsMessage.id = 'no-results-summary';
  //   noResultsMessage.className = 'no-results-message';
  //   noResultsMessage.textContent = `No windows with tab groups found matching "${searchTerm}"`;
  //   groupsContainer.appendChild(noResultsMessage);
  // }
}

// Function to sort groups based on selected option
function sortGroups() {
  const sortOption = document.getElementById('sort-select').value;
  const windowContainers = document.querySelectorAll('.window-container');

  windowContainers.forEach(container => {
    sortGroupsInWindow(container, sortOption);
  });
}

// Function to sort groups within a window container
function sortGroupsInWindow(windowElement, sortOption = 'name') {
  const groups = Array.from(windowElement.querySelectorAll('.group-item'));
  if (groups.length <= 1) return;

  groups.sort((a, b) => {
    switch (sortOption) {
      case 'name':
        return a.dataset.groupName.localeCompare(b.dataset.groupName);
      case 'color':
        return a.dataset.groupColor.localeCompare(b.dataset.groupColor);
      case 'tabs':
        return parseInt(b.dataset.tabCount) - parseInt(a.dataset.tabCount);
      case 'created':
        return parseInt(a.dataset.createdDate) - parseInt(b.dataset.createdDate);
      case 'modified':
        return parseInt(b.dataset.modifiedDate) - parseInt(a.dataset.modifiedDate);
      default:
        return 0;
    }
  });

  // Remove existing groups and append in sorted order
  groups.forEach(group => windowElement.removeChild(group));
  groups.forEach(group => windowElement.appendChild(group));
}

// Function to sort windows
function sortWindows() {
  const groupsContainer = document.getElementById('groups-container');
  const windows = Array.from(groupsContainer.querySelectorAll('.window-container'));

  if (windows.length <= 1) return;

  windows.sort((a, b) => {
    return parseInt(a.dataset.windowId) - parseInt(b.dataset.windowId);
  });

  // Remove existing windows and append in sorted order
  windows.forEach(window => groupsContainer.removeChild(window));
  windows.forEach(window => groupsContainer.appendChild(window));
}

// Function to create a new tab group
function createTabGroup() {
  const groupName = document.getElementById('group-name').value;
  const groupColor = document.getElementById('group-color').value;

  if (!groupName) {
    alert('Please enter a group name');
    return;
  }

  // Get the active tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs.length === 0) {
      alert('No active tab found');
      return;
    }

    const activeTab = tabs[0];

    // Create a new group with the active tab
    chrome.tabs.group({tabIds: activeTab.id}, function(groupId) {
      // Update the group properties
      chrome.tabGroups.update(groupId, {
        title: groupName,
        color: groupColor
      }, function() {
        refreshTabGroups();
      });
    });
  });
}

// Helper function to get a hex color from Chrome's color name
function getColorHex(colorName) {
  const colorMap = {
    'grey': '#BDC1C6',
    'blue': '#8AB4F8',
    'red': '#F28B82',
    'yellow': '#FDD663',
    'green': '#81C995',
    'pink': '#FFA9C9',
    'purple': '#D7AEFB',
    'cyan': '#78D9EC'
  };

  return colorMap[colorName] || '#BDC1C6';
}

// Helper function to get a lighter version of the color for the background
function getLighterColor(colorName) {
  const colorMap = {
    'grey': '#F1F3F4',
    'blue': '#E8F0FE',
    'red': '#FCE8E6',
    'yellow': '#FEF7E0',
    'green': '#E6F4EA',
    'pink': '#FDE7F3',
    'purple': '#F3E8FD',
    'cyan': '#E4F7FB'
  };

  return colorMap[colorName] || '#F1F3F4';
}

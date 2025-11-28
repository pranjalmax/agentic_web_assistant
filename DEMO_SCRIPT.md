# 🧪 Extension Demo & Verification Script

Follow this script to verify that the Agentic Web Assistant is working correctly.

## Phase 1: Setup & Installation
1. [ ] **Build**: Run `npm run build` in your terminal. Ensure it completes with "✅ Extension files ready".
2. [ ] **Load**: Open `chrome://extensions`, enable Developer Mode, and load the `dist/` folder.
3. [ ] **Pin**: Pin the extension icon to your toolbar for easy access.
4. [ ] **Config**: Open the extension, go to **Settings**, and enter your API Key.

## Phase 2: Basic Automation (Recipes)
1. [ ] **Open**: Click the extension icon.
2. [ ] **Select**: Go to the **Recipes** tab.
3. [ ] **Run**: Choose **"Scrape Top Items"**.
4. [ ] **Configure**:
   - **URL**: `https://news.ycombinator.com`
   - **Item Selector**: `.titleline > a`
5. [ ] **Start**: Click "Start Recipe".
   - **Verify**: The agent navigates to HN and extracts the story titles.
6. [ ] **Trace**: Switch to the **Traces** tab.
   - **Verify**: You see the steps: `Navigate` -> `Wait` -> `Extract`.
   - **Verify**: The final step shows a list of article titles.

## Phase 3: Selector Picker & Validation
1. [ ] **Navigate**: Open a new tab to `https://example.com`.
2. [ ] **Open Picker**: Press `Ctrl+Shift+S` (or use the "Pick" button in a recipe form).
3. [ ] **Hover**: Move your mouse around the page.
   - **Verify**: Elements are highlighted with a cyan box.
   - **Verify**: A label appears showing the tag/class/ID (e.g., `h1`, `div.content`).
4. [ ] **Select**: Click on the "More information..." link.
   - **Verify**: The picker closes and the selector is captured (if triggered from a form).
5. [ ] **Validate**:
   - Open the extension -> Recipes -> "Custom" (or any recipe with a selector input).
   - Type `h1` into a selector field.
   - Click the **Validate** (Check Circle) button.
   - **Verify**: The `<h1>` element on the page flashes green.

## Phase 4: Complex Reasoning
1. [ ] **Run**: Choose **"Search + Summarize"**.
2. [ ] **Input**: Enter a topic like "Latest features in React 19".
3. [ ] **Watch**:
   - **Verify**: Agent searches Google.
   - **Verify**: Agent might click a link or extract search snippets.
   - **Verify**: Agent produces a coherent summary in the final step.

## Phase 5: Exporting Traces
1. [ ] **Go to Traces**: After a run, go to the Traces tab.
2. [ ] **Download**: Click the **Download JSON** button.
   - **Verify**: A `.json` file is downloaded with the full execution history.
3. [ ] **Copy**: Click the **Copy Markdown** button.
   - **Verify**: Paste into a text editor. It should be a readable summary of the run.

✅ **If all steps pass, the extension is ready for deployment!**

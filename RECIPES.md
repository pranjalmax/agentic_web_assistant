# 🍳 Recipes Guide

Recipes are pre-configured automation templates for the Agentic Web Assistant. They allow you to perform complex tasks with a single click.

## Built-in Recipes

### 1. 📝 Search + Summarize
**Goal**: Search Google for a topic and summarize the top results.
- **Variables**:
  - `topic`: The subject you want to research.
- **Steps**:
  1. Navigates to Google.
  2. Types the topic and searches.
  3. Extracts titles and snippets from results.
  4. Generates a concise summary.

### 2. 💼 LinkedIn Profile Finder
**Goal**: Find a specific person's LinkedIn profile.
- **Variables**:
  - `name`: Name of the person.
  - `company`: (Optional) Company they work for.
- **Steps**:
  1. Searches LinkedIn/Google for the person.
  2. Identifies the correct profile link.
  3. Returns the URL.

### 3. 📰 HackerNews Top Story
**Goal**: Get the top story from Hacker News.
- **Steps**:
  1. Navigates to `news.ycombinator.com`.
  2. Extracts the top ranking story title and link.

## Creating Custom Recipes

You can define your own recipes in `src/lib/recipes.ts`.

### Structure
```typescript
{
  id: 'my-custom-recipe',
  name: 'My Custom Recipe',
  description: 'Description of what it does',
  goal: 'Detailed goal prompt for the AI agent...',
  variables: ['url', 'selector'] // Variables to ask the user for
}
```

### Tips for Goals
- Be specific about the steps the agent should take.
- Use the **Selector Picker** to find robust selectors and include them in your goal or variables.
- Example: *"Go to {{url}}, click the button with selector {{button_selector}}, and extract the text from {{text_selector}}."*

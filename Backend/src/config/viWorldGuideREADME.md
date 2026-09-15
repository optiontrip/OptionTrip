# Vi world-guide backend integration

`viWorldGuideIntegration.js` is the additive integration point for the existing `chatService` system prompt.

The intended chat integration is deliberately one line at the end of the existing prompt-construction path:

```js
prompt = extendViSystemPrompt(prompt);
```

Do not replace the current chat service. Preserve its existing trip context, long-term memory, flight/hotel tools, date handling, formatting contract and quick replies. The extension adds destination-free discovery, whole-trip reasoning, provider truth, traveler-value ranking, live-trip priorities and post-trip continuity.

Before wiring this into production, run backend syntax/CI and inspect prompt size/tool behavior so the extension does not regress current live flight/hotel searches.

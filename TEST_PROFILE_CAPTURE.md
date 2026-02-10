# Profile Capture Testing

## Test Case: Empty Message Bug Fix

### Issue
Claude was returning empty messages (only timestamps) when using the `update_parent_profile` tool.

### Fix Implemented
1. **Prompt instruction** added to both CRISIS_INTAKE_PROMPT and READINESS_PROMPT:
   ```
   IMPORTANT: Always include your conversational response text even when using tools. Never return only tool calls without text.
   ```

2. **Fallback handling** in `/lib/ai/claude.ts`:
   ```typescript
   if (!messageText.trim() && parentProfile) {
     console.error("⚠️ Claude returned empty message with profile tool use - this is a bug");
     messageText = "Got it, thank you for that information. Let me continue with the assessment...";
   }
   ```

### How to Test

1. **Start Readiness Assessment** at http://localhost:3001/readiness

2. **When asked about parent info, provide details:**
   - "My mom's name is Mary"
   - "She's 82 years old"
   - "She lives in Florida"
   - "She lives alone in her own home"

3. **Check browser console** for:
   ```
   👤 Saving parent profile: { name: "Mary", age: 82, state: "FL", livingArrangement: "alone in her own home" }
   ```

4. **Verify chat shows proper responses:**
   - Should see conversational text, NOT just timestamps
   - If empty message occurs, fallback should trigger: "Got it, thank you for that information. Let me continue with the assessment..."

5. **Check localStorage:**
   ```javascript
   JSON.parse(localStorage.getItem('harbor_parent_profile'))
   ```
   Should show: `{ name: "Mary", age: 82, state: "FL", livingArrangement: "...", lastUpdated: "..." }`

6. **Test state-specific help:**
   - Answer "no" to healthcare proxy question
   - Go to /tasks page
   - Click on "Get healthcare proxy in place" task
   - Click "Get AI Help"
   - Should show Florida-specific guidance with 3 options

### Expected Behavior

✅ **Success Criteria:**
- Chat always shows conversational text (never empty bubbles with just time)
- Parent profile saves correctly to localStorage
- State-specific help appears for FL healthcare proxy tasks
- No console errors about empty messages (or fallback triggers gracefully)

❌ **Failure Modes:**
- Empty chat bubbles (only timestamps visible)
- Console error: "⚠️ Claude returned empty message with profile tool use - this is a bug"
- localStorage missing parent profile data
- State-specific help doesn't appear

### Server Logs to Watch

When profile is captured, you should see:
```
👤 Profile update detected: { name: 'Mary', age: 82, state: 'FL' }
🔍 Message: <conversational text here>
🔍 Tasks from tool use: []
👤 Parent profile from tool use: { name: 'Mary', age: 82, state: 'FL', livingArrangement: '...' }
```

If message is empty:
```
👤 Profile update detected: { name: 'Mary', age: 82 }
🔍 Message:
⚠️ Claude returned empty message with profile tool use - this is a bug
```

## Current Status

- ✅ Fix implemented
- ⏳ Manual testing pending
- 🔄 Server running on http://localhost:3001

## Next Steps if Issue Persists

If the fallback is frequently triggered (empty messages still occurring):

1. **Check Anthropic API docs** for tool use best practices
2. **Consider tool_choice parameter** to force text + tool use
3. **File bug report** with Anthropic if it's a model issue
4. **Alternative approach**: Post-process profile data extraction instead of real-time tool use

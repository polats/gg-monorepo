# ANSI Color Code Stripping Fix

## Problem

Vitest outputs ANSI color codes for terminal formatting, which appear as garbled text in GitHub Actions summaries:

```
�[2m Test Files �[22m �[1m�[32m1 passed�[39m�[22m�[90m (1)�[39m
```

These escape sequences are:
- `\x1b[2m` - Dim text
- `\x1b[22m` - Normal intensity
- `\x1b[1m` - Bold
- `\x1b[32m` - Green color
- `\x1b[39m` - Default color
- `\x1b[90m` - Bright black (gray)

## Solution

Strip ANSI color codes using `sed` before adding output to GitHub summary:

```bash
# Capture raw output with color codes
npm run test:client 2>&1 | tee client-test-output-raw.txt

# Strip ANSI codes for clean output
sed 's/\x1b\[[0-9;]*m//g' client-test-output-raw.txt > client-test-output.txt
```

### Regex Explanation

`\x1b\[[0-9;]*m` matches:
- `\x1b` - Escape character (ESC)
- `\[` - Literal bracket
- `[0-9;]*` - Zero or more digits or semicolons (the color/style codes)
- `m` - Literal 'm' (end of ANSI sequence)

## Before Fix

```
�[2m Test Files �[22m �[1m�[32m1 passed�[39m�[22m�[90m (1)�[39m
�[2m      Tests �[22m �[1m�[32m45 passed�[39m�[22m�[90m (45)�[39m
�[2m   Duration �[22m 297ms
```

## After Fix

```
 Test Files  1 passed (1)
      Tests  45 passed (45)
   Duration  297ms
```

## Implementation

Applied to all test output steps in `.github/workflows/test.yml`:

1. **Client tests** - Strip ANSI codes before summary
2. **Server tests** - Strip ANSI codes before summary
3. **Coverage report** - Strip ANSI codes before summary

## Testing

Test the sed command locally:

```bash
# Test with sample ANSI output
echo -e "\x1b[32mTest passed\x1b[0m" | sed 's/\x1b\[[0-9;]*m//g'
# Output: Test passed

# Test with actual vitest output
npm run test:client 2>&1 | sed 's/\x1b\[[0-9;]*m//g' | tail -n 5
```

## Alternative Solutions Considered

### 1. Disable Colors in Vitest
```bash
npm run test:client -- --no-color
```
**Pros:** Native solution
**Cons:** Loses color in local terminal output

### 2. Use `ansi2txt` or similar tool
```bash
npm install -g ansi2txt
npm run test:client | ansi2txt
```
**Pros:** Dedicated tool
**Cons:** Extra dependency, not available by default in GitHub Actions

### 3. Use `sed` (Chosen Solution)
```bash
sed 's/\x1b\[[0-9;]*m//g'
```
**Pros:** 
- Available by default in Ubuntu
- No extra dependencies
- Fast and reliable
- Works for all ANSI codes

**Cons:** None significant

## Files Modified

- `.github/workflows/test.yml` - Added ANSI stripping to all test steps
- `apps/goblin-gardens/docs/github-actions-test-summary.md` - Updated technical details
- `apps/goblin-gardens/docs/github-test-results.md` - Updated artifact descriptions

## Verification

To verify the fix works:

1. Push changes to GitHub
2. View workflow run in Actions tab
3. Check that test summaries show clean text without escape codes
4. Download test-results artifact and verify clean output files

## Related Issues

- ANSI codes are standard terminal escape sequences
- GitHub markdown doesn't render ANSI codes
- Most CI/CD systems strip these automatically, but GitHub Actions requires manual handling

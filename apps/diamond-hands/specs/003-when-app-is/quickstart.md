# Quickstart Guide: Pre-Launch Minigame Mode

## Overview
This guide demonstrates how to test and validate the pre-launch minigame feature that displays the diamond-hands game when RaffleTime is not yet launched.

## Prerequisites
- Node.js 18+ installed
- RaffleTime repository cloned
- Dependencies installed (`npm install`)

## Quick Setup

### 1. Configure Environment
Create or update `.env.local`:
```bash
# Show minigame (pre-launch mode)
NEXT_PUBLIC_APP_LAUNCHED=false

# Or omit entirely (defaults to pre-launch)
# NEXT_PUBLIC_APP_LAUNCHED=
```

### 2. Install Dependencies
```bash
# Install framer-motion for animations
npm install framer-motion
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. View Minigame
Open browser to http://localhost:3000

You should see the diamond-hands minigame instead of the main RaffleTime app.

## Testing Scenarios

### Scenario 1: Pre-Launch Mode (Minigame)
```bash
# Set environment
export NEXT_PUBLIC_APP_LAUNCHED=false
npm run dev
```
**Expected**: Diamond-hands minigame displays
**Verify**:
- Tutorial screen appears first
- Can progress through: Tutorial → Home → Deposit → Game
- Game mechanics work (price updates, countdown, tap to hold)

### Scenario 2: Launch Mode (Main App)
```bash
# Set environment
export NEXT_PUBLIC_APP_LAUNCHED=true
npm run dev
```
**Expected**: Main RaffleTime platform displays
**Verify**:
- Regular raffle platform loads
- No minigame components visible
- WorldID login available

### Scenario 3: Default Behavior (No Env Var)
```bash
# Remove environment variable
unset NEXT_PUBLIC_APP_LAUNCHED
npm run dev
```
**Expected**: Minigame displays (safe default for pre-launch)

## Game Flow Validation

### 1. Tutorial Screen
- [ ] Three tutorial slides display
- [ ] "Skip" button works
- [ ] "Next" progresses through slides
- [ ] "Get Started" proceeds to home

### 2. Home Screen
- [ ] Diamond animation displays
- [ ] "Start Playing" button works
- [ ] "How to Play" returns to tutorial

### 3. Deposit Workflow
- [ ] Deposit amount selector works
- [ ] Can select preset amounts (10, 50, 100, 500 WLD)
- [ ] "Deposit" button proceeds to game

### 4. Game Screen
- [ ] Initial 3-second countdown displays
- [ ] Price updates every 5 seconds
- [ ] Red countdown circle appears on price change
- [ ] Tapping screen triggers "hold" with sparkle effect
- [ ] Not tapping results in "sell" after countdown
- [ ] Final result screen shows sale price

### 5. Play Again
- [ ] "Play Again" button returns to deposit screen
- [ ] Can complete multiple game sessions

## Component Testing

### Run Unit Tests
```bash
npm test -- --testPathPattern=minigame
```

### Run Integration Tests
```bash
npm test -- --testPathPattern=launch-mode
```

### Manual Test Checklist
- [ ] Mode detection works correctly
- [ ] Transitions between screens smooth
- [ ] Animations perform at 60fps
- [ ] No console errors
- [ ] Mobile responsive design
- [ ] Keyboard navigation works

## Performance Validation

### Check Animation Performance
1. Open Chrome DevTools
2. Go to Performance tab
3. Start recording
4. Play through game
5. Stop recording
6. Verify FPS stays near 60

### Memory Usage
1. Open Chrome DevTools
2. Go to Memory tab
3. Take heap snapshot at game start
4. Play for 5 minutes
5. Take another snapshot
6. Compare - should be < 10MB difference

## Troubleshooting

### Minigame Not Appearing
```bash
# Check environment variable
echo $NEXT_PUBLIC_APP_LAUNCHED

# Should be "false" or empty
# If "true", change it:
export NEXT_PUBLIC_APP_LAUNCHED=false

# Restart dev server
npm run dev
```

### Animation Stuttering
```bash
# Ensure production build for testing
npm run build
npm start

# Test in production mode
```

### Assets Not Loading
```bash
# Verify assets copied to public folder
ls public/images/minigame/

# Should see:
# diamond.png
# sparkle.png
# smoke.png
```

## Production Deployment

### Pre-Launch Configuration
```yaml
# Vercel/Netlify environment variables
NEXT_PUBLIC_APP_LAUNCHED: "false"
```

### Launch Day Switch
```yaml
# Update environment variable
NEXT_PUBLIC_APP_LAUNCHED: "true"

# Trigger redeploy or restart
```

### Rollback if Needed
```yaml
# Revert environment variable
NEXT_PUBLIC_APP_LAUNCHED: "false"

# App returns to minigame mode
```

## Success Criteria

### Functional
- [x] Environment variable controls app mode
- [x] Minigame fully playable
- [x] Clean transition between modes
- [x] No interference with main app

### Performance
- [x] 60fps animations
- [x] < 10MB memory usage
- [x] < 200ms mode detection
- [x] Instant screen transitions

### User Experience
- [x] Intuitive game flow
- [x] Clear instructions
- [x] Engaging gameplay
- [x] Mobile-friendly

## Next Steps

After validation:
1. Deploy to staging environment
2. Test with real devices
3. Gather user feedback
4. Monitor performance metrics
5. Prepare launch day switch procedure

## Support

For issues or questions:
- Check error logs in console
- Review implementation in `/components/minigame/`
- Verify environment configuration
- Test in incognito mode to rule out caching
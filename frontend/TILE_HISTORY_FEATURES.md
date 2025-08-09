# Tile History Features Implementation

## Overview
We've created a comprehensive tile history viewing system that makes exploring each tile's complete history fascinating and engaging. When you click on a tile, you can now see everything about its journey through time.

## Components Created

### 1. TileHistory Component (`components/TileHistory.tsx`)
The main history viewer with three viewing modes:

#### Timeline Mode
- Chronological event timeline showing all tile changes
- Visual icons for different event types (💰 purchases, 🔄 transfers, 🎨 image changes, etc.)
- Expandable event cards with detailed information
- Direct links to Etherscan transactions
- Color-coded events for easy scanning
- Shows time elapsed and block numbers

#### Gallery Mode (via TileImageComparison)
- Interactive image comparison slider
- Timeline playback animation
- Side-by-side image comparison
- Pixel difference calculations
- Image evolution grid view

#### Stats Mode
- Total image changes counter
- Sales history metrics
- Unique owners count
- Price analytics (highest, lowest, average)
- Total trading volume
- Ownership duration tracking

### 2. TileImageComparison Component (`components/TileImageComparison.tsx`)
Advanced image analysis tool featuring:

- **Comparison Slider**: Drag to compare any two images from the tile's history
- **Timeline Playback**: Animated playback of all image changes over time
- **Speed Controls**: Adjustable playback speed (0.25s to 2s per frame)
- **Pixel Difference Analysis**: Shows exact number and percentage of pixels changed
- **Image Selection**: Choose any two images to compare from dropdowns
- **Visual Grid**: All historical images displayed in a grid for quick selection
- **Metadata Display**: Block numbers and timestamps for each image

### 3. TileHistory Utilities (`utils/tileHistory.ts`)
Comprehensive data structures and utilities:

- Event type definitions (PurchaseEvent, TransferEvent, DataChangeEvent)
- Price history tracking with USD conversions
- Ownership timeline with profit/loss calculations
- Tile statistics calculator
- Pattern detection (trading activity, price trends)
- Historical data fetching utilities

## Data Displayed

### For Each Tile, Users Can See:

1. **Complete Ownership History**
   - Every purchase with price and parties involved
   - Transfer events (wrapping, gifting, etc.)
   - ENS names when available
   - Time between ownership changes

2. **Image Evolution**
   - Every image ever set on the tile
   - When each image was created (block number and date)
   - Visual comparison between any two images
   - Percentage of pixels changed between versions
   - Animated timeline of all changes

3. **Price History**
   - Original purchase price (2 ETH for unminted tiles)
   - All resale prices
   - Current listing price
   - Price trends and appreciation

4. **Activity Metrics**
   - Total number of owners
   - Number of image changes
   - URL updates
   - Days since last activity
   - Trading frequency

5. **Transaction Details**
   - Direct links to Etherscan for every transaction
   - Gas costs (when available)
   - Block numbers for blockchain verification
   - Timestamps for all events

## User Experience Features

### Interactive Elements
- Click timeline events to expand details
- Drag slider to compare images
- Play/pause image evolution animation
- Switch between timeline, gallery, and stats views
- Hover effects on all interactive elements

### Visual Design
- Color-coded event types for quick scanning
- Gradient backgrounds for stat cards
- Smooth transitions and animations
- Responsive design for mobile and desktop
- Clean, modern interface matching PixelMap aesthetic

## Future Enhancement Opportunities

### Backend API Endpoints Needed
To fully realize this feature, the backend should expose:
- `/api/tile/{id}/history` - Complete history data
- `/api/tile/{id}/purchases` - Purchase history
- `/api/tile/{id}/transfers` - Transfer history
- `/api/tile/{id}/changes` - Data change history

### Additional Features to Consider
1. **USD Price Conversion**: Show historical USD values using ETH price at time of sale
2. **Rarity Scoring**: Calculate rarity based on trading frequency and hold time
3. **Social Features**: Comments on historical events
4. **Download Options**: Export history as PDF or CSV
5. **Comparison Tools**: Compare multiple tiles' histories
6. **Achievement Badges**: "Diamond Hands", "OG Owner", etc.

## Integration

The history viewer is integrated into the tile detail page (`pages/tile/[id].tsx`) and appears below the main tile card. It automatically loads when viewing any tile and uses the existing `historical_images` data from the API.

## Technical Notes

- Uses `date-fns` for date formatting
- Fully TypeScript typed for reliability
- Responsive design using Tailwind CSS
- Optimized for performance with React hooks
- Ready for additional data when backend APIs are expanded

## Usage

When users click on any tile, they now see:
1. The standard tile card with current information
2. Below that, a comprehensive history viewer with:
   - Timeline of all events
   - Interactive image comparison tools
   - Statistical analysis
   - Complete transaction history

This transforms each tile from a static piece of art into a living historical document, making PixelMap's history tangible and explorable.
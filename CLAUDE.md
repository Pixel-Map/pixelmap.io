# PixelMap.io Development Guide

## Build, Test & Lint Commands

### Test Commands
- Run all tests: `./run-tests.sh` or `npm test`
- Run frontend tests: `./run-tests.sh -f` or `cd frontend && npm test`
- Run backend tests: `./run-tests.sh -b` or `cd backend && go test ./...`
- Run single test file: `cd frontend && npm test -- MyComponent.test.tsx`
- Generate coverage: `./run-tests.sh -c` or `npm run test:coverage`
- Combined coverage: `./run-tests.sh -m` or `npm run test:coverage:combined`
- Upload to Codecov: `npm run codecov`

### Development
- Start frontend dev server: `cd frontend && npm run dev`
- Build frontend: `cd frontend && npm run build`
- Lint frontend: `cd frontend && npm run lint`

## Code Style & Conventions

### TypeScript/React
- Use TypeScript for type safety
- Follow Next.js project structure (pages, components)
- Use functional components with hooks
- Define props interfaces for components
- Prefer explicit return types on functions

### Testing
- Every component should have tests in `__tests__/` directory
- Use React Testing Library for component tests
- Mock external dependencies appropriately
- Test UI elements and user interactions
- For backend Go tests, follow the patterns in `backend/internal/ingestor/ingestor_test.go`
- Prefer interface-based design for better testability (see `backend/internal/ingestor/README.md`)

### Formatting & Structure
- NextJS/React standardized imports order
- Use the biome.json configuration for formatting
- Prefer async/await over raw promises
- Use proper error handling with try/catch
- Follow the patterns in existing code for consistency
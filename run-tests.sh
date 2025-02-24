#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print usage information
function print_usage {
  echo -e "${BLUE}PixelMap.io Test Runner${NC}"
  echo ""
  echo "Usage: ./run-tests.sh [options]"
  echo ""
  echo "Options:"
  echo "  -f, --frontend     Run frontend tests only"
  echo "  -b, --backend      Run backend tests only"
  echo "  -a, --all          Run all tests (default)"
  echo "  -c, --coverage     Generate coverage reports"
  echo "  -m, --combined     Generate combined coverage report (implies -c)"
  echo "  -h, --help         Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./run-tests.sh                 # Run all tests"
  echo "  ./run-tests.sh -f              # Run frontend tests only"
  echo "  ./run-tests.sh -b -c           # Run backend tests with coverage"
  echo "  ./run-tests.sh --all --coverage # Run all tests with coverage"
  echo "  ./run-tests.sh -m              # Run all tests with combined coverage report"
}

# Default values
RUN_FRONTEND=false
RUN_BACKEND=false
GENERATE_COVERAGE=false
GENERATE_COMBINED=false

# Parse command line arguments
if [ $# -eq 0 ]; then
  # If no arguments, run all tests
  RUN_FRONTEND=true
  RUN_BACKEND=true
else
  while [[ $# -gt 0 ]]; do
    case $1 in
      -f|--frontend)
        RUN_FRONTEND=true
        shift
        ;;
      -b|--backend)
        RUN_BACKEND=true
        shift
        ;;
      -a|--all)
        RUN_FRONTEND=true
        RUN_BACKEND=true
        shift
        ;;
      -c|--coverage)
        GENERATE_COVERAGE=true
        shift
        ;;
      -m|--combined)
        GENERATE_COMBINED=true
        GENERATE_COVERAGE=true  # Combined coverage implies coverage
        RUN_FRONTEND=true       # Combined coverage requires both frontend and backend
        RUN_BACKEND=true
        shift
        ;;
      -h|--help)
        print_usage
        exit 0
        ;;
      *)
        echo "Unknown option: $1"
        print_usage
        exit 1
        ;;
    esac
  done
fi

# If neither frontend nor backend is specified with arguments, run both
if [ "$RUN_FRONTEND" = false ] && [ "$RUN_BACKEND" = false ]; then
  RUN_FRONTEND=true
  RUN_BACKEND=true
fi

# Run tests based on options
if [ "$GENERATE_COVERAGE" = true ]; then
  # Run with coverage
  if [ "$RUN_FRONTEND" = true ] && [ "$RUN_BACKEND" = true ]; then
    echo -e "${GREEN}Running all tests with coverage...${NC}"
    npm run test:coverage
  elif [ "$RUN_FRONTEND" = true ]; then
    echo -e "${GREEN}Running frontend tests with coverage...${NC}"
    npm run test:frontend:coverage
  elif [ "$RUN_BACKEND" = true ]; then
    echo -e "${GREEN}Running backend tests with coverage...${NC}"
    npm run test:backend:coverage
  fi
else
  # Run without coverage
  if [ "$RUN_FRONTEND" = true ] && [ "$RUN_BACKEND" = true ]; then
    echo -e "${GREEN}Running all tests...${NC}"
    npm run test
  elif [ "$RUN_FRONTEND" = true ]; then
    echo -e "${GREEN}Running frontend tests...${NC}"
    npm run test:frontend
  elif [ "$RUN_BACKEND" = true ]; then
    echo -e "${GREEN}Running backend tests...${NC}"
    npm run test:backend
  fi
fi

# Display coverage report locations if generated
if [ "$GENERATE_COVERAGE" = true ]; then
  echo ""
  echo -e "${YELLOW}Coverage Reports:${NC}"
  
  if [ "$RUN_FRONTEND" = true ]; then
    echo -e "${BLUE}Frontend:${NC} frontend/coverage/lcov-report/index.html"
  fi
  
  if [ "$RUN_BACKEND" = true ]; then
    echo -e "${BLUE}Backend:${NC} backend/coverage.html"
  fi
  
  echo ""
  echo -e "${GREEN}You can open these HTML files in your browser to view detailed coverage reports.${NC}"
  
  # Generate combined coverage report if requested
  if [ "$GENERATE_COMBINED" = true ]; then
    echo ""
    echo -e "${CYAN}Generating combined coverage report...${NC}"
    node ./combine-coverage.js
    echo -e "${CYAN}Combined Coverage:${NC} coverage-combined/index.html"
    echo ""
    echo -e "${GREEN}You can open this HTML file in your browser to view the combined coverage report.${NC}"
  fi
fi

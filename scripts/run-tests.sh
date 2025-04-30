#!/bin/bash

# Run all tests for the onesso authentication service

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print section header
print_header() {
  echo -e "\n${YELLOW}=======================================${NC}"
  echo -e "${YELLOW}$1${NC}"
  echo -e "${YELLOW}=======================================${NC}\n"
}

# Function to run a command and check its exit status
run_command() {
  echo -e "${YELLOW}Running: $1${NC}"
  eval $1
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Passed${NC}"
    return 0
  else
    echo -e "${RED}✗ Failed${NC}"
    return 1
  fi
}

# Navigate to the onesso directory
cd ../apps/onesso

# Run unit tests
print_header "Running Unit Tests"
run_command "npm test"
UNIT_TESTS_RESULT=$?

# Run integration tests
print_header "Running Integration Tests"
run_command "npm run test:e2e"
INTEGRATION_TESTS_RESULT=$?

# Run security tests
print_header "Running Security Tests"
cd ../../scripts
run_command "node security-test.js"
SECURITY_TESTS_RESULT=$?

# Print summary
print_header "Test Summary"
echo -e "Unit Tests: $([ $UNIT_TESTS_RESULT -eq 0 ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
echo -e "Integration Tests: $([ $INTEGRATION_TESTS_RESULT -eq 0 ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"
echo -e "Security Tests: $([ $SECURITY_TESTS_RESULT -eq 0 ] && echo -e "${GREEN}PASSED${NC}" || echo -e "${RED}FAILED${NC}")"

# Calculate overall result
if [ $UNIT_TESTS_RESULT -eq 0 ] && [ $INTEGRATION_TESTS_RESULT -eq 0 ] && [ $SECURITY_TESTS_RESULT -eq 0 ]; then
  echo -e "\n${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "\n${RED}Some tests failed!${NC}"
  exit 1
fi

# BK Centers Logging Documentation

## Overview
This document provides information about the logging system implemented in the BK Centers application to control excessive logging that was affecting performance.

## Problem Addressed
The application was experiencing performance issues due to excessive logging, especially when loading or refreshing pages. These logs were primarily related to API calls and data processing, which were helpful during development but unnecessary and performance-impacting in production.

## Solution
We've implemented a structured logging system with configurable log levels that can be adjusted based on environment.

### Log Levels
The logging system supports the following levels (from least to most verbose):

- **NONE (0)**: No logging (completely silent operation)
- **ERROR (1)**: Only error messages (production default)
- **WARN (2)**: Errors and warnings (development default)
- **INFO (3)**: Normal informational logging
- **DEBUG (4)**: Detailed debug information
- **TRACE (5)**: Very verbose tracing (includes all API calls and data processing)

## Usage

### Setting Log Level During Development
During development, you can control the logging level via environment variables:

```bash
# In your .env file or as an environment variable
LOG_LEVEL=2  # Set to WARN level
```

The default is `WARN` for development and `ERROR` for production.

## Best Practices

1. **Default Settings**: Leave log level at default settings in most cases:
   - Production: ERROR (1)
   - Development: WARN (2)

2. **Troubleshooting**: If you need to investigate a specific issue:
   - Set LOG_LEVEL environment variable to 4 (DEBUG) temporarily
   - After troubleshooting, return to default level

3. **Silent Mode**: If you need maximum performance (like during demos):
   - Set LOG_LEVEL environment variable to 0 (NONE)
   - Note that this will suppress even error messages

4. **New Development**: When working on a new feature:
   - Consider using DEBUG (4) during initial development
   - Switch to WARN (2) once basic functionality works
   
## Technical Details

The logging system is implemented in the following file:

- `lib/logger.ts` - Core logging functionality

The system automatically detects the environment (development/production) and sets appropriate defaults. 
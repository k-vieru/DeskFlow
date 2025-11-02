# Password Reset Feature Guide

## Overview
A comprehensive password reset system has been implemented for DeskFlow, allowing users to reset their passwords when they forget them.

## How It Works

### For Users

1. **Request Reset Code**
   - Go to the Login page
   - Click on the "Reset" tab
   - Enter your email address
   - Click "Request Reset Code"
   - A 6-digit code will be generated and displayed on screen

2. **Reset Password**
   - Copy the 6-digit reset code shown
   - Enter the code in the "Reset Code" field
   - Enter your new password (minimum 6 characters)
   - Click "Reset Password"
   - Your password will be updated immediately

3. **Login**
   - After successful reset, you'll see a success message
   - Return to the Login tab
   - Use your email and new password to login

## Important Notes

### Development vs Production
- **Development Mode**: The reset code is displayed on screen for testing purposes
- **Production Mode**: In a real production environment, this code would be sent via email instead of being displayed

### Security Features
- Reset codes expire after 15 minutes
- Each code can only be used once
- Codes are user-specific and cannot be reused
- Minimum password length of 6 characters enforced

### Technical Details

#### Backend Endpoints

**Request Reset Code**
- **Endpoint**: `POST /make-server-8f21c4d2/auth/request-reset`
- **Body**: `{ email: string }`
- **Response**: `{ success: boolean, resetCode: string, message: string }`

**Reset Password**
- **Endpoint**: `POST /make-server-8f21c4d2/auth/reset-password`
- **Body**: `{ email: string, code: string, newPassword: string }`
- **Response**: `{ success: boolean, message: string }`

#### Data Storage
Reset codes are stored in the key-value store with the pattern:
```
password-reset:{userId}
```

Each entry contains:
- `userId`: The user's unique ID
- `email`: The user's email address
- `code`: The 6-digit reset code
- `expiresAt`: ISO timestamp when the code expires
- `used`: Boolean flag indicating if the code has been used

## Error Messages

- "Email is required" - Email field is empty
- "Reset code has already been used" - Code has been used before
- "Reset code has expired" - Code is older than 15 minutes
- "Invalid reset code" - Code doesn't match the one generated
- "Password must be at least 6 characters long" - Password too short
- "No reset request found for this account" - No active reset request exists

## UI/UX Features

- Three-tab layout: Login, Register, Reset
- Clear visual feedback with success and error alerts
- Reset code prominently displayed in blue alert box
- Expiration time reminder shown to users
- Back button to return to email entry
- Form auto-clears after successful reset
- Disabled buttons during loading states
- Hover animations on all buttons

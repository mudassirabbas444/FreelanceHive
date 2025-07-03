# Freelance Hive Mobile App

A React Native mobile application built with Expo CLI for the Freelance Hive platform, connecting buyers and sellers for freelance services.

## Features

### User Module
- **Authentication**: Login and signup with role-based access (Buyer/Seller)
- **Profile Management**: View, edit, and delete user profiles
- **Role-based UI**: Different interfaces for buyers and sellers

### Gig Module
- **Gig Browsing**: Buyers can browse and search available gigs
- **Gig Management**: Sellers can create, update, pause, and delete gigs
- **Gig Details**: Detailed view of gig information and packages
- **Order Placement**: Buyers can place orders for gigs

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Installation

1. **Install Expo CLI globally**:
   ```bash
   npm install -g @expo/cli
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure the backend URL**:
   Edit `src/config.js` and update the `API_BASE_URL` to point to your backend server:
   ```javascript
   API_BASE_URL: 'http://your-backend-url:4000'
   ```

## Running the App

### Development Mode
```bash
npm start
```

This will start the Expo development server and show a QR code. You can:
- Scan the QR code with the Expo Go app on your phone
- Press 'a' to open on Android emulator
- Press 'i' to open on iOS simulator

### Platform Specific
```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## Project Structure

```
src/
├── UserModule/           # User authentication and profile screens
│   ├── Login.js         # User login screen
│   ├── Signup.js        # User registration screen
│   ├── UpdateProfile.js # Profile editing screen
│   └── ViewProfile.js   # Profile viewing screen
├── GigModule/           # Gig-related screens
│   ├── ViewGigs.js      # Browse gigs (Buyer)
│   ├── ViewGigsSeller.js # Manage gigs (Seller)
│   ├── ViewGigsDetails.js # Gig details (Buyer)
│   └── ViewGigDetailsSeller.js # Gig details (Seller)
├── api.js               # API service functions
├── config.js            # Configuration and constants
└── navigation/          # Navigation setup
```

## Key Dependencies

- **@react-navigation/native**: Navigation framework
- **@react-native-async-storage/async-storage**: Local storage
- **@react-native-picker/picker**: Dropdown picker component
- **@expo/vector-icons**: Icon library
- **expo-status-bar**: Status bar management

## Configuration

### Environment Variables
The app uses a centralized configuration file (`src/config.js`) for:
- API base URL
- App constants
- UI colors
- Storage keys

### API Configuration
The API service (`src/api.js`) includes:
- Automatic token management
- Error handling
- Network error detection
- File upload support

## Development Guidelines

### Code Style
- Use functional components with hooks
- Follow React Native best practices
- Use consistent naming conventions
- Add proper error handling

### UI/UX
- Use the predefined color scheme from config
- Implement proper loading states
- Add error boundaries where needed
- Ensure responsive design

### State Management
- Use React hooks for local state
- AsyncStorage for persistent data
- Proper error handling for API calls

## Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   npx expo start --clear
   ```

2. **Dependency conflicts**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **iOS build issues**:
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Android build issues**:
   ```bash
   cd android && ./gradlew clean && cd ..
   ```

### Network Issues
- Ensure your backend server is running
- Check the API_BASE_URL in config.js
- Verify network permissions in app.json

## Building for Production

### Android APK
```bash
expo build:android
```

### iOS IPA
```bash
expo build:ios
```

### EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the Expo documentation
- Review React Native documentation
- Open an issue in the repository 
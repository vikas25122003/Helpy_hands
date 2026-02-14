<div align="center">

# 🤝 Helpy Hands

**A community-driven marketplace for buying, selling, and exchanging pre-owned goods**

[![React Native](https://img.shields.io/badge/React_Native-0.76-blue?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_52-000020?logo=expo)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Private-red)]()

</div>

---

## 📖 About

**Helpy Hands** is a mobile-first marketplace application that connects people in local communities to buy, sell, and exchange second-hand products. Built with React Native and Expo, it runs natively on **Android**, **iOS**, and the **web**, providing a seamless experience across all platforms.

The app promotes sustainability by giving pre-owned items a second life, while making the process of listing, discovering, and purchasing products intuitive and enjoyable.

---

## ✨ Features

### 🔐 Authentication
- **Email & Password** sign-up/sign-in with email verification
- **Phone OTP** login — receive a one-time verification code via SMS
- Secure session management using **Expo SecureStore**
- Automatic redirect between auth and main app based on login state

### 🏠 Home Feed
- Browse a curated feed of available products from other users
- **Category filter chips** — quickly filter by Furniture, Electronics, Books, Clothing, etc.
- Product cards with image, title, price (₹), and category
- Floating **"+"** button for quick product listing

### 🔍 Explore
- Discover items via **Trending Now** and **Nearby Items** sections
- Visual **category grid** with icons (Electronics, Furniture, Clothing, Books, Sports, Toys, Home Decor, Vehicles)
- Horizontal scrollable product carousels
- Search bar for finding specific items

### 📦 Product Listing
- Add products with **title, description, price, category, and image**
- Image upload via device gallery using **Expo Image Picker**
- Dropdown category selector with 9 predefined categories
- Products are stored in **Supabase** with real-time data sync

### 🛍️ My Products
- **Tabbed view** — Active / Sold / Offers
- Manage your active listings: edit, mark as sold, or delete
- View offers from potential buyers on your products
- Accept, reject, or plan counter-offers on incoming bids

### 👤 User Profile
- View and edit profile information (name, username, bio, location, avatar)
- **Activity stats** — Active Listings count and Sold Items count
- Quick access to My Listings, Favorites, Notifications, and Privacy settings
- Pull-to-refresh for up-to-date data
- Sign-out with confirmation dialog

### 🌙 Dark Mode
- Automatic dark/light theme support based on system preference
- Custom themed components (`ThemedText`, `ThemedView`) for consistent styling

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Expo](https://expo.dev/) SDK 52 |
| **UI** | [React Native](https://reactnative.dev/) 0.76 |
| **Language** | [TypeScript](https://www.typescriptlang.org/) 5.3 |
| **Navigation** | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based routing) |
| **Backend** | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage) |
| **Auth Storage** | [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) |
| **Image Upload** | [Expo Image Picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) |
| **Icons** | [@expo/vector-icons](https://icons.expo.fyi/) (FontAwesome) |
| **Animations** | [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) |
| **Testing** | [Jest](https://jestjs.io/) + [jest-expo](https://docs.expo.dev/develop/unit-testing/) |

---

## 📁 Project Structure

```
helpyhands/
├── app/                        # Screens (file-based routing)
│   ├── (auth)/                 # Auth screens (login, signup, phone-signup)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── phone-signup.tsx
│   ├── (tabs)/                 # Main tab screens
│   │   ├── _layout.tsx         # Tab bar configuration
│   │   ├── index.tsx           # Home feed
│   │   ├── explore.tsx         # Explore/discover
│   │   ├── my-products.tsx     # User's product management
│   │   └── profile.tsx         # User profile
│   ├── product/[id].tsx        # Product detail (dynamic route)
│   ├── add-product.tsx         # Add new product form
│   └── _layout.tsx             # Root layout with auth guard
├── components/                 # Reusable UI components
│   ├── ThemedText.tsx
│   ├── ThemedView.tsx
│   ├── ParallaxScrollView.tsx
│   └── ui/                     # Platform-specific UI components
├── constants/
│   └── Colors.ts               # App color palette
├── context/
│   └── AuthContext.tsx          # Authentication context provider
├── hooks/                      # Custom React hooks
│   ├── useColorScheme.ts
│   └── useThemeColor.ts
├── lib/
│   └── supabase.ts             # Supabase client configuration
├── supabase/                   # Database schemas & setup
│   ├── schema.sql
│   ├── fixed_schema.sql
│   ├── fix_trigger.sql
│   ├── storage.sql
│   └── setup_phone_auth.md
└── assets/                     # Fonts, images, icons
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/go) app on your phone (for testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vikas25122003/Helpy_hands.git
   cd Helpy_hands/helpyhands
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Supabase**
   
   Update the Supabase URL and anon key in `lib/supabase.ts` with your own project credentials:
   ```typescript
   const supabaseUrl = 'YOUR_SUPABASE_URL';
   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
   ```

4. **Set up the database**
   
   Run the SQL scripts in the `supabase/` directory in your Supabase dashboard:
   - `schema.sql` — Base database schema
   - `fixed_schema.sql` — Schema fixes and updates
   - `storage.sql` — Storage bucket configuration
   - `fix_trigger.sql` — Database triggers

5. **Start the development server**
   ```bash
   npx expo start
   ```

6. **Run the app**
   - 📱 Scan the QR code with **Expo Go** (Android/iOS)
   - 🤖 Press `a` to open in **Android Emulator**
   - 🍎 Press `i` to open in **iOS Simulator**
   - 🌐 Press `w` to open in **Web Browser**

---

## 📊 Database Schema

The app uses Supabase (PostgreSQL) with the following core tables:

| Table | Purpose |
|---|---|
| `profiles` | User profile data (username, email, avatar, bio, location) |
| `products` | Product listings (title, description, price, category, image, status) |
| `messages` | Buyer-seller communication and offers |

---

## 🗺️ Roadmap

- [ ] Real-time chat between buyers and sellers
- [ ] Push notifications for new offers and messages
- [ ] Location-based product discovery with maps
- [ ] Counter-offer negotiation system
- [ ] Product image gallery (multiple images per listing)
- [ ] Rating and review system for users
- [ ] In-app payment integration
- [ ] Advanced search with filters (price range, distance, condition)

---

## 👨‍💻 Author

**R M Jai Vignesha Vikas**

- GitHub: [@vikas25122003](https://github.com/vikas25122003)

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

<div align="center">

**Built with ❤️ using React Native & Expo**

</div>

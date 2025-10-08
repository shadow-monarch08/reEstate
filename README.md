# 🏡 ReEstate

*A cross-platform mobile app for streamlined property rentals, built with React Native and Supabase.*

![App Demo](./assets/demo.gif)
*Recording in progress*

---

## ✨ Overview

Rentify makes finding your next home effortless. Whether you’re a tenant browsing listings or an agent managing properties, the app provides a smooth and modern rental experience.

* 🔍 **Search smarter** with advanced filters (price, location, type, amenities)
* 🗺️ **Browse visually** on an interactive map with property pins
* ❤️ **Save favorites** to your wishlist and revisit anytime
* 🔑 **Quick login** using Google authentication
* 💬 **In-app chat** with property agents for instant communication
* 🤖 **AI chatbot** answers FAQs, recommends properties, and assists during your search
* 📱 **Cross-platform**: Works seamlessly on iOS and Android

---

## 🚀 Features

* **Property Discovery**

  * Search by filters (price range, bedrooms, location, etc.)
  * Interactive map view with property markers
  * Property detail pages with photos and descriptions

* **User Experience**

  * Wishlist system for bookmarking listings
  * Secure Google login with Supabase Auth
  * Smooth and responsive UI with NativeWind

* **Communication**

  * Real-time chat with property agents
  * File & image sharing in chat (documents, photos)
  * AI-powered chatbot for instant Q&A and smart suggestions

* **Data & Sync**

  * Supabase backend for database, auth, and file storage
  * SQLite for offline data sync
  * Real-time updates for messages and new property listings

---

## 🛠️ Tech Stack

* **Framework**: React Native
* **Styling**: NativeWind (Tailwind for RN)
* **Backend**: Supabase (Auth + Database + Storage)
* **Database**: SQLite (offline persistence)
* **Maps**: React Native Maps (or Mapbox, if you’re using that)
* **Auth**: Google Login via Supabase
* **AI**: Integrated chatbot (powered by OpenAI / similar LLM)

---

## 📸 Screenshots

## 📸 Screenshots

| Home Screen                | Map View                 | Chat with Agent            | AI Chatbot             |
| -------------------------- | ------------------------ | -------------------------- | ---------------------- |
|    recording in progress   |   recording in progress  |    recording in progress   |  recording in progress |

---

## ⚙️ Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/rentify.git](https://github.com/shadow-monarch08/reEstate.git
cd rentify
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Setup environment variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### 4. Run the app

```bash
npm start
# then press "i" for iOS or "a" for Android in Expo CLI
```

---

## 📦 Folder Structure

```
app/                          # Expo Router entry
├── (root)/
│   ├── (tab)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── chat.tsx
│   │   ├── map.tsx
│   │   ├── profile.tsx
│   │   └── wishlist.tsx
│   ├── _layout.tsx
│   ├── sign-in.tsx
│   └── search/
│       ├── _layout.tsx
│       ├── Search.tsx
│       ├── Filters.tsx
│       ├── MapDisplay.tsx
│       └── NoResult.tsx
├── chat/
│   └── conversation.tsx
│
assets/                       # Static assets
├── fonts/
├── icons/
└── images/
│
components/                   # Global reusable UI (cross-feature)
├── atoms/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── index.ts
│   │   └── types.ts
│   ├── LikeButton.tsx
│   └── SearchButton.tsx
├── molecules/
│   ├── Card.tsx
│   ├── CheckBox.tsx
│   └── FilterModal.tsx
│
features/                     # Feature-based (domain-specific)
├── chat/
│   ├── components/
│   │   ├── AgentMessage/
│   │   │   ├── AgentTextMessage.tsx
│   │   │   ├── AgentDocumentMessage.tsx
│   │   │   └── index.ts
│   │   ├── UserMessage/
│   │   │   ├── UserTextMessage.tsx
│   │   │   ├── UserImageMessage.tsx
│   │   │   └── index.ts
│   │   └── MessageCards.tsx
│   ├── services/
│   │   ├── chat-bus.ts
│   │   └── messageSync.ts
│   └── store/
│       └── useChatStore.ts
│
├── properties/
│   ├── components/
│   │   ├── cards/
│   │   │   ├── PropertyCard.tsx
│   │   │   ├── PropertyCardList.tsx
│   │   │   └── index.ts
│   │   └── filter/
│   │       ├── PropertySelector.tsx
│   │       ├── FilterModal.tsx
│   │       └── index.ts
│   ├── services/
│   │   └── propertyService.ts
│   ├── store/
│   │   └── usePropertyStore.ts
│   └── types.ts
│
constants/
└── index.ts
│
lib/                          # Infrastructure + core logic
├── database/
│   ├── db.ts
│   ├── localStore.ts
│   └── saveFiles.ts
├── supabase.ts
├── mediaManager.ts
├── security/
│   └── encryption.ts
├── storage/
│   └── fileStorage.ts
├── zustand/
│   ├── useAppStore.ts
│   ├── useUserStore.ts
│   └── useWishlistStore.ts
└── providers/
    └── global-provider.tsx
│
types/                        # Shared global types
├── api/
│   └── localDatabase.ts
├── domain/
│   ├── chat.ts
│   └── property.ts
│
utils/
└── index.ts                  # Shared helper functions
│
README.md
package.json
tsconfig.json
tailwind.config.js
```

---

## 🔮 Future Roadmap

* 🏢 Agent dashboard inside the app
* 🔔 Push notifications for chat and property alerts
* 📍 Background location sharing for property visits
* 🔐 End-to-end encryption for chat messages
* 📊 Analytics dashboard for property performance

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/awesome-feature`)
3. Commit changes (`git commit -m 'Added awesome feature'`)
4. Push to branch (`git push origin feature/awesome-feature`)
5. Open a Pull Request 🎉

---

## 📜 License

This project is licensed under the MIT License.

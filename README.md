# Growth Valley - Performance Marketer Dashboard

A production-ready MERN stack dashboard for performance marketers, featuring a stage-gated workflow for managing marketing projects.

## Features

### Stage-Gated Workflow
1. **Customer Onboarding** - Initial customer information collection
2. **Market Research** - Customer avatar, pain points, desires, competitor analysis
3. **Offer Engineering** - Value propositions, bonus stacks, guarantees, pricing
4. **Traffic Strategy** - Channel selection, hooks, budget allocation
5. **Landing Page & Lead Capture** - Page type selection, lead capture methods, nurturing
6. **Creative Strategy** - Creative cards for awareness, consideration, conversion stages

### Core Functionality
- User authentication with JWT
- Project management with progress tracking
- Stage-gating (cannot access next stage until current is complete)
- File uploads for vision boards and strategy sheets
- Real-time progress indicators
- Toast notifications
- Responsive design with TailwindCSS

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads

### Frontend
- React 18 with Vite
- TailwindCSS
- React Router v6
- React Hook Form with Zod validation
- Axios for API calls
- Sonner for toast notifications

## Project Structure

```
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── projectController.js
│   │   │   ├── marketResearchController.js
│   │   │   ├── offerController.js
│   │   │   ├── trafficStrategyController.js
│   │   │   ├── landingPageController.js
│   │   │   └── creativeController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── stageGating.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Project.js
│   │   │   ├── MarketResearch.js
│   │   │   ├── Offer.js
│   │   │   ├── TrafficStrategy.js
│   │   │   ├── LandingPage.js
│   │   │   └── Creative.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── projects.js
│   │   │   ├── marketResearch.js
│   │   │   ├── offers.js
│   │   │   ├── trafficStrategy.js
│   │   │   ├── landingPages.js
│   │   │   └── creatives.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Layout.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Header.jsx
│   │   │   │   └── index.js
│   │   │   ├── ui/
│   │   │   │   └── index.jsx
│   │   │   └── workflow/
│   │   │       ├── StageProgressTracker.jsx
│   │   │       └── index.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ProjectContext.jsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── projects/
│   │   │   └── stages/
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── lib/
│   │   │   └── utils.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
└── README.md
```

## Installation

### Prerequisites
- Node.js v18+
- MongoDB v6+
- npm or yarn

### Backend Setup

```bash
cd server
cp .env.example .env
# Edit .env with your configurations
npm install
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

## Environment Variables

### Server (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/growth-valley-crm
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
NODE_ENV=development
```

### Client (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatedetails` - Update user details
- `PUT /api/auth/updatepassword` - Update password

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `GET /api/projects/:id/progress` - Get project progress
- `GET /api/projects/dashboard/stats` - Get dashboard stats

### Market Research
- `GET /api/market-research/:projectId` - Get market research
- `POST /api/market-research/:projectId` - Create/update market research
- `POST /api/market-research/:projectId/vision-board` - Upload vision board
- `POST /api/market-research/:projectId/strategy-sheet` - Upload strategy sheet

### Offer Engineering
- `GET /api/offers/:projectId` - Get offer
- `POST /api/offers/:projectId` - Create/update offer
- `POST /api/offers/:projectId/bonuses` - Add bonus
- `DELETE /api/offers/:projectId/bonuses/:bonusId` - Remove bonus

### Traffic Strategy
- `GET /api/traffic-strategy/:projectId` - Get traffic strategy
- `POST /api/traffic-strategy/:projectId` - Create/update traffic strategy
- `POST /api/traffic-strategy/:projectId/hooks` - Add hook
- `DELETE /api/traffic-strategy/:projectId/hooks/:hookId` - Remove hook
- `PATCH /api/traffic-strategy/:projectId/channels/:channelName` - Toggle channel

### Landing Pages
- `GET /api/landing-pages/:projectId` - Get landing page strategy
- `POST /api/landing-pages/:projectId` - Create/update landing page strategy
- `POST /api/landing-pages/:projectId/nurturing` - Add nurturing method
- `DELETE /api/landing-pages/:projectId/nurturing/:nurturingId` - Remove nurturing method

### Creative Strategy
- `GET /api/creatives/:projectId` - Get creative strategy
- `POST /api/creatives/:projectId` - Create/update creative strategy
- `POST /api/creatives/:projectId/generate` - Generate creative cards
- `POST /api/creatives/:projectId/stages/:stage/creatives` - Add creative
- `PUT /api/creatives/:projectId/stages/:stage/creatives/:creativeId` - Update creative
- `DELETE /api/creatives/:projectId/stages/:stage/creatives/:creativeId` - Delete creative

## Stage Gating Logic

The system enforces a strict stage-gated workflow. Users cannot access a stage until all previous stages are completed:

1. Onboarding (automatically completed on project creation)
2. Market Research (requires Onboarding complete)
3. Offer Engineering (requires Market Research complete)
4. Traffic Strategy (requires Offer Engineering complete)
5. Landing Page (requires Traffic Strategy complete)
6. Creative Strategy (requires Landing Page complete)

## License

MIT License - Growth Valley
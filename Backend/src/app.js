import "./config/env.js";

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import passport from "passport";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import productsRouter from "./routes/products.js";
import tripsRouter from "./routes/trips.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chat.js";
import youtubeRouter from "./routes/youtube.js";
import translateRouter from "./routes/translate.js";
import contactRouter from "./routes/contact.js";
import voiceRouter from "./routes/voice.js";
import flightsRouter from "./routes/flights.js";
import hotelsRouter from "./routes/hotels.js";
import geoRouter from "./routes/geo.js";
import planMyDayRouter from "./routes/planMyDay.js";
import blogRouter from "./routes/blog.js";
import userActivityRouter from "./routes/userActivity.js";
import seoRouter from "./routes/seo.js";
import wishlistRouter from "./routes/wishlist.js";
import adminRouter from "./routes/admin.js";
import reviewsRouter from "./routes/reviews.js";
import whereCanIGoRouter from "./routes/whereCanIGo.js";
import notificationsRouter from "./routes/notifications.js";
import memoryRouter from "./routes/memory.js";
import travelMapRouter from "./routes/travelMap.js";
import tripStoryRouter from "./routes/tripStory.js";
import yearlyReportRouter from "./routes/yearlyReport.js";
import internalCronRouter from "./routes/internalCron.js";
import opportunitiesRouter from "./routes/opportunities.js";
import travelInventoryRouter from "./routes/travelInventory.js";
import providerHealthRouter from "./routes/providerHealth.js";
import providerExecutionRouter from "./routes/providerExecution.js";
import unifiedTravelRouter from "./routes/unifiedTravel.js";
import marketplaceCatalogRouter from "./routes/marketplaceCatalog.js";
import viMarketplaceRouter from "./routes/viMarketplace.js";
import { getTravelNewsRunnerStatus } from "./jobs/travelNewsRunner.js";
import { getTravelNewsFreshness } from "./services/travelNewsFreshness.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { corsOptions } from "./middleware/security.js";
import "./config/passport.js";

connectDB();

const app = express();
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(helmet());
const sessionMongoUrl = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!sessionMongoUrl) {
  throw new Error('MongoDB connection URI is required for production session storage');
}

app.set('trust proxy', 1);

app.use(session({
  name: 'optiontrip.sid',
  secret: process.env.JWT_ACCESS_SECRET || process.env.SESSION_SECRET,
  store: MongoStore.create({
    mongoUrl: sessionMongoUrl,
    collectionName: 'sessions',
    ttl: 60 * 60 * 24 * 7,
    autoRemove: 'native'
  }),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));
app.use(passport.initialize());
app.use(passport.session());

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => { console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`); next(); });
}

app.get("/", (req, res) => {
  res.json({ success: true, message: "OptionTrip Backend API is running", version: "1.0.0", endpoints: {
    trips: "/api/trips", products: "/api/products", auth: "/api/auth", chat: "/api/chat",
    opportunities: "/api/opportunities", travelInventory: "/api/travel-inventory",
    providerHealth: "/api/provider-health", providerExecution: "/api/provider-execution/:vertical",
    unifiedTravel: "/api/travel/:vertical/search", marketplace: "/api/marketplace",
    viMarketplace: "/api/vi-marketplace/route", newsHealth: "/api/news-health"
  }});
});

app.get("/api/health", (req, res) => {
  const news = getTravelNewsRunnerStatus();
  res.json({ success: true, status: "healthy", timestamp: new Date().toISOString(), services: {
    database: "connected",
    openai: process.env.OPENAI_API_KEY ? "configured" : "missing",
    googlePlaces: process.env.GOOGLE_PLACES_API_KEY ? "configured" : "missing",
    travelNews: {
      enabled: news.enabled,
      configured: news.configured,
      mode: news.mode,
      missing: news.missing,
      running: news.running,
      lastStatus: news.status,
      lastCompletedAt: news.completedAt,
      dailyLimit: news.dailyLimit,
      recentPublishedCount: news.recentPublishedCount,
      remainingBudget: news.remainingBudget,
      budgetScope: news.budgetScope
    }
  }});
});

// Keep the core health endpoint fast and independent from WordPress. This
// dedicated endpoint verifies whether the public Travel News feed itself is
// actually fresh, with a five-minute cache so monitoring cannot hammer WP.
app.get("/api/news-health", async (req, res) => {
  const runner = getTravelNewsRunnerStatus();
  const freshness = await getTravelNewsFreshness();
  const healthy = runner.enabled && freshness.stale !== true;
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: freshness.status,
    timestamp: new Date().toISOString(),
    runner: {
      enabled: runner.enabled,
      configured: runner.configured,
      mode: runner.mode,
      missing: runner.missing,
      running: runner.running,
      lastStatus: runner.status,
      lastCompletedAt: runner.completedAt,
    },
    freshness,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRouter);
app.use("/api/trips", tripsRouter);
app.use("/api/chat", chatRoutes);
app.use("/api/youtube", youtubeRouter);
app.use("/api/translate", translateRouter);
app.use("/api/contact", contactRouter);
app.use("/api/voice", voiceRouter);
app.use("/api/flights", flightsRouter);
app.use("/api/hotels", hotelsRouter);
app.use("/api/geo", geoRouter);
app.use("/api/plan-my-day", planMyDayRouter);
app.use("/api/blog", blogRouter);
app.use("/api/activity", userActivityRouter);
app.use("/sitemap.xml", seoRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/admin", adminRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/where-can-i-go", whereCanIGoRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/memory", memoryRouter);
app.use("/api/travel-map", travelMapRouter);
app.use("/api/tripstory", tripStoryRouter);
app.use("/api/yearly-report", yearlyReportRouter);
app.use("/api/internal/cron", internalCronRouter);
app.use("/api/opportunities", opportunitiesRouter);
app.use("/api/travel-inventory", travelInventoryRouter);
app.use("/api/provider-health", providerHealthRouter);
app.use("/api/provider-execution", providerExecutionRouter);
app.use("/api/travel", unifiedTravelRouter);
app.use("/api/marketplace", marketplaceCatalogRouter);
app.use("/api/vi-marketplace", viMarketplaceRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

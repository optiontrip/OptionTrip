import "./config/env.js";

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import passport from "passport";
import cookieParser from "cookie-parser";
import session from "express-session";
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
app.use(session({
  secret: process.env.JWT_ACCESS_SECRET || 'your-session-secret',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 300000 }
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
    unifiedTravel: "/api/travel/:vertical/search"
  }});
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "healthy", timestamp: new Date().toISOString(), services: {
    database: "connected", openai: process.env.OPENAI_API_KEY ? "configured" : "missing",
    googlePlaces: process.env.GOOGLE_PLACES_API_KEY ? "configured" : "missing"
  }});
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

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
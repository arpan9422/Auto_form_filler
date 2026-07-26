// Express server entry point
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import path from "path";

import userRoutes from "./modules/user/user.routes";
import projectRoutes from "./modules/project/project.routes";
import answerRoutes from "./modules/answer/answer.routes";
import resumeRoutes from "./modules/resume/resume.routes";
import memoryRoutes from "./modules/memory/memory.routes";
import aiRoutes from "./modules/ai/ai.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import githubRoutes from "./modules/github/github.routes";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import { swaggerSpec } from "./config/swagger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(requestLogger);

// Serve static files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/api/user", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/custom-answers", answerRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/memory", memoryRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;

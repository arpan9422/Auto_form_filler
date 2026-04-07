// Express server entry point
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import projectRoutes from "./modules/project/project.routes";
import answerRoutes from "./modules/answer/answer.routes";
import resumeRoutes from "./modules/resume/resume.routes";
import memoryRoutes from "./modules/memory/memory.routes";
import aiRoutes from "./modules/ai/ai.routes";
import paymentRoutes from "./modules/payment/payment.routes";
import walletRoutes from "./modules/wallet/wallet.routes";
import refferalRoutes from "./modules/refferal/refferal.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import adminRoutes from "./modules/admin/admin.routes";
import adminAuthRoutes from "./modules/admin/admin.auth.routes";
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

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/custom-answers", answerRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/memory", memoryRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/refferals", refferalRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
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
